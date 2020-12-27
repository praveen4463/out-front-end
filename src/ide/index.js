import React, {
  useState,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {ThemeProvider, makeStyles} from '@material-ui/core/styles';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import {normalize} from 'normalizr';
import {ErrorBoundary} from 'react-error-boundary';
import {random, intersection} from 'lodash-es';
import axios from 'axios';
import Application from '../config/application';
import TopNavigation from './TopNavigation';
import Content from './Content';
import darkTheme from './Themes';
import {filesSchema, LastRunError, File} from './Explorer/model';
import {
  globalVarsSchema,
  buildVarsSchema,
  BuildVars,
  GlobalVars,
} from '../variables/model';
import {
  BATCH_ACTIONS,
  SET_FILES,
  VAR_SET,
  RESET_STATE,
  RUN_BUILD_UPDATE_BY_PROP,
  RUN_BUILD_ON_COMPLETED,
  RUN_BUILD_UPDATE_VERSION,
  RUN_BUILD_COMPLETE_ON_ERROR,
  PUSH_COMPLETED_BUILDS,
  DRY_COMPLETE_RUN,
  RUN_DRY_UPDATE_VERSION,
  RUN_DRY_COMPLETE_ON_ERROR,
  RUN_DRY_ON_COMPLETED,
  RUN_DRY_MARK_VERSION_STATUS,
  RUN_DRY_UPDATE_BY_PROP,
} from './actionTypes';
import {
  BUILD_UPDATE_BY_PROP,
  BUILD_START_RUN,
  BUILD_COMPLETE_RUN,
  BUILD_NEW_SESSION_SUCCESS,
  BUILD_NEW_SESSION_ERROR,
} from '../actions/actionTypes';
import batchActions, {getLastRunAction} from './actionCreators';
import {getBuildStoppingAction} from '../actions/actionCreators';
import stopBuildRunning from '../api/stopBuildRunning';
import {
  IdeDispatchContext,
  IdeStateContext,
  IdeProjectIdContext,
  IdeFilesContext,
  IdeEditorContext,
  IdeVersionIdsCodeSaveInProgressContext,
  IdeVarsContext,
  IdeBuildRunOngoingContext,
  IdeDryRunConfigContext,
  IdeBuildContext,
  IdeBuildConfigContext,
  IdeBuildRunContext,
  IdeDryContext,
  IdeDryRunContext,
  IdeParseContext,
  IdeParseRunContext,
  IdeDryRunOngoingContext,
  IdeParseRunOngoingContext,
  IdeCompletedBuildsContext,
  IdeLPContext,
} from './Contexts';
import explorerReducer from './reducers/explorer';
import editorReducer from './reducers/editor';
import varReducer from './reducers/var';
import ideReducer from './reducers/ide';
import dryConfigReducer from './reducers/dryConfig';
import buildConfigReducer from '../reducers/buildConfig';
import buildReducer from '../reducers/build';
import buildRunReducer from './reducers/buildRun';
import livePreviewReducer from './reducers/livePreview';
import dryReducer from './reducers/dry';
import dryRunReducer from './reducers/dryRun';
import parseReducer from './reducers/parse';
import parseRunReducer from './reducers/parseRun';
import RootErrorFallback, {rootErrorHandler} from '../ErrorBoundary';
import {
  VarTypes,
  Browsers,
  Platforms,
  ApiStatuses,
  RunType,
  TestStatus,
  Endpoints,
} from '../Constants';
import {TestProgress} from './Constants';
import Browser, {BuildConfig} from '../model';
import useSnackbarTypeError from '../hooks/useSnackbarTypeError';
import {
  versionsHaveParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
} from './common';
import {
  getNumberParamFromUrl,
  handleApiError,
  prepareEndpoint,
  getNewIntlComparer,
  getFilesWithTests,
} from '../common';

import './index.css';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
  },
}));

// This is the root state of IDE
const initialState = {
  projectId: getNumberParamFromUrl(Application.PROJECT_QS),
  files: null,
  versionIdsCodeSaveInProgress: new Set(),
  // build represents a new build request initiated upon user action
  build: {
    runOngoing: false,
    stopping: false,
    createNew: false,
    noBuildConfigIfValid: false, // explicit one off setting for skipping config, such as during reruns
    openBuildConfig: false,
    sessionRequestTime: null,
    buildId: null,
    buildKey: null,
    sessionId: null,
    sessionError: null,
    /* Either explicit or implicit versionIds selected for build. When user initiates
    new build by telling what need tested beforehand (for instance using context
    menu in explorer, editor panel's run button, re-run and run-failed), this
    will be assigned from that action and called implicit. When user doesn't tell
    implicitly and choose test selector in build config, those selected tests will
    be assigned here after sorting and filtering from original files.
    This should be reset after each build is run because config checks this and
    decides whether to show version select component. */
    versionIds: null, // sorted versionIds being tested
    runId: null,
  },
  // buildRun represents a running build
  buildRun: null, // instance of BuildRun created upon build.runOngoing
  // becomes true using build.versionIds
  livePreview: {
    runId: null,
    completed: false,
    buildId: null,
    buildKey: null,
    sessionId: null,
  },
  completedBuilds: [], // array of CompletedBuild instance
  dry: {
    runOngoing: false,
    stopping: false,
    versionIds: null, // sorted versionIds being tested
    runId: null,
  },
  dryRun: null, // instance of DryRun
  parse: {
    runOngoing: false,
    versionIds: null, // sorted versionIds being tested
    runId: null,
  },
  parseRun: null,
  config: {
    dry: {
      browser: new Browser(Browsers.CHROME.VALUE, '90'),
      platform: Platforms.WINDOWS.VALUE,
      // selectedBuildVarIdPerKey is an object containing pairs of buildVar.key and buildVar.id
      // just id is kept rather than whole object so that any update/rename in object will not have
      // to be made here.
      selectedBuildVarIdPerKey: {},
    },
    build: new BuildConfig(),
  },
  editor: {
    tabs: {
      maps: [], // mappings of tabVersionID, Tab as key-value pair 2D array
      temporaryTabVersionId: null,
      selectedTabVersionId: null,
    },
  },
  vars: {
    global: null,
    build: null,
  },
};

// - Reducers must be pure https://redux.js.org/basics/reducers#handling-actions
// - Don't use 'produce' on root reducer https://immerjs.github.io/immer/docs/example-reducer

// https://github.com/reduxjs/redux/issues/911
function ideRootReducer(state, action) {
  switch (action.type) {
    case BATCH_ACTIONS:
      return action.actions.reduce(ideRootReducer, state);
    default: {
      const {type} = action;
      if (type === RESET_STATE) {
        return initialState;
      }
      if (type.startsWith('EXP_')) {
        return explorerReducer(state, action);
      }
      if (type.startsWith('EDR_')) {
        return editorReducer(state, action);
      }
      if (type.startsWith('VAR_')) {
        return varReducer(state, action);
      }
      if (type.startsWith('BUILD_')) {
        return buildReducer(state, action);
      }
      if (type.startsWith('RUN_BUILD')) {
        return buildRunReducer(state, action);
      }
      if (type.startsWith('CONFIG_BUILD_')) {
        return buildConfigReducer(state, action);
      }
      if (type.startsWith('CONFIG_DRY_')) {
        return dryConfigReducer(state, action);
      }
      if (type.startsWith('LP_')) {
        return livePreviewReducer(state, action);
      }
      if (type.startsWith('DRY_')) {
        return dryReducer(state, action);
      }
      if (type.startsWith('RUN_DRY')) {
        return dryRunReducer(state, action);
      }
      if (type.startsWith('PARSE_')) {
        return parseReducer(state, action);
      }
      if (type.startsWith('RUN_PARSE')) {
        return parseRunReducer(state, action);
      }
      return ideReducer(state, action);
    }
  }
}

// TODO: This is the root component for IDE, on every dispatch it's state changes
// and it re renders, make sure you memoize child components those don't require
// a re render.
const Ide = () => {
  // !! after reducer has run for the first time, direct state updates won't
  // happen as state object will be locked.
  const [state, dispatch] = useReducer(ideRootReducer, initialState);
  const [loading, setLoading] = useState(false);
  const pendingNewSessionRequest = useRef(false);
  const brvsRef = useRef(null);
  const buildIdRef = useRef(null);
  const buildStoppingRef = useRef(null);
  const testProgressIntervalIdRef = useRef(null);
  const unmounted = useRef(false);
  buildIdRef.current = state.build.buildId;
  buildStoppingRef.current = state.build.stopping;
  testProgressIntervalIdRef.current =
    state.buildRun === null ? null : state.buildRun.testProgressIntervalId;
  const etVersions = state.files ? state.files.entities.versions : null;
  const dryStoppingRef = useRef(null);
  const drvsRef = useRef(null);
  dryStoppingRef.current = state.dry.stopping;
  const dryVersionIdsInSaveProgress = useMemo(
    () =>
      state.dryRun
        ? intersection(
            state.dryRun.versionIds,
            Array.from(state.versionIdsCodeSaveInProgress)
          )
        : null,
    [state.versionIdsCodeSaveInProgress, state.dryRun]
  );
  const buildVersionIdsInSaveProgress = useMemo(
    () =>
      state.buildRun
        ? intersection(
            state.buildRun.versionIds,
            Array.from(state.versionIdsCodeSaveInProgress)
          )
        : null,
    [state.versionIdsCodeSaveInProgress, state.buildRun]
  );
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const classes = useStyles();

  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  // Run an effect whenever projectId changes, this effectively runs the first
  // time IDE is loaded and checks whether a projectId is in uri (selected
  // from outside of IDE) and every time project selector is used to switch to
  // different project. We load project specific files and variables.
  useEffect(() => {
    const pId = state.projectId;
    if (!pId) {
      return;
    }
    // Currently there won't be an option to navigate through files and tests of
    // a project, and select one of them to edit in IDE, user just open IDE for
    // any file related work, they would just run builds and see previous runs from
    // outside. So, when IDE is opened, no file will be in explorer. We will however
    // add functionality to pass a fileId thru query string and that file if belong
    // to project will be opened in explorer. This is added so that tests can skip
    // file load. Near future we will add test/version from query string too.

    // Fetch all files of the project without their tests and fetch tests for only
    // file that in in qs (if any). Make sure files, tests within files, versions
    // within tests are ordered by name.

    const url = new URL(document.location);
    const qsParams = url.searchParams;
    // see if there is any file in qs
    const fileId = getNumberParamFromUrl(Application.FILE_QS);
    // set projectId in uri, so that if use bookmarks the url, they get the same
    // project selected later. Note that we're replacing history and not pushing
    // so that doing back button won't show previous projects cause we're not
    // reading history's popState event and not rendering page from history (routing)
    // IDE. This we will do in rest of the front end but IDE is purely browser state
    // dependent and nothing works using url. Project is taken in url as it is linked
    // with the rest of the site.
    qsParams.set(Application.PROJECT_QS, pId);
    const updatedUrl = `${url.origin}${url.pathname}?${qsParams}`;
    window.history.replaceState({url: updatedUrl}, null, updatedUrl);

    setLoading(true);

    // get data from api via separate requests in parallel
    const getFilesIdentifier = () => {
      return axios(prepareEndpoint(Endpoints.FILES, pId));
    };

    const getBuildVars = () => {
      return axios(prepareEndpoint(Endpoints.BUILD_VARS, pId));
    };

    const getGlobalVars = () => {
      return axios(prepareEndpoint(Endpoints.GLOBAL_VARS, pId));
    };

    const apiCalls = [getFilesIdentifier(), getBuildVars(), getGlobalVars()];
    if (fileId) {
      apiCalls.push(getFilesWithTests(fileId, pId));
    }
    Promise.all(apiCalls)
      .then((result) => {
        const [filesIdentifier, varsBuild, varsGlobal, fileWithTest] = result;

        // after receiving data, make sure to sort everything. For files with
        // tests, sort tests and versions within tests.
        const files = filesIdentifier.data.map((f) => {
          if (f.id === fileId && fileWithTest && fileWithTest.data.length) {
            // when fileId has no associated tests, fileWithTest is empty array
            const withTests = fileWithTest.data[0];
            withTests.tests.sort((a, b) =>
              getNewIntlComparer()(a.name, b.name)
            );
            withTests.tests.forEach((t) =>
              t.versions.sort((a, b) => getNewIntlComparer()(a.name, b.name))
            );
            // assign loadToTree = true to the incoming fileId
            return new File(
              withTests.id,
              withTests.name,
              withTests.tests,
              undefined,
              true
            );
          }
          return new File(f.id, f.name);
        });
        files.sort((a, b) => getNewIntlComparer()(a.name, b.name));

        const buildVars = varsBuild.data.map(
          (b) => new BuildVars(b.id, b.key, b.value, b.isPrimary)
        );
        buildVars.sort((a, b) => getNewIntlComparer()(a.key, b.key));

        const globalVars = varsGlobal.data.map(
          (g) => new GlobalVars(g.id, g.key, g.value)
        );
        globalVars.sort((a, b) => getNewIntlComparer()(a.key, b.key));

        // data processed, set to state.
        const actions = [];
        if (files.length) {
          const normalizedFiles = normalize(files, filesSchema);
          actions.push({type: SET_FILES, payload: {files: normalizedFiles}});
        }
        if (globalVars.length) {
          actions.push({
            type: VAR_SET,
            payload: {
              type: VarTypes.GLOBAL,
              value: normalize(globalVars, globalVarsSchema),
            },
          });
        }
        if (buildVars.length) {
          actions.push({
            type: VAR_SET,
            payload: {
              type: VarTypes.BUILD,
              value: normalize(buildVars, buildVarsSchema),
            },
          });
        }
        dispatch(batchActions(actions));
        setLoading(false);
      })
      .catch((error) => {
        handleApiError(
          error,
          setSnackbarErrorMsg,
          "Couldn't fetch project files"
        );
      });
  }, [state.projectId, setSnackbarErrorMsg]);

  brvsRef.current = useMemo(
    () =>
      state.buildRun
        ? state.buildRun.versionIds.map(
            (vid) => state.buildRun.buildRunVersions[vid]
          )
        : null,
    [state.buildRun]
  );

  drvsRef.current = useMemo(
    () =>
      state.dryRun
        ? state.dryRun.versionIds.map((vid) => state.dryRun.dryRunVersions[vid])
        : null,
    [state.dryRun]
  );

  useEffect(() => {
    if (!state.build.createNew || state.build.openBuildConfig) {
      return;
    }
    if (
      (!state.config.build.openLessOften &&
        !state.build.noBuildConfigIfValid) ||
      !(
        state.config.build.buildCapabilityId &&
        ((state.build.versionIds && state.build.versionIds.length) ||
          (state.config.build.selectedVersions &&
            state.config.build.selectedVersions.size))
      )
    ) {
      dispatch({
        type: BUILD_UPDATE_BY_PROP,
        payload: {prop: 'openBuildConfig', value: true},
      });
      return;
    }
    dispatch({
      type: BUILD_START_RUN,
    });
  }, [
    state.build.createNew,
    state.build.versionIds,
    state.config.build.buildCapabilityId,
    state.config.build.openLessOften,
    state.build.noBuildConfigIfValid,
    state.config.build.selectedVersions,
    state.build.openBuildConfig,
  ]);

  const checkTestProgress = useCallback(() => {
    // reset variables
    let pendingTestProgressApiResponse = false;
    let testProgressApiErrorCount = 0;
    // invoke function every one second but send api request only after last
    // request is completed.
    return setInterval(() => {
      if (unmounted.current) {
        clearInterval(testProgressIntervalIdRef.current);
        return;
      }
      // brvsRef.current will always be there as it gets created
      // upon new build request accepted, and this function is started when
      // session is received.
      if (pendingTestProgressApiResponse) {
        return;
      }
      // we've put brv into a ref otherwise updates to it won't be seen inside
      // this interval as it will capture the brv from beginning and won't see
      // updated one.
      const buildRunVersion = brvsRef.current.find(
        (v) => !v.status || v.status === TestStatus.RUNNING
      );
      if (!buildRunVersion) {
        // all versions updated, mark it done and cancel this interval.
        dispatch(
          batchActions([
            {type: BUILD_COMPLETE_RUN},
            {type: RUN_BUILD_ON_COMPLETED},
            {
              type: PUSH_COMPLETED_BUILDS,
              payload: {runId: state.build.runId, buildId: buildIdRef.current},
            },
          ])
        );
        return;
      }
      const onSuccess = (response) => {
        const {data} = response;
        const actions = [
          {
            type: RUN_BUILD_UPDATE_VERSION,
            payload: {versionId: buildRunVersion.versionId, data},
          },
        ];
        if (testProgressApiErrorCount > 0) {
          actions.push({
            type: RUN_BUILD_UPDATE_BY_PROP,
            payload: {
              prop: 'error',
              value: null,
            },
          });
          testProgressApiErrorCount = 0; // reset api error count on success
        }
        // update lastRun state of version when it completed execution (not when it aborted or stopped)
        if (
          data.status === TestStatus.SUCCESS ||
          data.status === TestStatus.ERROR
        ) {
          let lastRunError = null;
          if (data.status === TestStatus.ERROR) {
            const {error} = data;
            lastRunError = new LastRunError(error.msg, error.from, error.to);
          }
          let allOutput = buildRunVersion.output ?? '';
          if (allOutput) {
            allOutput += '\n';
          }
          allOutput += data.output;
          actions.push(
            getLastRunAction(
              buildRunVersion.versionId,
              RunType.BUILD_RUN,
              allOutput,
              lastRunError
            )
          );
        }
        dispatch(batchActions(actions));
      };
      const onError = (response) => {
        // TODO: check the reasons and try not to reattempt on certain errors from
        // which we can't recover.
        // TODO: wait exponentially, setInterval interval can't be set so use
        // setTimeout, invoke repeatedly after each process. Will have to track
        // state using a ref so that timeout can't be cancelled as a new timeout
        // is created every time and it's id not updated to state.
        testProgressApiErrorCount += 1;
        if (
          testProgressApiErrorCount === TestProgress.API_ERRORS_BEFORE_BAIL_OUT
        ) {
          // we've got api error several times in a row, let's bail out.
          dispatch(
            batchActions([
              {type: BUILD_COMPLETE_RUN},
              {
                type: RUN_BUILD_COMPLETE_ON_ERROR,
                payload: {
                  error: `There was a problem during build, ${response.error.reason}. Try rerunning in sometime.`,
                },
              },
            ])
          );
          return;
        }
        dispatch({
          type: RUN_BUILD_UPDATE_BY_PROP,
          payload: {
            prop: 'error',
            value: `${response.error.reason}. Retry attempt ${testProgressApiErrorCount}...`,
          },
        });
      };
      setTimeout(() => {
        // send build.buildId, buildRunVersion.versionId, and
        // buildRunVersion.nextOutputToken (if not null)
        // to api for build status and output. Api will create nextOutputToken
        // using date and append it to the params received. So the date of
        // last returned record is kept in condition of token and when token is
        // received, we fetch records post that date that.
        let whichResponse = random(1, 9);
        // enable following for checking api error situation.
        // let whichResponse = random(1, 10);
        // !! TODO: When this is replaced with api calls, remove stopping ref.
        if (buildStoppingRef.current) {
          whichResponse = 8;
        }
        let response;
        const shouldOutput = random(1, 10) <= 5;
        if (whichResponse <= 5) {
          response = {
            status: ApiStatuses.SUCCESS,
            data: {
              status: TestStatus.RUNNING,
              currentLine: random(1, 5),
              output: shouldOutput
                ? null
                : `This is an output from api with id ${random(1, 10)}`,
              // when there is no new output, api sends a null
              nextOutputToken: shouldOutput
                ? null
                : `Some token ${random(1, 10)}`, // when api doesn't have new
              // output it sends back the same token it received
            },
          };
        } else if (whichResponse === 6) {
          response = {
            status: ApiStatuses.SUCCESS,
            data: {
              status: TestStatus.SUCCESS,
              currentLine: 200,
              timeTaken: random(1000, 10000), // timeTaken will be in millis
              output: 'This output came in the end on success',
            },
          };
        } else if (whichResponse === 7) {
          response = {
            status: ApiStatuses.SUCCESS,
            data: {
              status: TestStatus.ERROR,
              currentLine: 150,
              timeTaken: random(1000, 10000),
              output: 'This output came in the end on error',
              error: {
                msg:
                  'ElementClickNotIntercepted Exception occurred while clicking on element line 3:12',
                from: {line: 3, ch: 12},
                // !!Note: api should always send the 'to' column that is after the 'to' char
                to: {line: 3, ch: 13},
              },
            },
          };
        } else if (whichResponse === 8) {
          response = {
            status: ApiStatuses.SUCCESS,
            data: {
              status: TestStatus.STOPPED,
              currentLine: 110,
              timeTaken: random(1000, 10000),
              output: 'This output came in the end on stop',
            },
          };
        } else if (whichResponse === 9) {
          response = {
            status: ApiStatuses.SUCCESS,
            data: {
              status: TestStatus.ABORTED,
              currentLine: 101,
              timeTaken: random(1000, 10000),
              output: 'This output came in the end on aborted',
            },
          };
        } else if (whichResponse === 10) {
          response = {
            status: ApiStatuses.ERROR,
            error: {
              reason: 'Network error',
            },
          };
        }
        // as response is received, check if component is unmounted, if so, return
        if (unmounted.current) {
          clearInterval(testProgressIntervalIdRef.current);
          return;
        }
        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess(response);
        } else if (response.status === ApiStatuses.ERROR) {
          onError(response);
        }
        pendingTestProgressApiResponse = false;
      }, 2000);
      pendingTestProgressApiResponse = true;
    }, TestProgress.POLL_TIME);
  }, [state.build.runId]);

  // Don't start new session if there is any version being saved, so that we wait
  // until all code is saved and have updated their lastRun state that is then
  // checked for parsing. Make sure to put a condition on buildRun.completed so
  // that we know we're looking at the current buildRun. The benefit of that is
  // we never get into race conditions with version save progress check. When a run
  // initiates, we first make runOngoing true. This is listen by tab panel which
  // triggers code change event that will push the version whose code is being changed.
  // A new buildRun instance is then created and after that this effect run, giving
  // enough time for version to push through and get checked in here.
  // !! Don't start new session request until we've created buildRun from outside.
  // This is done so that before api is invoked, we've captured updated state
  // and thus the interval that checks on test progress gets the buildRun object,
  // if this is not done, and buildRun updates after api request starts, it won't
  // updated state value because state is replaced by new object and the closure
  // created in async call captures that value,
  // https://github.com/facebook/react/issues/14010
  useEffect(() => {
    if (
      !(
        state.build.runOngoing &&
        state.buildRun &&
        !state.buildRun.completed &&
        !state.build.sessionId &&
        !pendingNewSessionRequest.current &&
        !buildVersionIdsInSaveProgress.length &&
        versionsHaveLastParseStatus(etVersions, state.buildRun.versionIds)
      )
    ) {
      return;
    }
    // first validate all versions parse status and don't request new session if
    // there are parse errors in any of selected test. Build will be marked
    // completed from output panel in this situation and not from here so that
    // it gets a chance to show the error without running into situations where
    // this code resets build first before output panel can render even the files.
    if (
      versionsHaveParseErrorWhenStatusAvailable(
        etVersions,
        state.buildRun.versionIds
      )
    ) {
      return;
    }
    // call api for new session
    dispatch({
      type: BUILD_UPDATE_BY_PROP,
      payload: {prop: 'sessionRequestTime', value: Date.now()},
    });
    const onSuccess = (response) => {
      // setup test progress interval
      const intervalId = checkTestProgress();
      const {buildId, buildKey, sessionId} = response.data;
      dispatch(
        batchActions([
          {
            type: BUILD_NEW_SESSION_SUCCESS,
            payload: {buildId, buildKey, sessionId},
          },
          {
            type: RUN_BUILD_UPDATE_BY_PROP,
            payload: {prop: 'testProgressIntervalId', value: intervalId},
          },
        ])
      );
    };
    const onError = (response) => {
      const payload = {
        error: `Couldn't start build, ${response.error.reason}`,
      };
      dispatch(
        batchActions([
          {
            type: BUILD_NEW_SESSION_ERROR,
            payload,
          },
          {
            type: RUN_BUILD_COMPLETE_ON_ERROR,
            payload,
          },
        ])
      );
    };
    setTimeout(() => {
      // send buildConfig, buildRun.versionIds and expect new session data
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          buildId: random(1000, 10000),
          buildKey: `${random(1000, 10000)}`,
          sessionId: `${random(1000, 10000)}`,
        },
      };
      /* const response = {
        status: ApiStatuses.FAILURE,
        error: {
          reason: 'internal error occurred while starting build machine',
        },
      }; */
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response);
      } else if (response.status === ApiStatuses.FAILURE) {
        onError(response);
      }
      pendingNewSessionRequest.current = false;
    }, 2000);
    pendingNewSessionRequest.current = true;
  }, [
    state.build.runOngoing,
    state.buildRun,
    state.build.sessionId,
    etVersions,
    checkTestProgress,
    buildVersionIdsInSaveProgress,
  ]);

  // check stopping and send api request
  // Note that similar code is not needed for dry as it check stopping inside
  // progress function and stop versions.
  useEffect(() => {
    if (!(state.build.stopping && state.build.sessionId)) {
      return;
    }
    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't stop build, ${response.error.reason}`);
      dispatch(getBuildStoppingAction(false));
    };
    stopBuildRunning(state.build.buildId, () => null, onError);
    // after stop is sent to api, it will attempt to stop any pending tests and
    // the progress interval will get stopped states for those tests.
  }, [
    state.build.stopping,
    state.build.sessionId,
    state.build.buildId,
    setSnackbarErrorMsg,
  ]);

  const runDry = useCallback(() => {
    if (unmounted.current) {
      return;
    }
    const drv = drvsRef.current.find((v) => !v.status);
    if (!drv) {
      // all versions updated, mark it done.
      dispatch(
        batchActions([{type: DRY_COMPLETE_RUN}, {type: RUN_DRY_ON_COMPLETED}])
      );
      return;
    }
    const {versionId} = drv;
    if (dryStoppingRef.current) {
      dispatch({
        type: RUN_DRY_UPDATE_VERSION,
        payload: {
          versionId,
          data: {
            status: TestStatus.STOPPED,
            timeTaken: 0,
            output: 'Stopped',
          },
        },
      });
      runDry();
      return;
    }
    const onSuccess = (response) => {
      const {data} = response;
      const actions = [
        {
          type: RUN_DRY_UPDATE_VERSION,
          payload: {versionId, data},
        },
      ];
      // update lastRun state of version when it completed execution (not when stopped)
      if (
        data.status === TestStatus.SUCCESS ||
        data.status === TestStatus.ERROR
      ) {
        let lastRunError = null;
        if (data.status === TestStatus.ERROR) {
          const {error} = data;
          lastRunError = new LastRunError(error.msg, error.from, error.to);
        }
        actions.push(
          getLastRunAction(
            versionId,
            RunType.DRY_RUN,
            data.output,
            lastRunError
          )
        );
      }
      dispatch(batchActions(actions));
      runDry();
    };
    const onError = (response) => {
      dispatch(
        batchActions([
          {type: DRY_COMPLETE_RUN},
          {
            type: RUN_DRY_COMPLETE_ON_ERROR,
            payload: {
              error: `Can't complete dry run, ${response.error.reason}.`,
            },
          },
        ])
      );
    };
    setTimeout(() => {
      // send versionId, dry run config to api and expect success or failure.
      const whichResponse = random(1, 9);
      // enable following for checking api error situation.
      // const whichResponse = random(1, 10);
      let response;
      if (whichResponse <= 7) {
        response = {
          status: ApiStatuses.SUCCESS,
          data: {
            status: TestStatus.SUCCESS,
            timeTaken: random(1000, 1500), // timeTaken will be in millis
            output: 'This output came in the end on success',
          },
        };
      } else if (whichResponse <= 9) {
        response = {
          status: ApiStatuses.SUCCESS,
          data: {
            status: TestStatus.ERROR,
            timeTaken: random(100, 500),
            output: 'This output came in the end on error',
            error: {
              msg: 'Array index out of range line 3:12',
              from: {line: 3, ch: 12},
              // !!Note: api should always send the 'to' column that is after the 'to' char
              to: {line: 3, ch: 13},
            },
          },
        };
      } else if (whichResponse === 10) {
        response = {
          status: ApiStatuses.ERROR,
          error: {
            reason: 'Network error',
          },
        };
      }
      // as response is received, check if component is unmounted, if so, return
      if (unmounted.current) {
        return;
      }
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response);
      } else if (response.status === ApiStatuses.ERROR) {
        onError(response);
      }
    }, 2000);
    // when a version is submitted for dry run, mark it running so that we can
    // show it in running status (dry run has no running state in api, we submit
    // dry run and receive it's final result)
    dispatch({
      type: RUN_DRY_MARK_VERSION_STATUS,
      payload: {versionId, status: TestStatus.RUNNING},
    });
  }, []);

  useEffect(() => {
    if (
      !(
        state.dryRun &&
        !state.dryRun.completed &&
        !state.dryRun.inProgress &&
        !dryVersionIdsInSaveProgress.length &&
        versionsHaveLastParseStatus(etVersions, state.dryRun.versionIds)
      )
    ) {
      return;
    }
    if (
      versionsHaveParseErrorWhenStatusAvailable(
        etVersions,
        state.dryRun.versionIds
      )
    ) {
      return;
    }
    dispatch({
      type: RUN_DRY_UPDATE_BY_PROP,
      payload: {prop: 'inProgress', value: true},
    });
    runDry();
  }, [etVersions, runDry, state.dryRun, dryVersionIdsInSaveProgress]);

  return (
    <ThemeProvider theme={darkTheme}>
      <ErrorBoundary
        FallbackComponent={RootErrorFallback}
        onReset={() => dispatch({type: RESET_STATE})}
        onError={rootErrorHandler}>
        <IdeDispatchContext.Provider value={dispatch}>
          <IdeStateContext.Provider value={state}>
            <IdeProjectIdContext.Provider value={state.projectId}>
              <IdeFilesContext.Provider value={state.files}>
                <IdeEditorContext.Provider value={state.editor}>
                  <IdeVersionIdsCodeSaveInProgressContext.Provider
                    value={state.versionIdsCodeSaveInProgress}>
                    <IdeVarsContext.Provider value={state.vars}>
                      <IdeBuildRunOngoingContext.Provider
                        value={state.build.runOngoing}>
                        <IdeDryRunConfigContext.Provider
                          value={state.config.dry}>
                          <IdeBuildContext.Provider value={state.build}>
                            <IdeBuildConfigContext.Provider
                              value={state.config.build}>
                              <IdeBuildRunContext.Provider
                                value={state.buildRun}>
                                <IdeDryContext.Provider value={state.dry}>
                                  <IdeDryRunContext.Provider
                                    value={state.dryRun}>
                                    <IdeDryRunOngoingContext.Provider
                                      value={state.dry.runOngoing}>
                                      <IdeParseRunOngoingContext.Provider
                                        value={state.parse.runOngoing}>
                                        <IdeParseContext.Provider
                                          value={state.parse}>
                                          <IdeParseRunContext.Provider
                                            value={state.parseRun}>
                                            <IdeCompletedBuildsContext.Provider
                                              value={state.completedBuilds}>
                                              <IdeLPContext.Provider
                                                value={state.livePreview}>
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%',
                                                    margin: 0,
                                                  }}>
                                                  <div
                                                    style={{
                                                      display: 'flex',
                                                      flex: '1 1 auto',
                                                    }}>
                                                    <div
                                                      style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        position: 'fixed',
                                                        left: 0,
                                                        right: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                      }}>
                                                      <TopNavigation />
                                                      <Content />
                                                    </div>
                                                  </div>
                                                </div>
                                              </IdeLPContext.Provider>
                                            </IdeCompletedBuildsContext.Provider>
                                          </IdeParseRunContext.Provider>
                                        </IdeParseContext.Provider>
                                      </IdeParseRunOngoingContext.Provider>
                                    </IdeDryRunOngoingContext.Provider>
                                  </IdeDryRunContext.Provider>
                                </IdeDryContext.Provider>
                              </IdeBuildRunContext.Provider>
                            </IdeBuildConfigContext.Provider>
                          </IdeBuildContext.Provider>
                        </IdeDryRunConfigContext.Provider>
                      </IdeBuildRunOngoingContext.Provider>
                    </IdeVarsContext.Provider>
                  </IdeVersionIdsCodeSaveInProgressContext.Provider>
                </IdeEditorContext.Provider>
              </IdeFilesContext.Provider>
            </IdeProjectIdContext.Provider>
          </IdeStateContext.Provider>
        </IdeDispatchContext.Provider>
      </ErrorBoundary>
      {snackbarTypeError}
      <Backdrop className={classes.backdrop} open={loading}>
        <CircularProgress color="primary" size="8rem" thickness={1} />
      </Backdrop>
    </ThemeProvider>
  );
};

export default Ide;

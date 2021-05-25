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
import intersection from 'lodash-es/intersection';
import axios from 'axios';
import {useLocation, useHistory} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import TopNavigation from './TopNavigation';
import Content from './Content';
import darkTheme from './Themes';
import {filesSchema, LastRunError, File, Test, Version} from './Explorer/model';
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
  CLEAR_VERSIONS_LAST_RUN,
  RUN_DRY_RESET_VERSION,
  SET_PROJECT,
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
import {
  VarTypes,
  Browsers,
  Platforms,
  RunType,
  TestStatus,
  Endpoints,
  Timeouts,
  BuildSourceType,
  OFFLINE_MSG,
  OFFLINE_RECOVERY_TIME,
  SearchKeys,
} from '../Constants';
import {TestProgress} from './Constants';
import Browser, {BuildConfig} from '../model';
import useSnackbarTypeError from '../hooks/useSnackbarTypeError';
import {
  versionsHaveParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
  getDryRunEndpoint,
} from './common';
import {
  getNumberParamFromUrl,
  handleApiError,
  prepareEndpoint,
  getNewIntlComparer,
  getFilesWithTests,
  fromJson,
  getNewBuildEndpoint,
  getStopBuildEndpoint,
  getBuildStatusEndpoint,
  removeFromSearchQuery,
} from '../common';
import useRequiredAuth from '../hooks/useRequiredAuth';
import PageLoadingIndicator from '../components/PageLoadingIndicator';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
  },
}));

const EXP_WAIT_MAX = 15000;

// This is the root state of IDE
const initialState = {
  projectId: null,
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
    filteredNoCodeVersions: false,
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
  const auth = useRequiredAuth();
  // !! after reducer has run for the first time, direct state updates won't
  // happen as state object will be locked.
  const [state, dispatch] = useReducer(ideRootReducer, initialState);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const pendingNewSessionRequest = useRef(false);
  const brvsRef = useRef(null);
  const buildIdRef = useRef(null);
  const testProgressIntervalIdRef = useRef(null);
  const unmounted = useRef(false);
  buildIdRef.current = state.build.buildId;
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
  const projectIdInSearch = useMemo(
    () => getNumberParamFromUrl(SearchKeys.PROJECT_QS, location.search),
    [location.search]
  );
  const classes = useStyles();

  // !!This is a workaround to set body background for IDE for now, don't use a
  // css because once IDE loads and css applies, it applies to all components as
  // there is just one page.
  useEffect(() => {
    document.body.style.backgroundColor = '#121212';
    return () => {
      unmounted.current = true;
      document.body.style.backgroundColor = '#FFFFFF';
    };
  }, []);

  // This effect runs when projectId changes , it updates projectId
  // to state. We could have removed projectId from state as it's in qs but
  // I am keeping it as it was as is from beginning and not changing it for now.
  useEffect(() => {
    if (!projectIdInSearch) {
      return;
    }
    dispatch(
      batchActions([
        {
          type: RESET_STATE,
        },
        {
          type: SET_PROJECT,
          payload: {projectId: projectIdInSearch},
        },
      ])
    );
  }, [projectIdInSearch]);

  const loadDataPerProject = useCallback(() => {
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

    setLoading(true);

    // get data from api via separate requests in parallel
    const getFilesIdentifier = () =>
      axios(prepareEndpoint(Endpoints.FILES, pId));

    const getBuildVars = () =>
      axios(prepareEndpoint(Endpoints.BUILD_VARS, pId));

    const getGlobalVars = () =>
      axios(prepareEndpoint(Endpoints.GLOBAL_VARS, pId));

    const apiCalls = [getFilesIdentifier(), getBuildVars(), getGlobalVars()];
    // see if there is any file in qs
    const fileId = getNumberParamFromUrl(SearchKeys.FILE_QS);
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
            withTests.tests = withTests.tests.map((t) => fromJson(Test, t));
            withTests.tests.sort((a, b) =>
              getNewIntlComparer()(a.name, b.name)
            );
            withTests.tests.forEach((t) => {
              // eslint-disable-next-line no-param-reassign
              t.versions = t.versions.map((v) => fromJson(Version, v));
              t.versions.sort((a, b) => getNewIntlComparer()(a.name, b.name));
            });
            // assign loadToTree = true to the incoming fileId
            withTests.loadToTree = true;
            return fromJson(File, withTests);
          }
          return fromJson(File, f);
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
      })
      .catch((error) => {
        handleApiError(
          error,
          setSnackbarErrorMsg,
          "Couldn't fetch project files"
        );
      })
      .finally(() => setLoading(false));
  }, [state.projectId, setSnackbarErrorMsg]);

  // This effect checks whether an error boundary for ide was reset after an error,
  // and if so, resets the state of ide.
  useEffect(() => {
    const resetOnError = getNumberParamFromUrl(
      SearchKeys.RESET_ON_ERROR,
      location.search
    );
    if (resetOnError !== 1) {
      return;
    }
    // first reset state but keep projectId intact otherwise data won't fetch
    // seeing project null
    dispatch(
      batchActions([
        {
          type: RESET_STATE,
        },
        {
          type: SET_PROJECT,
          payload: {projectId: projectIdInSearch},
        },
      ])
    );
    // remove reset param from search, do it before fetching data.
    removeFromSearchQuery(location, history, SearchKeys.RESET_ON_ERROR);
    // fetch data, the function doesn't invoke itself cause after the above
    // dispatch completes, projectId remains unchanged.
    loadDataPerProject(); // after state is reset, load data afresh
  }, [
    history,
    loadDataPerProject,
    location,
    location.search,
    projectIdInSearch,
  ]);

  // Run an effect whenever projectId changes, this effectively runs the first
  // time IDE is loaded and every time project selector is used to switch to
  // different project. We load project specific files and variables.
  useEffect(() => {
    if (!auth.user) {
      return;
    }
    loadDataPerProject();
  }, [auth.user, loadDataPerProject]);

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
    // state variables
    let pendingTestProgressApiResponse = false;
    let waitingInternallyForErrorRecovery = false;
    let serverUnreachableErrorCount = 0;
    const getSetErrorAction = (errorMsg) => ({
      type: RUN_BUILD_UPDATE_BY_PROP,
      payload: {
        prop: 'error',
        value: errorMsg,
      },
    });
    // invoke function every one second but send api request only after last
    // request is completed or wait for error recovery.
    return setInterval(() => {
      if (unmounted.current) {
        clearInterval(testProgressIntervalIdRef.current);
        return;
      }
      // brvsRef.current will always be there as it gets created
      // upon new build request accepted, and this function is started when
      // session is received.
      if (pendingTestProgressApiResponse || waitingInternallyForErrorRecovery) {
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

      const setError = (errorMsg) => {
        dispatch(getSetErrorAction(errorMsg));
      };
      const halt = (errorMsg) => {
        dispatch(
          batchActions([
            {type: BUILD_COMPLETE_RUN},
            {
              type: RUN_BUILD_COMPLETE_ON_ERROR,
              payload: {
                error: errorMsg,
              },
            },
          ])
        );
      };
      async function getBuildStatus() {
        try {
          const {data} = await axios(
            getBuildStatusEndpoint(
              buildIdRef.current,
              buildRunVersion.versionId
            ),
            {
              params: {
                nextOutputToken: buildRunVersion.nextOutputToken,
              },
            }
          );
          if (!data.status) {
            // no status returned.
            // TODO: for now leave it as is but we need to put a check here that
            // if this happens more than a few times in row (anytime during the progress)
            // check, there may be some serious problem that must be checked asap.
            return; // continue to next call
          }
          // return if component is unmounted
          if (unmounted.current) {
            clearInterval(testProgressIntervalIdRef.current);
            return;
          }
          const actions = [
            {
              type: RUN_BUILD_UPDATE_VERSION,
              payload: {versionId: buildRunVersion.versionId, data},
            },
          ];
          if (serverUnreachableErrorCount > 0) {
            actions.push(getSetErrorAction(null)); // reset the error shown
            serverUnreachableErrorCount = 0; // reset error count on success
          }
          const {status, output, error} = data;
          // update lastRun state of version when it completed execution (not when it aborted or stopped)
          if (status === TestStatus.SUCCESS || status === TestStatus.ERROR) {
            let lastRunError = null;
            if (status === TestStatus.ERROR) {
              lastRunError = new LastRunError(error.msg, error.from, error.to);
            }
            let allOutput = buildRunVersion.output;
            if (allOutput) {
              allOutput += '\n';
            } else {
              allOutput = '';
            }
            allOutput += output;
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
        } catch (error) {
          // check if there is no network, wait until it's there
          if (!navigator.onLine) {
            waitingInternallyForErrorRecovery = true;
            const offlineStart = Date.now();
            setError(OFFLINE_MSG);
            const offlineCheckInterval = setInterval(() => {
              if (navigator.onLine) {
                setError(null);
                clearInterval(offlineCheckInterval);
                waitingInternallyForErrorRecovery = false;
                return; // continue to progress check
              }
              if (Date.now() - offlineStart > OFFLINE_RECOVERY_TIME) {
                clearInterval(offlineCheckInterval);
                halt(
                  "Can't get build progress as you're offline. Build progress" +
                    " can be viewed from builds page once you're connected to network"
                );
              }
            }, 500);
            return;
          }
          if (!error.response && error.request) {
            // no response received, server unreachable.
            waitingInternallyForErrorRecovery = true;
            serverUnreachableErrorCount += 1;
            if (serverUnreachableErrorCount > 10) {
              halt(
                "Can't fetch build progress as the server is unreachable," +
                  " however the build is unaffected. We've been notified and are" +
                  ' looking into the problem. You can try viewing build progress' +
                  ' from builds page in sometime'
              );
              return;
            }
            setError(
              `Server is unreachable. Retry attempt ${serverUnreachableErrorCount}...`
            );
            const wait = 2000 * serverUnreachableErrorCount;
            setTimeout(
              () => {
                waitingInternallyForErrorRecovery = false;
              },
              wait > EXP_WAIT_MAX ? EXP_WAIT_MAX : wait
            );
            return;
          }
          // we've an api error, give up.
          // TODO: later api can identify which errors could be retried, so that
          // we can save the process and retry from here.
          // don't use the error message produced by handleApiError, as we want
          // custom made function and know that api returns a similar one cause
          // it's an apis unexpected exception.
          handleApiError(
            error,
            () =>
              halt(
                "Can't fetch build progress as an exception occurred at server," +
                  " however the build is running. We've been notified and are" +
                  ' fixing it. You can try viewing build progress' +
                  ' from builds page in sometime or contact us if you see similar error'
              ),
            ''
          );
        } finally {
          pendingTestProgressApiResponse = false;
        }
      }
      getBuildStatus();
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
    async function sendSessionRequest() {
      const {
        buildCapabilityId,
        displayResolution,
        timezone,
        selectedBuildVarIdPerKey,
        abortOnFailure,
        aetKeepSingleWindow,
        aetUpdateUrlBlank,
        aetResetTimeouts,
        aetDeleteAllCookies,
      } = state.config.build;
      try {
        const {data} = await axios.post(
          getNewBuildEndpoint(state.projectId),
          {
            buildCapabilityId,
            displayResolution,
            timezone,
            selectedBuildVarIdPerKey,
            runnerPreferences: {
              abortOnFailure,
              aetKeepSingleWindow,
              aetUpdateUrlBlank,
              aetResetTimeouts,
              aetDeleteAllCookies,
            },
            buildSourceType: BuildSourceType.IDE,
            versionIds: state.buildRun.versionIds,
          },
          {
            timeout: Timeouts.API_TIMEOUT_LONG,
          }
        );
        // setup test progress interval
        const intervalId = checkTestProgress();
        const {
          sessionId,
          buildIdentifier: {buildId, buildKey},
        } = data;
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
      } catch (e) {
        handleApiError(
          e,
          (errorMsg) => {
            const payload = {
              error: errorMsg,
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
          },
          "Couldn't start build"
        );
      } finally {
        pendingNewSessionRequest.current = false;
      }
    }
    sendSessionRequest();
    pendingNewSessionRequest.current = true;
  }, [
    state.build.runOngoing,
    state.buildRun,
    state.build.sessionId,
    etVersions,
    checkTestProgress,
    buildVersionIdsInSaveProgress,
    state.config.build,
    state.projectId,
  ]);

  // check stopping and send api request
  // Note that similar code is not needed for dry as it check stopping inside
  // progress function and stop versions.
  useEffect(() => {
    if (!(state.build.stopping && state.build.sessionId)) {
      return;
    }
    async function sendStop() {
      try {
        await axios.patch(getStopBuildEndpoint(state.build.buildId), {
          timeout: Timeouts.API_TIMEOUT_SMALL,
        });
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => {
            setSnackbarErrorMsg(errorMsg);
            dispatch(getBuildStoppingAction(false));
          },
          "Couldn't stop build"
        );
      }
    }
    sendStop();
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

    async function sendDryRun() {
      try {
        const {data} = await axios.post(
          getDryRunEndpoint(state.projectId, versionId),
          state.config.dry
        );
        // as response is received, check if component is unmounted, if so, return
        if (unmounted.current) {
          return;
        }
        if (!data.status) {
          // api doesn't set a status, set it here based on error
          data.status = data.error ? TestStatus.ERROR : TestStatus.SUCCESS;
        }
        const actions = [
          {
            type: RUN_DRY_UPDATE_VERSION,
            payload: {versionId, data},
          },
        ];
        // update lastRun state of version when it completed execution (not when stopped)
        let lastRunError = null;
        if (data.error) {
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
        dispatch(batchActions(actions));
        runDry();
      } catch (error) {
        // We get an exception while running dryRun, we must clear lastRun of
        // all versionIds that are pending or in running state (current one).
        const versionIdsPending = drvsRef.current
          .filter((v) => !v.status || v.status === TestStatus.RUNNING)
          .map((v) => v.versionId);
        handleApiError(
          error,
          (errorMsg) =>
            dispatch(
              batchActions([
                {type: DRY_COMPLETE_RUN},
                {
                  type: RUN_DRY_COMPLETE_ON_ERROR,
                  payload: {
                    error: errorMsg,
                  },
                },
                // clear current version's status so that it won't remain in running
                // state.
                {
                  type: RUN_DRY_RESET_VERSION,
                  payload: {
                    versionId,
                  },
                },
                {
                  type: CLEAR_VERSIONS_LAST_RUN,
                  payload: {
                    versionIds: versionIdsPending,
                    runType: RunType.DRY_RUN,
                  },
                },
              ])
            ),
          "Can't complete dry run"
        );
      }
    }

    sendDryRun();
    // when a version is submitted for dry run, mark it running so that we can
    // show it in running status (dry run has no running state in api, we submit
    // dry run and receive it's final result)
    dispatch({
      type: RUN_DRY_MARK_VERSION_STATUS,
      payload: {versionId, status: TestStatus.RUNNING},
    });
  }, [state.config.dry, state.projectId]);

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

  if (!auth.user) {
    return <PageLoadingIndicator loadingText="Loading IDE" />;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Helmet title="Zylitics IDE: write, parse, debug, and run tests." />
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
                      <IdeDryRunConfigContext.Provider value={state.config.dry}>
                        <IdeBuildContext.Provider value={state.build}>
                          <IdeBuildConfigContext.Provider
                            value={state.config.build}>
                            <IdeBuildRunContext.Provider value={state.buildRun}>
                              <IdeDryContext.Provider value={state.dry}>
                                <IdeDryRunContext.Provider value={state.dryRun}>
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
      {snackbarTypeError}
      <Backdrop className={classes.backdrop} open={loading}>
        <CircularProgress color="primary" size="8rem" thickness={1} />
      </Backdrop>
    </ThemeProvider>
  );
};

export default Ide;

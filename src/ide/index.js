import React, {
  useState,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {ThemeProvider, makeStyles} from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import {normalize} from 'normalizr';
import {ErrorBoundary} from 'react-error-boundary';
import {random} from 'lodash-es';
import TopNavigation from './TopNavigation';
import Content from './Content';
import darkTheme from './Themes';
import {files as sampleFiles} from './Explorer/sample';
import {
  globalVars as sampleGlobalVars,
  buildVars as sampleBuildVars,
} from '../variables/sample';
import {filesSchema, LastRunError} from './Explorer/model';
import {globalVarsSchema, buildVarsSchema} from '../variables/model';
import {
  BATCH_ACTIONS,
  SET_FILES,
  VAR_SET,
  RESET_STATE_ON_ERROR,
  RUN_BUILD_UPDATE_BY_PROP,
  RUN_BUILD_ON_COMPLETED,
  RUN_BUILD_UPDATE_VERSION,
  RUN_BUILD_COMPLETE_ON_ERROR,
  PUSH_COMPLETED_BUILDS,
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
  IdeFilesContext,
  IdeEditorContext,
  IdeVarsContext,
  IdeBuildRunOngoingContext,
  IdeDryRunConfigContext,
  IdeBuildContext,
  IdeBuildConfigContext,
  IdeBuildRunContext,
  IdeDryContext,
  IdeParseContext,
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
import RootErrorFallback, {rootErrorHandler} from '../ErrorBoundary';
import {
  VarTypes,
  Browsers,
  Platforms,
  ApiStatuses,
  RunType,
  TestStatus,
} from '../Constants';
import {TestProgress} from './Constants';
import Browser, {BuildConfig} from '../model';
import useSnackbarTypeError from '../hooks/useSnackbarTypeError';
import {
  versionsHaveParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
} from './common';
import './index.css';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
  },
  circle: {
    marginBottom: '10%',
  },
}));

// This is the root state of IDE
const initialState = {
  projectId: new URLSearchParams(document.location.search).get('project'),
  files: null,
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
  completedBuilds: [],
  dry: {
    runOngoing: false,
    stopping: false,
  },
  dryRun: null,
  parse: {
    runOngoing: false,
    stopping: false,
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
      if (type === RESET_STATE_ON_ERROR) {
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
  const [allSet, setAllSet] = useState(false);
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
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const classes = useStyles();

  useEffect(() => {
    /*
    - Fetching and populating files into state:
      - User may visit IDE choosing either a file/test/version. If version is
        selected, we've all 3 ids in qs, if test, we've file/test ids in qs,
        if file was selected we've just fileId in qs.
      - if no file exists yet, we won't get fileId in qs.
      - projectId is always in qs unless user hasn't selected a project or none
        exist yet.
      - when version was selected, code of that should be opened in editor,
        when test, code of it's latest (with tree expanded and focused on that)
      - Based on whether a file is received, fetch all it's tests/versions.
        Also fetch other files within the project but only file part, no tests.
        this should be done using single api, after api returns validate
        response using a json-schema.
      - make sure all content is ordered, i.e files, tests, versions should be
        in ascending order within their parent.
    - We'll also fetch a few other things here:
      - globals and build variables
    */
    const qsParams = new URLSearchParams(document.location.search);
    // TODO: remove '?? 1' after test done
    const fileId = qsParams.get('file') ?? 1;
    // TODO: implement selecting and opening test/version in explorer based
    // on the incoming file/test.
    /* const testId = qsParams.get('test');
    const versionId = qsParams.get('version'); */
    // Send to api fileId (if not null) and get list of files, only the given
    // fileId will have it's tests fetched.
    const actions = [];
    // eslint-disable-next-line no-unused-vars
    const onSuccess = (files, globals, build) => {
      // simulating
      // assume sampleFiles is what we got from api (it's actually argument 'files')
      if (Array.isArray(sampleFiles) && sampleFiles.length) {
        const normalizedFiles = normalize(sampleFiles, filesSchema);
        if (normalizedFiles.result.includes(fileId)) {
          normalizedFiles.entities.files[fileId].loadToTree = true;
        }
        actions.push({type: SET_FILES, payload: {files: normalizedFiles}});
      }
      if (Array.isArray(sampleGlobalVars) && sampleGlobalVars.length) {
        actions.push({
          type: VAR_SET,
          payload: {
            type: VarTypes.GLOBAL,
            value: normalize(sampleGlobalVars, globalVarsSchema),
          },
        });
      }
      if (Array.isArray(sampleBuildVars) && sampleBuildVars.length) {
        actions.push({
          type: VAR_SET,
          payload: {
            type: VarTypes.BUILD,
            value: normalize(sampleBuildVars, buildVarsSchema),
          },
        });
      }
      dispatch(batchActions(actions));
      // set allSet after all the data required on load by ide is fetched,
      // there could be multiple promises so, this code need to be run when
      // all of them are resolved or one of them have error.
      setAllSet(true);
    };
    // simulate api call using setTimeout
    setTimeout(onSuccess, 50);
    // invoke following error handler when an error occurs
    // eslint-disable-next-line no-unused-vars
    const onError = (error) => {
      // Note: If some error occurs during fetch of files, there are some options
      // such as asking user to reload through a modal dialog,
      // sending to an error page, showing snackbar etc.
    };
    // !! set unmounted here in this effect as this has no dependencies and run
    // just once on mount and unmount.
    return () => {
      unmounted.current = true;
    };
  }, []);

  brvsRef.current = useMemo(
    () =>
      state.buildRun ? Object.values(state.buildRun.buildRunVersions) : null,
    [state.buildRun]
  );

  useEffect(() => {
    if (!state.build.createNew) {
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
              payload: {buildId: buildIdRef.current},
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
          actions.push(
            getLastRunAction(
              buildRunVersion.versionId,
              RunType.BUILD_RUN,
              data.output,
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
                  error: `Couldn't fetch test status, ${response.error.reason}. Try rerunning in sometime.`,
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
        // to api for build status and output
        let whichResponse = random(1, 9);
        // enable following for checking api error situation.
        // let whichResponse = random(1, 10);
        // When this is replaced with api calls, remove stopping ref.
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
        // as response is received, check if componen is unmounted, if so, return
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
  }, []);

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
        !state.build.sessionId &&
        !pendingNewSessionRequest.current &&
        versionsHaveLastParseStatus(etVersions, state.build.versionIds)
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
        state.build.versionIds
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
    state.build.versionIds,
    etVersions,
    checkTestProgress,
  ]);

  // check stopping and send api request
  useEffect(() => {
    if (!state.build.stopping) {
      return;
    }
    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't stop build, ${response.error.reason}`);
      dispatch(getBuildStoppingAction(false));
    };
    stopBuildRunning(state.build.buildId, () => null, onError);
    // after stop is sent to api, it will attempt to stop any pending tests and
    // the progress interval will get stopped states for those tests.
  }, [state.build.stopping, state.build.buildId, setSnackbarErrorMsg]);

  // TODO: handle stopping of parse and dry by breaking the interval

  if (!allSet) {
    return (
      <ThemeProvider theme={darkTheme}>
        <div
          className={classes.root}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            height: '100%',
            display: 'flex',
            flex: '1 1 auto',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <CircularProgress
            size="10rem"
            thickness={1}
            className={classes.circle}
          />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <ErrorBoundary
        FallbackComponent={RootErrorFallback}
        onReset={() => dispatch({type: RESET_STATE_ON_ERROR})}
        onError={rootErrorHandler}>
        <IdeDispatchContext.Provider value={dispatch}>
          <IdeStateContext.Provider value={state}>
            <IdeFilesContext.Provider value={state.files}>
              <IdeEditorContext.Provider value={state.editor}>
                <IdeVarsContext.Provider value={state.vars}>
                  <IdeBuildRunOngoingContext.Provider
                    value={state.build.runOngoing}>
                    <IdeDryRunConfigContext.Provider value={state.config.dry}>
                      <IdeBuildContext.Provider value={state.build}>
                        <IdeBuildConfigContext.Provider
                          value={state.config.build}>
                          <IdeBuildRunContext.Provider value={state.buildRun}>
                            <IdeDryContext.Provider value={state.dry}>
                              <IdeDryRunOngoingContext.Provider
                                value={state.dry.runOngoing}>
                                <IdeParseRunOngoingContext.Provider
                                  value={state.parse.runOngoing}>
                                  <IdeParseContext.Provider value={state.parse}>
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
                                  </IdeParseContext.Provider>
                                </IdeParseRunOngoingContext.Provider>
                              </IdeDryRunOngoingContext.Provider>
                            </IdeDryContext.Provider>
                          </IdeBuildRunContext.Provider>
                        </IdeBuildConfigContext.Provider>
                      </IdeBuildContext.Provider>
                    </IdeDryRunConfigContext.Provider>
                  </IdeBuildRunOngoingContext.Provider>
                </IdeVarsContext.Provider>
              </IdeEditorContext.Provider>
            </IdeFilesContext.Provider>
          </IdeStateContext.Provider>
        </IdeDispatchContext.Provider>
      </ErrorBoundary>
      {snackbarTypeError}
    </ThemeProvider>
  );
};

export default Ide;

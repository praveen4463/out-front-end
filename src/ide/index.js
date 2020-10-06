import React, {useState, useEffect, useReducer, useRef} from 'react';
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
import {filesSchema} from './Explorer/model';
import {globalVarsSchema, buildVarsSchema} from '../variables/model';
import {
  BATCH_ACTIONS,
  SET_FILES,
  VAR_SET,
  RESET_STATE_ON_ERROR,
  RUN_BUILD_UPDATE_BY_PROP,
} from './actionTypes';
import {
  BUILD_UPDATE_BY_PROP,
  BUILD_START_RUN,
  BUILD_NEW_SESSION_SUCCESS,
  BUILD_NEW_SESSION_ERROR,
} from '../actions/actionTypes';
import batchActions from './actionCreators';
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
} from './Contexts';
import explorerReducer from './reducers/explorer';
import editorReducer from './reducers/editor';
import varReducer from './reducers/var';
import ideReducer from './reducers/ide';
import dryConfigReducer from './reducers/dryConfig';
import buildConfigReducer from '../reducers/buildConfig';
import buildReducer from '../reducers/build';
import buildRunReducer from './reducers/buildRun';
import RootErrorFallback, {rootErrorHandler} from '../ErrorBoundary';
import {
  VarTypes,
  Browsers,
  Platforms,
  ApiStatuses,
  RunType,
} from '../Constants';
import Browser, {BuildConfig} from '../model';
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
    createNew: false,
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
  completedBuilds: null,
  dry: {
    runOngoing: false,
  },
  dryRun: null,
  parse: {
    runOngoing: false,
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
  const pendingTestProgressApiResponse = useRef(false);
  const etVersions = state.files ? state.files.entities.versions : null;
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
  }, []);

  useEffect(() => {
    if (!state.build.createNew) {
      return;
    }
    if (
      !state.config.build.openLessOften ||
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
    state.config.build.selectedVersions,
  ]);

  useEffect(() => {
    if (!(state.build.runOngoing && !state.build.sessionId)) {
      return;
    }
    // first validate all versions parse status and trigger new session error if
    // there are parse errors in any of selected test. Don't just skip those tests
    // but skip entire build.
    if (
      state.build.versionIds.some((v) => {
        const version = etVersions[v];
        return (
          version.lastRun &&
          version.lastRun.error &&
          version.lastRun.runType === RunType.PARSE_RUN
        );
      })
    ) {
      dispatch({
        type: BUILD_NEW_SESSION_ERROR,
        payload: {
          error:
            "Can't start build, there are parse errors in some of selected test(s)",
        },
      });
    }
    // call api for new session
    dispatch({
      type: BUILD_UPDATE_BY_PROP,
      payload: {prop: 'sessionRequestTime', value: Date.now()},
    });
    const onSuccess = (response) => {
      const {buildId, buildKey, sessionId} = response.data;
      // setup test progress interval
      // invoke function every one second but send api request only after last
      // request is completed.
      const intervalId = setInterval(() => {
        // state.buildRun.buildRunVersions will always be there as it gets created
        // upon new build request accepted.
        if (pendingTestProgressApiResponse.current) {
          return;
        }
        pendingTestProgressApiResponse.current = true;
        setTimeout(() => {
          pendingTestProgressApiResponse.current = false;
        }, 800);
      }, 1000);
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
      dispatch({
        type: BUILD_NEW_SESSION_ERROR,
        payload: {
          error: `Couldn't start build, ${response.error.reason}`,
        },
      });
    };
    setTimeout(() => {
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          buildId: random(1000, 10000),
          buildKey: random(1000, 10000),
          sessionId: random(1000, 10000),
        },
      };
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response);
      } else if (response.status === ApiStatuses.SUCCESS) {
        onError(response);
      }
    }, 10000);
  }, [
    state.build.runOngoing,
    state.build.sessionId,
    state.build.versionIds,
    etVersions,
  ]);

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
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                margin: 0,
                              }}>
                              <div style={{display: 'flex', flex: '1 1 auto'}}>
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
                                  <TopNavigation
                                    openBuildConfig={
                                      state.build.openBuildConfig
                                    }
                                    sessionId={state.build.sessionId}
                                  />
                                  <Content />
                                </div>
                              </div>
                            </div>
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
    </ThemeProvider>
  );
};

export default Ide;

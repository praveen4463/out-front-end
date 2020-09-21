import React, {useState, useEffect, useReducer} from 'react';
import {ThemeProvider, makeStyles} from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import {normalize} from 'normalizr';
import {ErrorBoundary} from 'react-error-boundary';
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
} from './actionTypes';
import batchActions from './actionCreators';
import {
  IdeDispatchContext,
  IdeStateContext,
  IdeFilesContext,
  IdeEditorContext,
  IdeVarsContext,
  IdeBuildRunningContext,
  IdeDryRunConfigContext,
  IdeBuildRunBuildVarContext,
  IdeBuildRunSelectedVersionsContext,
} from './Contexts';
import explorerReducer from './reducers/explorer';
import editorReducer from './reducers/editor';
import varReducer from './reducers/var';
import ideReducer from './reducers/ide';
import dryConfigReducer from './reducers/dryConfig';
import buildConfigReducer from '../reducers/buildConfig';
import buildRunReducer from './reducers/buildRun';
import RootErrorFallback, {rootErrorHandler} from '../ErrorBoundary';
import {VarTypes, Browsers, Platforms} from '../Constants';
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
  build: {
    start: null,
    stop: null,
    items: [],
    runOngoing: false,
  },
  // selectedBuildVarIdPerKey is an object containing pairs of buildVar.key and buildVar.id
  // just id is kept rather than whole object so that any update/rename in object will not have
  // to be made here.
  config: {
    dry: {
      browser: new Browser(Browsers.CHROME.VALUE, '90'),
      platform: Platforms.WINDOWS.VALUE,
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
      if (type.startsWith('RUN_BUILD_')) {
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
  const classes = useStyles();
  const [allSet, setAllSet] = useState(false);

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
                  <IdeBuildRunningContext.Provider
                    value={state.build.runOngoing}>
                    <IdeDryRunConfigContext.Provider value={state.config.dry}>
                      <IdeBuildRunBuildVarContext.Provider
                        value={state.config.build.selectedBuildVarIdPerKey}>
                        <IdeBuildRunSelectedVersionsContext.Provider
                          value={state.config.build.selectedVersions}>
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
                                <TopNavigation />
                                <Content />
                              </div>
                            </div>
                          </div>
                        </IdeBuildRunSelectedVersionsContext.Provider>
                      </IdeBuildRunBuildVarContext.Provider>
                    </IdeDryRunConfigContext.Provider>
                  </IdeBuildRunningContext.Provider>
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

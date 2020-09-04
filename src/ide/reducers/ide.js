import produce from 'immer';
import {
  SET_FILES,
  SET_PROJECT,
  RUN_BUILD,
  SET_VERSION_LAST_RUN,
  SET_GLOBAL_VARS,
  SET_BUILD_VARS,
} from '../actionTypes';
import getDeepClonedFiles from './common';
import {LastRunError, LastRun} from '../Explorer/model';
import {RunType} from '../Constants';

// !!if no reference if kept to the files sent via payload, there is no need to
// deep clone files, remove it once we're using api to load data.
const setFiles = (draft, payload) => {
  if (payload.files === undefined) {
    throw new Error('Insufficient arguments passed to setFiles.');
  }

  draft.files = getDeepClonedFiles(payload.files);
};

const setProject = (draft, payload) => {
  if (payload.projectId === undefined) {
    throw new Error('Insufficient arguments passed to setProject.');
  }

  draft.projectId = payload.projectId;
  // TODO: we need to also reset other things like files/tabs.
};

const runBuild = (draft, payload) => {
  if (payload.itemType === undefined || payload.itemId === undefined) {
    throw new Error('Insufficient arguments passed to runBuild.');
  }

  const {build} = draft;
  build.start = true;
  build.items = [{itemType: payload.itemType, itemId: payload.itemId}];
};

const setVersionLastRun = (draft, payload) => {
  if (
    payload.versionId === undefined ||
    payload.runType === undefined ||
    payload.showSuccessMsgInStatus === undefined
  ) {
    throw new Error('Insufficient arguments passed to setVersionLastRun.');
  }
  if (!payload.output && !payload.error) {
    throw new Error('Insufficient arguments passed to setVersionLastRun.');
  }
  if (payload.error && !(payload.error instanceof LastRunError)) {
    throw new Error('Expected error to be instance of Error');
  }
  const et = draft.files.entities;
  const version = et.versions[payload.versionId];
  version.lastRun = new LastRun(
    payload.runType,
    payload.output,
    payload.showSuccessMsgInStatus,
    payload.error
  );
  // show version/test/file in error only when it's a parse request.
  if (payload.runType === RunType.PARSE_RUN) {
    const showAsError = Boolean(payload.error);
    version.showAsErrorInExplorer = showAsError;
    const test = et.tests[version.testId];
    test.showAsErrorInExplorer = showAsError;
    et.files[test.fileId].showAsErrorInExplorer = showAsError;
  }
};

const setGlobalVars = (draft, payload) => {
  if (payload.globalVars === undefined) {
    throw new Error('Insufficient arguments passed to setGlobalVars.');
  }
  draft.vars.global = payload.globalVars;
};

const setBuildVars = (draft, payload) => {
  if (payload.buildVars === undefined) {
    throw new Error('Insufficient arguments passed to setBuildVars.');
  }
  draft.vars.build = payload.buildVars;
};

const ideReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case SET_FILES:
      setFiles(draft, payload);
      break;
    case SET_PROJECT:
      setProject(draft, payload);
      break;
    case RUN_BUILD:
      runBuild(draft, payload);
      break;
    case SET_VERSION_LAST_RUN:
      setVersionLastRun(draft, payload);
      break;
    case SET_GLOBAL_VARS:
      setGlobalVars(draft, payload);
      break;
    case SET_BUILD_VARS:
      setBuildVars(draft, payload);
      break;
    default:
      break;
  }
});

export default ideReducer;

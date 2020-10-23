import produce from 'immer';
import {
  SET_FILES,
  SET_PROJECT,
  SET_VERSION_LAST_RUN,
  CLEAR_VERSION_LAST_RUN,
  PUSH_COMPLETED_BUILDS,
} from '../actionTypes';
import getDeepClonedFiles from './common';
import {LastRunError, LastRun} from '../Explorer/model';
import {RunType} from '../../Constants';

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
  const {runType} = payload;
  const et = draft.files.entities;
  const version = et.versions[payload.versionId];
  const lastRun = new LastRun(
    runType,
    payload.output,
    payload.showSuccessMsgInStatus,
    payload.error
  );
  version.lastRun = lastRun;
  // also set into lastParseRun if it's a parse request.
  // show version/test/file in error only when it's a parse request.
  if (runType === RunType.PARSE_RUN) {
    // we can use the same object of lastRun as it never has to be modified.
    version.lastParseRun = lastRun;
    const showAsError = Boolean(payload.error);
    version.showAsErrorInExplorer = showAsError;
    const test = et.tests[version.testId];
    test.showAsErrorInExplorer = test.versions.some(
      (vid) => et.versions[vid].showAsErrorInExplorer
    );
    const files = et.files[test.fileId];
    files.showAsErrorInExplorer = files.tests.some(
      (tid) => et.tests[tid].showAsErrorInExplorer
    );
  }
};

const clearVersionLastRun = (draft, payload) => {
  if (payload.versionId === undefined || payload.runType === undefined) {
    throw new Error('Insufficient arguments passed to clearVersionLastRun.');
  }
  const {versionId, runType} = payload;
  const et = draft.files.entities;
  const version = et.versions[versionId];
  if (version.lastRun && version.lastRun.runType === runType) {
    version.lastRun = null;
  }
  if (runType === RunType.PARSE_RUN) {
    version.lastParseRun = null;
  }
};

const pushCompletedBuilds = (draft, payload) => {
  if (payload.buildId === undefined) {
    throw new Error('Insufficient arguments passed to pushCompletedBuilds.');
  }
  draft.completedBuilds.push(payload.buildId);
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
    case SET_VERSION_LAST_RUN:
      setVersionLastRun(draft, payload);
      break;
    case CLEAR_VERSION_LAST_RUN:
      clearVersionLastRun(draft, payload);
      break;
    case PUSH_COMPLETED_BUILDS:
      pushCompletedBuilds(draft, payload);
      break;
    default:
      break;
  }
});

export default ideReducer;

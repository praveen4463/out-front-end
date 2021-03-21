import produce from 'immer';
import {
  SET_FILES,
  SET_PROJECT,
  SET_VERSION_LAST_RUN,
  CLEAR_VERSIONS_LAST_RUN,
  CLEAR_VERSION_LAST_RUN_BY_RUN_TYPE,
  PUSH_COMPLETED_BUILDS,
  VERSION_CODE_SAVE_IN_PROGRESS,
  VERSION_CODE_SAVE_COMPLETED,
} from '../actionTypes';
import getDeepClonedFiles from './common';
import {LastRunError, LastRun} from '../Explorer/model';
import {CompletedBuild, CompletedBuildVersion} from '../model';
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
};

const setVersionLastRun = (draft, payload) => {
  if (
    payload.versionId === undefined ||
    payload.runType === undefined ||
    payload.showSuccessMsgInStatus === undefined
  ) {
    throw new Error('Insufficient arguments passed to setVersionLastRun.');
  }
  // output could be null when run didn't have any
  if (payload.output === undefined && !payload.error) {
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

const clearVersionsLastRun = (draft, payload) => {
  if (payload.versionIds === undefined || payload.runType === undefined) {
    throw new Error('Insufficient arguments passed to clearVersionsLastRun.');
  }
  const {versionIds, runType} = payload;
  const et = draft.files.entities;
  versionIds.forEach((vId) => {
    const version = et.versions[vId];
    // clear last run irrespective of the provided run type
    if (version.lastRun) {
      version.lastRun = null;
    }
    // clear last parse only if it's a parse
    if (runType === RunType.PARSE_RUN) {
      version.lastParseRun = null;
    }
  });
};

const clearVersionLastRunByRunType = (draft, payload) => {
  if (payload.versionId === undefined || payload.runType === undefined) {
    throw new Error(
      'Insufficient arguments passed to clearVersionLastRunByRunType.'
    );
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
  if (payload.runId === undefined || payload.buildId === undefined) {
    throw new Error('Insufficient arguments passed to pushCompletedBuilds.');
  }
  const {buildRun, completedBuilds} = draft;
  const {versionIds, buildRunVersions, runId} = buildRun;
  if (runId !== payload.runId) {
    throw new Error(
      'Expected current buildRun to contain details of most recent completed build'
    );
  }
  const et = draft.files.entities;
  const completedBuildVersions = {};
  versionIds.forEach((vid) => {
    const version = et.versions[vid];
    const test = et.tests[version.testId];
    const file = et.files[test.fileId];
    const brv = buildRunVersions[vid];
    // keep names of file, test etc cause they may be deleted after a build is done
    // and we still have to show them.
    const cbv = new CompletedBuildVersion(
      vid,
      brv.status,
      brv.timeTaken,
      brv.error,
      brv.output,
      file.name,
      test.name,
      version.name
    );
    completedBuildVersions[vid] = cbv;
  });
  const completedBuild = new CompletedBuild(
    payload.buildId,
    Date.now(),
    completedBuildVersions,
    versionIds
  );
  // push new completed builds on top of array
  completedBuilds.unshift(completedBuild);
};

const versionCodeSaveInProgress = (draft, payload) => {
  if (payload.versionId === undefined) {
    throw new Error(
      'Insufficient arguments passed to versionCodeSaveInProgress.'
    );
  }
  draft.versionIdsCodeSaveInProgress.add(payload.versionId);
};

const versionCodeSaveCompleted = (draft, payload) => {
  if (payload.versionId === undefined) {
    throw new Error(
      'Insufficient arguments passed to versionCodeSaveCompleted.'
    );
  }
  draft.versionIdsCodeSaveInProgress.delete(payload.versionId);
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
    case CLEAR_VERSIONS_LAST_RUN:
      clearVersionsLastRun(draft, payload);
      break;
    case CLEAR_VERSION_LAST_RUN_BY_RUN_TYPE:
      clearVersionLastRunByRunType(draft, payload);
      break;
    case PUSH_COMPLETED_BUILDS:
      pushCompletedBuilds(draft, payload);
      break;
    case VERSION_CODE_SAVE_IN_PROGRESS:
      versionCodeSaveInProgress(draft, payload);
      break;
    case VERSION_CODE_SAVE_COMPLETED:
      versionCodeSaveCompleted(draft, payload);
      break;
    default:
      break;
  }
});

export default ideReducer;

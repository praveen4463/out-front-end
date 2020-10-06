import produce from 'immer';
import {intersection, random} from 'lodash-es';
import {
  BUILD_UPDATE_BY_PROP,
  BUILD_NEW_RUN,
  BUILD_START_RUN,
  BUILD_CANCEL_RUN,
  BUILD_COMPLETE_RUN,
  BUILD_NEW_SESSION_SUCCESS,
  BUILD_NEW_SESSION_ERROR,
} from '../actions/actionTypes';

const updateByProp = (draft, payload) => {
  if (payload.prop === undefined || payload.value === undefined) {
    throw new Error('Insufficient arguments passed to updateByProp.');
  }
  const {prop, value} = payload;
  const {build} = draft;
  if (build[prop] === undefined) {
    throw new Error(`Build doesn't have given own prop ${prop}`);
  }
  build[prop] = value;
};

// TODO: later try to memoize this somehow
const getOrderedVersionsFromFiles = (draft) => {
  const versions = [];
  const et = draft.entities;
  const {files, tests} = et;
  draft.result.forEach(
    (fid) =>
      files[fid].tests &&
      files[fid].tests.forEach((tid) =>
        tests[tid].versions.forEach((vid) => versions.push(vid))
      )
  );
  // versions now have ordered versions
  return versions;
};

const newRun = (draft, payload) => {
  const {build} = draft;
  if (payload.versionIds) {
    // filter out deleted versions if any (user ran, deleted some version, reran)
    build.versionIds = payload.versionIds.filter(
      (v) => draft.files.entities.versions[v]
    );
  }
  build.createNew = true;
};

const startRun = (draft) => {
  const {build} = draft;
  build.runOngoing = true;
  build.createNew = false;
  build.openBuildConfig = false;
  build.sessionError = null;
  if (!build.versionIds) {
    // no implicit versionIds assigned, get from build config and find intersection
    // from all versions fetched from files.
    // TODO: later try to memoize this somehow
    build.versionIds = intersection(
      getOrderedVersionsFromFiles(draft),
      Array.from(draft.config.build.selectedVersions)
    );
  }
  build.runId = random(111111, 999999);
};

const cancelRun = (draft) => {
  const {build} = draft;
  build.createNew = false;
  build.openBuildConfig = false;
  build.versionIds = null; // if it was set implicitly
};

const resetCommon = (draft) => {
  const {build} = draft;
  build.runOngoing = false;
  build.sessionRequestTime = null;
  build.versionIds = null;
  build.runId = null;
};

const completeRun = (draft) => {
  const {build} = draft;
  build.buildId = null;
  build.buildKey = null;
  build.sessionId = null;
  resetCommon(draft);
};

const newSessionSuccess = (draft, payload) => {
  if (
    payload.buildId === undefined ||
    payload.buildKey === undefined ||
    payload.sessionId === undefined
  ) {
    throw new Error('Insufficient arguments passed to newSessionSuccess.');
  }
  const {build} = draft;
  build.buildId = payload.buildId;
  build.buildKey = payload.buildKey;
  build.sessionId = payload.sessionId;
};

const newSessionError = (draft, payload) => {
  if (payload.error === undefined) {
    throw new Error('Insufficient arguments passed to newSessionError.');
  }
  const {build} = draft;
  build.sessionError = payload.error;
  resetCommon(draft);
};

const buildReducer = produce((draft, action) => {
  switch (action.type) {
    case BUILD_UPDATE_BY_PROP:
      updateByProp(draft, action.payload);
      break;
    case BUILD_NEW_RUN:
      newRun(draft, action.payload);
      break;
    case BUILD_START_RUN:
      startRun(draft);
      break;
    case BUILD_CANCEL_RUN:
      cancelRun(draft);
      break;
    case BUILD_COMPLETE_RUN:
      completeRun(draft);
      break;
    case BUILD_NEW_SESSION_SUCCESS:
      newSessionSuccess(draft, action.payload);
      break;
    case BUILD_NEW_SESSION_ERROR:
      newSessionError(draft, action.payload);
      break;
    default:
      break;
  }
});

export default buildReducer;

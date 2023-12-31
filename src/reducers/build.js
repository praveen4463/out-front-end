import produce from 'immer';
import intersection from 'lodash-es/intersection';
import random from 'lodash-es/random';
import {
  BUILD_UPDATE_BY_PROP,
  BUILD_NEW_RUN,
  BUILD_START_RUN,
  BUILD_CANCEL_RUN,
  BUILD_COMPLETE_RUN,
  BUILD_NEW_SESSION_SUCCESS,
  BUILD_NEW_SESSION_ERROR,
} from '../actions/actionTypes';
import {getOrderedVersionsFromFiles} from './common';
import {isBlank} from '../common';

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

const newRun = (draft, payload) => {
  const {build} = draft;
  build.createNew = true;
  if (!payload) {
    return;
  }
  if (payload.versionIds) {
    // filter out deleted versions if any (user ran, deleted some version, reran)
    build.versionIds = payload.versionIds.filter(
      (v) => draft.files.entities.versions[v]
    );
  }
  if (payload.noBuildConfigIfValid) {
    build.noBuildConfigIfValid = true;
  }
};

const startRun = (draft) => {
  const {build} = draft;
  build.runOngoing = true;
  build.createNew = false;
  build.openBuildConfig = false;
  build.noBuildConfigIfValid = false;
  build.sessionError = null;
  if (!build.versionIds || !build.versionIds.length) {
    // no implicit versionIds assigned, get from build config and find intersection
    // from all versions fetched from files.
    // TODO: later try to memoize this somehow
    build.versionIds = intersection(
      getOrderedVersionsFromFiles(draft.files),
      Array.from(draft.config.build.selectedVersions)
    );
  }
  const versionIdsLength = build.versionIds.length;
  // filter out versionIds that have blank code
  build.versionIds = build.versionIds.filter(
    (vId) => !isBlank(draft.files.entities.versions[vId].code)
  );
  if (build.versionIds.length < versionIdsLength) {
    build.filteredNoCodeVersions = true;
  }
  build.runId = random(111111, 999999);
};

const cancelRun = (draft) => {
  const {build} = draft;
  build.createNew = false;
  build.openBuildConfig = false;
  build.noBuildConfigIfValid = false;
  build.versionIds = null; // if it was set implicitly
};

const resetCommon = (draft) => {
  const {build} = draft;
  build.runOngoing = false;
  build.sessionRequestTime = null;
  build.filteredNoCodeVersions = false;
  build.versionIds = null;
  build.runId = null;
};

const completeRun = (draft) => {
  const {build} = draft;
  build.buildId = null;
  build.buildKey = null;
  build.sessionId = null;
  build.stopping = false;
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

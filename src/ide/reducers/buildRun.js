import produce from 'immer';
import {
  RUN_BUILD_ON_NEW_RUN,
  RUN_BUILD_UPDATE_BY_PROP,
  RUN_BUILD_UPDATE_VERSION_BY_PROP,
} from '../actionTypes';
import {BuildRun, BuildRunVersion} from '../model';

const onNewRun = (draft) => {
  const {build} = draft;
  const versions = build.versionIds.map((v) => ({[v]: new BuildRunVersion(v)}));
  draft.buildRun = new BuildRun(build.runId, versions);
};

const updateByProp = (draft, payload) => {
  if (payload.prop === undefined || payload.value === undefined) {
    throw new Error('Insufficient arguments passed to updateByProp.');
  }
  const {prop, value} = payload;
  const {buildRun} = draft;
  if (buildRun[prop] === undefined) {
    throw new Error(`BuildRun doesn't have given own prop ${prop}`);
  }
  buildRun[prop] = value;
};

const updateVersionByProp = (draft, payload) => {
  if (
    payload.versionId === undefined ||
    payload.prop === undefined ||
    payload.value === undefined
  ) {
    throw new Error('Insufficient arguments passed to updateVersionByProp.');
  }
  const {versionId, prop, value} = payload;
  const {buildRun} = draft;
  if (buildRun.buildRunVersions[versionId][prop] === undefined) {
    throw new Error(`BuildRunVersion doesn't have given own prop ${prop}`);
  }
  buildRun.buildRunVersions[versionId][prop] = value;
};

const buildRunReducer = produce((draft, action) => {
  switch (action.type) {
    case RUN_BUILD_ON_NEW_RUN:
      onNewRun(draft);
      break;
    case RUN_BUILD_UPDATE_BY_PROP:
      updateByProp(draft, action.payload);
      break;
    case RUN_BUILD_UPDATE_VERSION_BY_PROP:
      updateVersionByProp(draft, action.payload);
      break;
    default:
      break;
  }
});

export default buildRunReducer;

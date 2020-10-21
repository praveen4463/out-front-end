import produce from 'immer';
import {
  RUN_BUILD_ON_NEW_RUN,
  RUN_BUILD_UPDATE_BY_PROP,
  RUN_BUILD_ON_COMPLETED,
  RUN_BUILD_COMPLETE_ON_ERROR,
  RUN_BUILD_UPDATE_VERSION,
} from '../actionTypes';
import {BuildRun, BuildRunVersion} from '../model';
import {LastRunError} from '../Explorer/model';
import {TestStatus} from '../../Constants';

const onNewRun = (draft) => {
  const {build} = draft;
  const brvs = {};
  build.versionIds.forEach((v) => {
    brvs[v] = new BuildRunVersion(v);
  });
  draft.buildRun = new BuildRun(build.runId, brvs);
  draft.buildRun.versionIds = build.versionIds;
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

const completed = (draft) => {
  // buildRunVersions and runId don't get reset as the completed run is also
  // shown forever
  const {buildRun} = draft;
  clearInterval(buildRun.testProgressIntervalId);
  buildRun.testProgressIntervalId = null;
  buildRun.completed = true;
};

const onCompleted = (draft) => {
  completed(draft);
};

const completeOnError = (draft, payload) => {
  if (payload.error === undefined) {
    throw new Error('Insufficient arguments passed to completeOnError.');
  }
  const {buildRun} = draft;
  buildRun.error = payload.error;
  completed(draft);
};

const updateVersion = (draft, payload) => {
  if (payload.versionId === undefined || payload.data === undefined) {
    throw new Error('Insufficient arguments passed to updateVersion.');
  }
  const {versionId, data} = payload;
  const buildRunVersion = draft.buildRun.buildRunVersions[versionId];
  buildRunVersion.status = data.status;
  if (data.currentLine > 0) {
    buildRunVersion.currentLine = data.currentLine;
  }
  if (data.output) {
    // output should be appended with a line break.
    if (buildRunVersion.output) {
      buildRunVersion.output += '\n';
    } else {
      buildRunVersion.output = '';
    }
    buildRunVersion.output += data.output;
  }
  switch (data.status) {
    case TestStatus.RUNNING:
      buildRunVersion.nextOutputToken = data.nextOutputToken;
      break;
    case TestStatus.SUCCESS:
    case TestStatus.STOPPED:
    case TestStatus.ABORTED:
      buildRunVersion.timeTaken = data.timeTaken;
      break;
    case TestStatus.ERROR: {
      buildRunVersion.timeTaken = data.timeTaken;
      const {error} = data;
      buildRunVersion.error = new LastRunError(error.msg, error.from, error.to);
      break;
    }
    default:
      throw new Error(`Can't recognize TestStatus ${data.status}`);
  }
};

const buildRunReducer = produce((draft, action) => {
  switch (action.type) {
    case RUN_BUILD_ON_NEW_RUN:
      onNewRun(draft);
      break;
    case RUN_BUILD_UPDATE_BY_PROP:
      updateByProp(draft, action.payload);
      break;
    case RUN_BUILD_ON_COMPLETED:
      onCompleted(draft);
      break;
    case RUN_BUILD_COMPLETE_ON_ERROR:
      completeOnError(draft, action.payload);
      break;
    case RUN_BUILD_UPDATE_VERSION:
      updateVersion(draft, action.payload);
      break;
    default:
      break;
  }
});

export default buildRunReducer;

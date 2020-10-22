import produce from 'immer';
import {
  RUN_DRY_ON_NEW_RUN,
  RUN_DRY_UPDATE_BY_PROP,
  RUN_DRY_ON_COMPLETED,
  RUN_DRY_COMPLETE_ON_ERROR,
  RUN_DRY_UPDATE_VERSION,
  RUN_DRY_MARK_VERSION_STATUS,
} from '../actionTypes';
import {DryRun, DryRunVersion} from '../model';
import {LastRunError} from '../Explorer/model';
import {TestStatus} from '../../Constants';

const onNewRun = (draft) => {
  const {dry} = draft;
  const drvs = {};
  dry.versionIds.forEach((v) => {
    drvs[v] = new DryRunVersion(v);
  });
  draft.dryRun = new DryRun(dry.runId, drvs, dry.versionIds);
};

const updateByProp = (draft, payload) => {
  if (payload.prop === undefined || payload.value === undefined) {
    throw new Error('Insufficient arguments passed to updateByProp.');
  }
  const {prop, value} = payload;
  const {dryRun} = draft;
  if (dryRun[prop] === undefined) {
    throw new Error(`DryRun doesn't have given own prop ${prop}`);
  }
  dryRun[prop] = value;
};

const completed = (draft) => {
  // dryRunVersions and runId don't get reset as the completed run is also
  // shown forever
  const {dryRun} = draft;
  dryRun.inProgress = false;
  dryRun.completed = true;
};

const onCompleted = (draft) => {
  completed(draft);
};

const completeOnError = (draft, payload) => {
  if (payload.error === undefined) {
    throw new Error('Insufficient arguments passed to completeOnError.');
  }
  const {dryRun} = draft;
  dryRun.error = payload.error;
  completed(draft);
};

const updateVersion = (draft, payload) => {
  if (payload.versionId === undefined || payload.data === undefined) {
    throw new Error('Insufficient arguments passed to updateVersion.');
  }
  const {versionId, data} = payload;
  const dryRunVersion = draft.dryRun.dryRunVersions[versionId];
  dryRunVersion.status = data.status;
  if (data.output) {
    // output should be appended with a line break.
    if (dryRunVersion.output) {
      dryRunVersion.output += '\n';
    } else {
      dryRunVersion.output = '';
    }
    dryRunVersion.output += data.output;
  }
  switch (data.status) {
    case TestStatus.SUCCESS:
    case TestStatus.STOPPED:
      dryRunVersion.timeTaken = data.timeTaken;
      break;
    case TestStatus.ERROR: {
      dryRunVersion.timeTaken = data.timeTaken;
      const {error} = data;
      dryRunVersion.error = new LastRunError(error.msg, error.from, error.to);
      break;
    }
    default:
      throw new Error(`Can't recognize TestStatus ${data.status}`);
  }
};

const markVersionStatus = (draft, payload) => {
  if (payload.versionId === undefined && payload.status === undefined) {
    throw new Error('Insufficient arguments passed to markVersionRunning.');
  }
  const dryRunVersion = draft.dryRun.dryRunVersions[payload.versionId];
  dryRunVersion.status = payload.status;
};

const dryRunReducer = produce((draft, action) => {
  switch (action.type) {
    case RUN_DRY_ON_NEW_RUN:
      onNewRun(draft);
      break;
    case RUN_DRY_UPDATE_BY_PROP:
      updateByProp(draft, action.payload);
      break;
    case RUN_DRY_ON_COMPLETED:
      onCompleted(draft);
      break;
    case RUN_DRY_COMPLETE_ON_ERROR:
      completeOnError(draft, action.payload);
      break;
    case RUN_DRY_UPDATE_VERSION:
      updateVersion(draft, action.payload);
      break;
    case RUN_DRY_MARK_VERSION_STATUS:
      markVersionStatus(draft, action.payload);
      break;
    default:
      break;
  }
});

export default dryRunReducer;

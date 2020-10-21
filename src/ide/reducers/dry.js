import produce from 'immer';
import {random} from 'lodash-es';
import {
  DRY_UPDATE_BY_PROP,
  DRY_START_RUN,
  DRY_COMPLETE_RUN,
} from '../actionTypes';

const updateByProp = (draft, payload) => {
  if (payload.prop === undefined || payload.value === undefined) {
    throw new Error('Insufficient arguments passed to updateByProp.');
  }
  const {prop, value} = payload;
  const {dry} = draft;
  if (dry[prop] === undefined) {
    throw new Error(`Dry doesn't have given own prop ${prop}`);
  }
  dry[prop] = value;
};

const startRun = (draft, payload) => {
  if (payload.versionIds === undefined) {
    throw new Error('Insufficient arguments passed to startRun.');
  }
  const {dry} = draft;
  dry.versionIds = payload.versionIds;
  dry.runOngoing = true;
  dry.runId = random(111111, 999999);
};

const completeRun = (draft) => {
  const {dry} = draft;
  dry.stopping = false;
  dry.runOngoing = false;
  dry.runId = null;
  dry.versionIds = null;
};

const dryReducer = produce((draft, action) => {
  switch (action.type) {
    case DRY_UPDATE_BY_PROP:
      updateByProp(draft, action.payload);
      break;
    case DRY_START_RUN:
      startRun(draft, action.payload);
      break;
    case DRY_COMPLETE_RUN:
      completeRun(draft);
      break;
    default:
      break;
  }
});

export default dryReducer;

import produce from 'immer';
import {random} from 'lodash-es';
import {
  BUILD_UPDATE_BY_PROP,
  BUILD_START_RUN,
  BUILD_CANCEL_RUN,
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

const startRun = (draft) => {
  const {build} = draft;
  build.runOngoing = true;
  build.createNew = false;
  build.openBuildConfig = false;
  build.runningBuildId = random(111111, 999999);
};

const cancelRun = (draft) => {
  const {build} = draft;
  build.createNew = false;
  build.openBuildConfig = false;
};

const buildReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case BUILD_UPDATE_BY_PROP:
      updateByProp(draft, payload);
      break;
    case BUILD_START_RUN:
      startRun(draft);
      break;
    case BUILD_CANCEL_RUN:
      cancelRun(draft);
      break;
    default:
      break;
  }
});

export default buildReducer;

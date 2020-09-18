import produce from 'immer';
import {RUN_BUILD} from '../actionTypes';

const runBuild = (draft, payload) => {
  if (payload.itemType === undefined || payload.itemId === undefined) {
    throw new Error('Insufficient arguments passed to runBuild.');
  }

  const {build} = draft;
  build.start = true;
  build.items = [{itemType: payload.itemType, itemId: payload.itemId}];
};

const buildRunReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case RUN_BUILD:
      runBuild(draft, payload);
      break;
    default:
      break;
  }
});

export default buildRunReducer;

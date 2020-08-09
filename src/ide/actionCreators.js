import {BATCH_ACTIONS} from './actionTypes';

const batchActions = (actions) => {
  return {
    type: BATCH_ACTIONS,
    actions,
  };
};

export default batchActions;

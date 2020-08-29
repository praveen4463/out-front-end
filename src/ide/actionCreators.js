import {BATCH_ACTIONS, SET_VERSION_LAST_RUN} from './actionTypes';
import {LastRunError} from './Explorer/model';

const batchActions = (actions) => {
  return {
    type: BATCH_ACTIONS,
    actions,
  };
};

export const getLastRunAction = (versionId, runType, output, error) => {
  if (error && !(error instanceof LastRunError)) {
    throw new Error('Expected error to be instance of LastRunError');
  }
  return {
    type: SET_VERSION_LAST_RUN,
    payload: {
      versionId,
      runType,
      output,
      error,
    },
  };
};

export default batchActions;

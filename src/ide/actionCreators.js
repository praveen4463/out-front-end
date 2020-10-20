import {
  BATCH_ACTIONS,
  SET_VERSION_LAST_RUN,
  DRY_UPDATE_BY_PROP,
  PARSE_UPDATE_BY_PROP,
} from './actionTypes';
import {LastRunError} from './Explorer/model';

const batchActions = (actions) => {
  return {
    type: BATCH_ACTIONS,
    actions,
  };
};

export const getLastRunAction = (
  versionId,
  runType,
  output,
  error = null,
  showSuccessMsgInStatus = true
) => {
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
      showSuccessMsgInStatus,
    },
  };
};

export const getDryStoppingAction = (isStopping) => {
  return {
    type: DRY_UPDATE_BY_PROP,
    payload: {prop: 'stopping', value: isStopping},
  };
};

export const getParseStoppingAction = (isStopping) => {
  return {
    type: PARSE_UPDATE_BY_PROP,
    payload: {prop: 'stopping', value: isStopping},
  };
};

export default batchActions;

import produce from 'immer';
import {random} from 'lodash-es';
import {PARSE_START_RUN, PARSE_COMPLETE_RUN} from '../actionTypes';

const startRun = (draft, payload) => {
  if (payload.versionIds === undefined) {
    throw new Error('Insufficient arguments passed to startRun.');
  }
  const {parse} = draft;
  parse.versionIds = payload.versionIds;
  parse.runOngoing = true;
  parse.runId = random(111111, 999999);
};

const completeRun = (draft) => {
  const {parse} = draft;
  parse.runOngoing = false;
  parse.runId = null;
  parse.versionIds = null;
};

const parseReducer = produce((draft, action) => {
  switch (action.type) {
    case PARSE_START_RUN:
      startRun(draft, action.payload);
      break;
    case PARSE_COMPLETE_RUN:
      completeRun(draft);
      break;
    default:
      break;
  }
});

export default parseReducer;

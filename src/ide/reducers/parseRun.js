import produce from 'immer';
import {
  RUN_PARSE_ON_NEW_RUN,
  RUN_PARSE_ON_COMPLETED,
  RUN_PARSE_COMPLETE_ON_ERROR,
} from '../actionTypes';
import {ParseRun} from '../model';

const onNewRun = (draft) => {
  const {parse} = draft;
  draft.parseRun = new ParseRun(parse.runId, parse.versionIds);
};

const completed = (draft) => {
  const {parseRun} = draft;
  parseRun.inProgress = false;
  parseRun.completed = true;
};

const onCompleted = (draft) => {
  completed(draft);
};

const completeOnError = (draft, payload) => {
  if (payload.error === undefined) {
    throw new Error('Insufficient arguments passed to completeOnError.');
  }
  const {parseRun} = draft;
  parseRun.error = payload.error;
  completed(draft);
};

const parseRunReducer = produce((draft, action) => {
  switch (action.type) {
    case RUN_PARSE_ON_NEW_RUN:
      onNewRun(draft);
      break;
    case RUN_PARSE_ON_COMPLETED:
      onCompleted(draft);
      break;
    case RUN_PARSE_COMPLETE_ON_ERROR:
      completeOnError(draft, action.payload);
      break;
    default:
      break;
  }
});

export default parseRunReducer;

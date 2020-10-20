import produce from 'immer';
import {LP_START, LP_END} from '../actionTypes';

const start = (draft) => {
  const {livePreview, build} = draft;
  livePreview.runId = build.runId;
  livePreview.completed = false;
  livePreview.buildId = build.buildId;
  livePreview.buildKey = build.buildKey;
  livePreview.sessionId = build.sessionId;
};

const end = (draft) => {
  const {livePreview} = draft;
  // just mark completed and don't touch other things.
  livePreview.completed = true;
};

const livePreviewReducer = produce((draft, action) => {
  switch (action.type) {
    case LP_START:
      start(draft);
      break;
    case LP_END:
      end(draft);
      break;
    default:
      break;
  }
});

export default livePreviewReducer;

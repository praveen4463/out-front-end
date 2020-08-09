import produce from 'immer';
import {SET_FILES, SET_PROJECT, RUN_BUILD} from '../actionTypes';
import getDeepClonedFiles from './common';

const setFiles = (draft, payload) => {
  if (payload.files === undefined) {
    throw new Error('Insufficient arguments passed to setFiles.');
  }

  draft.files = getDeepClonedFiles(payload.files);
};

const setProject = (draft, payload) => {
  if (payload.projectId === undefined) {
    throw new Error('Insufficient arguments passed to setProject.');
  }

  draft.projectId = payload.projectId;
  // TODO: we need to also reset other things like files/tabs.
};

const runBuild = (draft, payload) => {
  if (payload.itemType === undefined || payload.itemId === undefined) {
    throw new Error('Insufficient arguments passed to runBuild.');
  }

  const {build} = draft;
  build.start = true;
  build.items = [{itemType: payload.itemType, itemId: payload.itemId}];
};

const ideReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case SET_FILES:
      setFiles(draft, payload);
      break;
    case SET_PROJECT:
      setProject(draft, payload);
      break;
    case RUN_BUILD:
      runBuild(draft, payload);
      break;
    default:
      break;
  }
});

export default ideReducer;

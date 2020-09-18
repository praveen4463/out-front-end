import produce from 'immer';
import {CONFIG_BUILD_ADD_BUILD_VAR} from '../actionTypes';

const addBuildVar = (draft, payload) => {
  if (payload.buildVar === undefined) {
    throw new Error('Insufficient arguments passed to addBuildVar.');
  }
  const {buildVar} = payload;
  const {selectedBuildVarsPerKey} = draft.config.build;
  selectedBuildVarsPerKey[buildVar.key] = buildVar.id;
};

const buildConfigReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case CONFIG_BUILD_ADD_BUILD_VAR:
      addBuildVar(draft, payload);
      break;
    default:
      break;
  }
});

export default buildConfigReducer;

import produce from 'immer';
import {
  CONFIG_DRY_ADD_BUILD_VAR,
  CONFIG_DRY_UPDATE_BROWSER,
  CONFIG_DRY_UPDATE_PLATFORM,
} from '../actionTypes';
import Browser from '../../model';

const addBuildVar = (draft, payload) => {
  if (payload.buildVar === undefined) {
    throw new Error('Insufficient arguments passed to addBuildVar.');
  }
  const {buildVar} = payload;
  const {selectedBuildVarIdPerKey} = draft.config.dry;
  selectedBuildVarIdPerKey[buildVar.key] = buildVar.id;
};

const updateBrowser = (draft, payload) => {
  if (payload.browser === undefined) {
    throw new Error('Insufficient arguments passed to updateBrowser.');
  }
  if (payload.browser.constructor !== Browser) {
    throw new TypeError(`Argument is not of type ${Browser.constructor.name}`);
  }
  draft.config.dry.browser = payload.browser;
};

const updatePlatform = (draft, payload) => {
  if (payload.platform === undefined) {
    throw new Error('Insufficient arguments passed to updatePlatform.');
  }
  draft.config.dry.platform = payload.platform;
};

const dryConfigReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case CONFIG_DRY_ADD_BUILD_VAR:
      addBuildVar(draft, payload);
      break;
    case CONFIG_DRY_UPDATE_BROWSER:
      updateBrowser(draft, payload);
      break;
    case CONFIG_DRY_UPDATE_PLATFORM:
      updatePlatform(draft, payload);
      break;
    default:
      break;
  }
});

export default dryConfigReducer;

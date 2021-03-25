import produce from 'immer';
import {
  CONFIG_BUILD_ADD_BUILD_VAR,
  CONFIG_BUILD_UPDATE_BY_PROP,
  CONFIG_BUILD_UPDATE_SELECTED_VERSIONS,
  CONFIG_BUILD_ON_VERSIONS_DELETE,
  CONFIG_BUILD_ON_BUILD_CAPS_DELETE,
  CONFIG_BUILD_ON_BUILD_VAR_DELETE,
} from '../actions/actionTypes';
import {updateBuildConfigSelectedVersions} from '../common';
import {addBuildVar, onBuildVarDelete} from './common';

const updateByProp = (draft, payload) => {
  if (payload.prop === undefined || payload.value === undefined) {
    throw new Error('Insufficient arguments passed to updateByProp.');
  }
  const {prop, value} = payload;
  const {build} = draft.config;
  if (build[prop] === undefined) {
    throw new Error(`Build config doesn't have given own prop ${prop}`);
  }
  build[prop] = value;
};

const updateSelectedVersions = (draft, payload) => {
  if (
    payload.files === undefined ||
    payload.itemType === undefined ||
    payload.itemId === undefined ||
    payload.isSelected === undefined
  ) {
    throw new Error('Insufficient arguments passed to updateSelectedVersions.');
  }
  const {files, itemType, itemId, isSelected} = payload;
  // selectedVersions is a Set
  const {selectedVersions} = draft.config.build;
  updateBuildConfigSelectedVersions(
    selectedVersions,
    files,
    itemType,
    itemId,
    isSelected
  );
};

const onVersionsDelete = (draft, payload) => {
  if (payload.versionIds === undefined) {
    throw new Error('Insufficient arguments passed to onVersionsDelete.');
  }
  const {selectedVersions} = draft.config.build;
  if (!selectedVersions.size) {
    return;
  }
  payload.versionIds.forEach((v) => selectedVersions.delete(v));
};

const onBuildCapsDelete = (draft, payload) => {
  if (payload.buildCapabilityId === undefined) {
    throw new Error('Insufficient arguments passed to onBuildCapsDelete.');
  }
  const {build} = draft.config;
  if (build.buildCapabilityId === payload.buildCapabilityId) {
    build.buildCapabilityId = null;
  }
};

const buildConfigReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case CONFIG_BUILD_ADD_BUILD_VAR:
      addBuildVar(draft.config.build, payload);
      break;
    case CONFIG_BUILD_ON_BUILD_VAR_DELETE:
      onBuildVarDelete(draft.config.build, payload);
      break;
    case CONFIG_BUILD_UPDATE_BY_PROP:
      updateByProp(draft, payload);
      break;
    case CONFIG_BUILD_UPDATE_SELECTED_VERSIONS:
      updateSelectedVersions(draft, payload);
      break;
    case CONFIG_BUILD_ON_VERSIONS_DELETE:
      onVersionsDelete(draft, payload);
      break;
    case CONFIG_BUILD_ON_BUILD_CAPS_DELETE:
      onBuildCapsDelete(draft, payload);
      break;
    default:
      break;
  }
});

export default buildConfigReducer;

import produce from 'immer';
import {
  CONFIG_BUILD_ADD_BUILD_VAR,
  CONFIG_BUILD_UPDATE_OS,
  CONFIG_BUILD_UPDATE_BROWSER,
  CONFIG_BUILD_UPDATE_SELECTED_VERSIONS,
} from '../actions/actionTypes';
import Browser from '../model';
import {ExplorerItemType} from '../ide/Constants';

const addBuildVar = (draft, payload) => {
  if (payload.buildVar === undefined) {
    throw new Error('Insufficient arguments passed to addBuildVar.');
  }
  const {buildVar} = payload;
  const {selectedBuildVarIdPerKey} = draft.config.build;
  selectedBuildVarIdPerKey[buildVar.key] = buildVar.id;
};

const updateBrowser = (draft, payload) => {
  if (payload.browser === undefined) {
    throw new Error('Insufficient arguments passed to updateBrowser.');
  }
  if (payload.browser.constructor !== Browser) {
    throw new TypeError(`Argument is not of type ${Browser.constructor.name}`);
  }
  draft.config.build.browser = payload.browser;
};

const updateOs = (draft, payload) => {
  if (payload.os === undefined) {
    throw new Error('Insufficient arguments passed to updateOs.');
  }
  draft.config.build.os = payload.os;
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
  switch (itemType) {
    case ExplorerItemType.VERSION: {
      if (isSelected) {
        selectedVersions.add(itemId);
      } else {
        selectedVersions.delete(itemId);
      }
      break;
    }
    case ExplorerItemType.TEST: {
      if (isSelected) {
        // when a test is selected, add it's current version only.
        selectedVersions.add(
          files.entities.tests[itemId].versions.find(
            (v) => files.entities.versions[v].isCurrent
          )
        );
      } else {
        // when a test is deselected, delete all it's versions that exists
        files.entities.tests[itemId].versions.forEach((vid) =>
          selectedVersions.delete(vid)
        );
      }
      break;
    }
    case ExplorerItemType.FILE: {
      if (isSelected) {
        // when a file is selected, add all it's tests' current versions
        files.entities.files[itemId].tests.forEach((tid) =>
          selectedVersions.add(
            files.entities.tests[tid].versions.find(
              (v) => files.entities.versions[v].isCurrent
            )
          )
        );
        break;
      } else {
        // when a files is deselected, delete all it's tests' version that exists
        files.entities.files[itemId].tests.forEach((tid) =>
          files.entities.tests[tid].versions.forEach((vid) =>
            selectedVersions.delete(vid)
          )
        );
        break;
      }
    }
    default:
      throw new Error(`Unrecognized itemType ${itemType}`);
  }
};

const buildConfigReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case CONFIG_BUILD_ADD_BUILD_VAR:
      addBuildVar(draft, payload);
      break;
    case CONFIG_BUILD_UPDATE_OS:
      updateOs(draft, payload);
      break;
    case CONFIG_BUILD_UPDATE_BROWSER:
      updateBrowser(draft, payload);
      break;
    case CONFIG_BUILD_UPDATE_SELECTED_VERSIONS:
      updateSelectedVersions(draft, payload);
      break;
    default:
      break;
  }
});

export default buildConfigReducer;

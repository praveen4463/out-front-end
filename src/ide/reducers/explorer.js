import produce from 'immer';
import pull from 'lodash-es/pull';
import {ExplorerItemType} from '../Constants';
import {Version, Test, File} from '../Explorer/model';
import {
  EXP_LOAD_FILES,
  EXP_NEW_ITEM,
  EXP_RENAME_ITEM,
  EXP_DELETE_ITEM,
  EXP_DELETE_REVERT,
} from '../actionTypes';
import {getSortedNames} from '../../common';

const loadFiles = (draft, payload) => {
  if (payload.files === undefined) {
    throw new Error('Insufficient arguments passed to loadFiles.');
  }
  draft.files = payload.files;
};

const newItem = (draft, payload) => {
  if (payload.item === undefined || payload.itemType === undefined) {
    throw new Error('Insufficient arguments passed to newItem.');
  }
  if (
    payload.itemType !== ExplorerItemType.FILE &&
    payload.itemParentId === null
  ) {
    throw new Error('missing itemParentId in arguments.');
  }

  // It'd be really verbose If I check before adding new file/test/version for
  // existence in 'files' cause every new thing carries a unique db id and
  // having a duplicate there is nearly impossible.
  switch (payload.itemType) {
    case ExplorerItemType.FILE: {
      if (payload.item.constructor !== File) {
        throw new Error("Supplied item isn't a File.");
      }
      // never mutate a payload, always clone it.
      const newFile = {...payload.item};
      if (draft.files === null) {
        draft.files = {
          entities: {files: {[newFile.id]: newFile}},
          result: [newFile.id],
        };
      } else {
        const {files} = draft;
        files.entities.files[newFile.id] = newFile;
        // maintain sort putting new file
        files.result.push(newFile.id);
        files.result = getSortedNames(files.result, files.entities.files);
      }
      break;
    }
    case ExplorerItemType.TEST: {
      if (payload.item.constructor !== Test) {
        throw new Error("Supplied item isn't a Test.");
      }
      const newTest = {...payload.item};
      newTest.versions = [...newTest.versions];
      const newDefaultVersion = newTest.versions[0];
      const fid = payload.itemParentId;
      const {files} = draft; // file can't be null when adding test/version.
      const et = files.entities;
      if (et.tests === undefined) {
        // both tests and versions must be initialized.
        et.tests = {[newTest.id]: newTest};
        et.versions = {[newDefaultVersion.id]: newDefaultVersion};
      } else {
        et.tests[newTest.id] = newTest;
        et.versions[newDefaultVersion.id] = newDefaultVersion;
      }
      if (!Array.isArray(et.files[fid].tests)) {
        et.files[fid].tests = [];
      }
      et.files[fid].tests.push(newTest.id);
      // we need to maintain sort order while putting new test id
      et.files[fid].tests = getSortedNames(et.files[fid].tests, et.tests);
      // In normalized form, we don't put version object in 'versions' array
      // but just the id, replace the object with only id (newTest is raw form).
      // just one version with a new test, put it straight.
      et.tests[newTest.id].versions.splice(0, 1, newDefaultVersion.id);
      break;
    }
    case ExplorerItemType.VERSION: {
      if (payload.item.constructor !== Version) {
        throw new Error("Supplied item isn't a Version.");
      }
      const newVersion = {...payload.item};
      const tid = payload.itemParentId;
      const {files} = draft;
      const et = files.entities;
      // find last latest version before adding the new one
      const lastLatestVersionId = et.tests[tid].versions.find(
        (v) => et.versions[v].isCurrent
      );
      if (lastLatestVersionId === undefined) {
        throw new Error(
          `Couldn't find the last latest version for testId ${tid}`
        );
      }
      // it's not possible that et.versions is undefined because a version is
      // added into a test, and if a test exist, there will be at least one
      // version of it always available. Thus I've skipped the check.
      et.versions[newVersion.id] = newVersion;
      // we need to maintain sort order while putting new version id
      et.tests[tid].versions.push(newVersion.id);
      et.tests[tid].versions = getSortedNames(
        et.tests[tid].versions,
        et.versions
      );
      // now mark last latest to not latest
      et.versions[lastLatestVersionId].isCurrent = false;
      break;
    }
    default:
      throw new Error(
        `Couldn't identify item ${payload.itemType} while adding.`
      );
  }
};

const renameItem = (draft, payload) => {
  if (
    payload.itemNewName === undefined ||
    payload.itemType === undefined ||
    payload.itemId === undefined
  ) {
    throw new Error('Insufficient arguments passed to renameItem.');
  }
  if (
    payload.itemType !== ExplorerItemType.FILE &&
    payload.itemParentId === null
  ) {
    throw new Error('missing itemParentId in arguments.');
  }

  const {files} = draft;
  const et = files.entities;
  switch (payload.itemType) {
    case ExplorerItemType.FILE:
      et.files[payload.itemId].name = payload.itemNewName;
      files.result = getSortedNames(files.result, et.files);
      break;
    case ExplorerItemType.TEST:
      et.tests[payload.itemId].name = payload.itemNewName;
      et.files[payload.itemParentId].tests = getSortedNames(
        et.files[payload.itemParentId].tests,
        et.tests
      );
      break;
    case ExplorerItemType.VERSION:
      et.versions[payload.itemId].name = payload.itemNewName;
      et.tests[payload.itemParentId].versions = getSortedNames(
        et.tests[payload.itemParentId].versions,
        et.versions
      );
      break;
    default:
      throw new Error(
        `Couldn't identify item ${payload.itemType} while renaming.`
      );
  }
};

const deleteItem = (draft, payload) => {
  if (payload.itemType === undefined || payload.itemId === undefined) {
    throw new Error('Insufficient arguments passed to deleteItem.');
  }
  if (
    payload.itemType !== ExplorerItemType.FILE &&
    payload.itemParentId === null
  ) {
    throw new Error('missing itemParentId in arguments.');
  }
  const {files} = draft;
  const et = files.entities;
  switch (payload.itemType) {
    case ExplorerItemType.FILE: {
      const fid = payload.itemId;
      if (Array.isArray(et.files[fid].tests)) {
        et.files[fid].tests.forEach((tid) => {
          if (Array.isArray(et.tests[tid].versions)) {
            et.tests[tid].versions.forEach((vid) => {
              delete et.versions[vid];
            });
          }
          delete et.tests[tid];
        });
      }
      delete et.files[fid];
      pull(files.result, fid);
      break;
    }
    case ExplorerItemType.TEST: {
      const tid = payload.itemId;
      const fid = payload.itemParentId;
      if (Array.isArray(et.tests[tid].versions)) {
        et.tests[tid].versions.forEach((vid) => {
          delete et.versions[vid];
        });
      }
      delete et.tests[tid];
      pull(et.files[fid].tests, tid);
      break;
    }
    case ExplorerItemType.VERSION: {
      const vid = payload.itemId;
      const tid = payload.itemParentId;
      delete et.versions[vid];
      pull(et.tests[tid].versions, vid);
      break;
    }
    default:
      throw new Error(
        `Couldn't identify item ${payload.itemType} while deleting`
      );
  }
};

const deleteRevert = (draft, payload) => {
  if (payload.revertFunc === undefined) {
    throw new Error('Insufficient arguments passed to deleteRevert.');
  }

  payload.revertFunc(draft, getSortedNames);
};

// 'draft' is an immer draft that's the portion of main state. After mutations
// to it are done, it is returned by 'producer' and the root reducer will then
// assign it in the state to change state. Note that returning draft or original
// state is not necessary, when no change, original state is returned.
const explorerReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case EXP_LOAD_FILES:
      loadFiles(draft, payload);
      break;
    case EXP_NEW_ITEM:
      newItem(draft, payload);
      break;
    case EXP_RENAME_ITEM:
      renameItem(draft, payload);
      break;
    case EXP_DELETE_ITEM:
      deleteItem(draft, payload);
      break;
    case EXP_DELETE_REVERT:
      deleteRevert(draft, payload);
      break;
    default:
      break;
  }
});

export default explorerReducer;

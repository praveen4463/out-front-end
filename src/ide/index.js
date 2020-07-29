import React, {useEffect, useReducer} from 'react';
import {ThemeProvider} from '@material-ui/core/styles';
import {normalize} from 'normalizr';
import produce from 'immer';
import {union, pull, random} from 'lodash-es';
import TopNavigation from './TopNavigation';
import Content from './Content';
import darkTheme from './Themes';
import {
  files as sampleFiles,
  fileToLoad as sampleFilesToLoad,
} from './Explorer/sample';
import {ExplorerItemType} from './Constants';
import {Version, Test, File, filesSchema} from './Explorer/model';
import {
  INITIAL_SET_FILES,
  SET_PROJECT,
  ON_LOAD_CALLBACK,
  ON_UNLOAD_CALLBACK,
  ON_NEW_ITEM_CALLBACK,
  ON_RENAME_CALLBACK,
  ON_RENAME_REVERT_CALLBACK,
  ON_DELETE_CALLBACK,
  ON_DELETE_REVERT_CALLBACK,
  ON_RUN_BUILD_CALLBACK,
  ON_RUN_BUILD_MULTI_CALLBACK,
} from './actionTypes';
import {RootDispatchContext, RootStateContext} from './Contexts';
import './index.css';

const handleErrorsGlobally = (payload, meta) => {
  if (meta === 'ERROR_INITIAL_LOAD') {
    console.log(payload); // TODO: handle appropriately.
  }
};

const getSortedNames = (ids, namePropMapping) => {
  const pairs = ids.map((id) => [id, namePropMapping[id].name]);
  // The reference referenceStr should be string type, since our names comes
  // via text inputs, it's always string and doesn't need conversion or
  // string concat to make it a string.
  // Note: localeCompare is by far the best for string comparison, reference:
  // https://stackoverflow.com/a/26295229/1624454
  pairs.sort((a, b) => a[1].localeCompare(b[1]));
  // no locale specific options for now, TODO: for later.
  return pairs.map((p) => p[0]);
};

const handleOnLoad = (draft) => {
  const addNewFiles = (rawFiles) => {
    // rawFiles should already be ordered by names, i.e file/test/version
    // names should be ordered in ascending ordering, this is done at api level as
    // it's much faster there for big files. Normalize will keep individual
    // entities ordered by their ids but the arrays match the ordering of data.
    // For instance, if file names have been ordered by name, files.entities.files
    // will not keep that ordering but files.result does.
    // Note that we've to make sure the algorithm used for sorting at api level is
    // the same as what will be used here.
    const {files} = draft;
    const et = files.entities;
    // normalize the rawFile
    const filesToLoad = normalize(rawFiles, filesSchema);
    // All these new files should load to tree
    Object.values(filesToLoad.entities.files).forEach((f) => {
      // ! This is fine here as forEach mainly work via side effects.
      // eslint-disable-next-line no-param-reassign
      f.loadToTree = true;
    });
    // if there is no file in state, just assign this one and return.
    // This shouldn't happen because if we can load existing files, those should
    // have already been added to 'files' on initial load in loadToTree=false
    // state.
    if (files === null) {
      draft.files = filesToLoad;
      return;
    }
    if (et.tests === undefined) {
      et.tests = {};
    }
    if (et.versions === undefined) {
      et.versions = {};
    }
    // Object.assign works well even if source is null/undefined.
    Object.assign(et.files, filesToLoad.entities.files);
    Object.assign(et.tests, filesToLoad.entities.tests);
    Object.assign(et.versions, filesToLoad.entities.versions);
    // merge new files with existing maintaining the sort order. union gives
    // unique values.
    files.result = getSortedNames(
      union(files.result, filesToLoad.result),
      et.files
    );
  };
  // TODO: check whether some project is selected, if not, show a snackbar over
  // project and ask user to first select or create a project, once done rest
  // of the steps are done considering chosen project.
  // show some dialog, and populate available files (if there are some)
  // for project, show there files that are already in explorer in grey that
  // tells already in explorer (send loadToTree=true files to dialog).
  // Once files are chosen, fetch all their tests/versions and validate them
  // against a prebuilt json schema for that api response.
  // This dialog will be given 'onFilesSelection' callback that will be invoked
  // on files selection only, not if an error occurs and given the raw api
  // validated file.
  // For now, simulate this and get sample files. Note that, this is just for
  // testing this feature and fixed 'ids' are used in sample file.
  addNewFiles(sampleFilesToLoad);
};

const handleOnUnload = (draft, payload) => {
  if (payload.itemType === undefined || payload.itemId === undefined) {
    throw new Error('Insufficient arguments passed to onUnload.');
  }
  if (payload.itemType !== ExplorerItemType.FILE) {
    throw new Error(
      `Only item of type ${ExplorerItemType.FILE} could be unloaded.`
    );
  }
  const et = draft.files.entities;
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
    et.files[fid].tests = null;
  }
  et.files[fid].hasError = false;
  et.files[fid].loadToTree = false;
};

const handleOnNewItem = (draft, payload) => {
  if (payload.itemName === undefined || payload.itemType === undefined) {
    throw new Error('Insufficient arguments passed to onNewItem.');
  }
  if (
    payload.itemType !== ExplorerItemType.FILE &&
    payload.itemParentId === null
  ) {
    throw new Error('missing itemParentId in arguments.');
  }

  const newRandom = () => {
    return random(1000, 10000);
  };

  // !! TODO: if any error occurs during api call, abort update and show error
  // in a snackbar. Handle it centrally, later.
  // Note: New items addition have to wait for api response before adding to
  // tree. We could have taken defaults like name=v1, isCurrent=true and shown
  // the new item without waiting for api and if some error occurs, remove those
  // additions from tree, but the real database's 'id' field is what we needed
  // before rendering those elements.
  // Don't show up any loading in tree while we're waiting for a response,
  // tree should call these, no wait, reset edit state to hide the box, and once
  // api returns, 'files' state changes to load the new file.
  const addNewFile = () => {
    // call api, send itemType, itemName, retrieve fileId, name (name is taken
    // what is returned from api, possible that api sanitize the name)
    // !! put the following statement on success callback
    return new File(newRandom(), payload.itemName); // simulate
  };

  const addNewTest = () => {
    // call api, send itemType, itemName, parentType = FILE, itemParentId,
    // retrieve testId, name, versions, versionId, versionName, code, isCurrent
    // every new test contains a default v1 version with empty code.
    // !! put the following statement on success callback
    const newTestId = newRandom();
    return new Test(newTestId, payload.itemName, payload.itemParentId, [
      new Version(newRandom(), 'v1', newTestId, '', true), // simulate
    ]);
  };

  const addNewVersion = () => {
    // Version rules for new item: a new version will always contain code of
    // latest version (if some version exists) and will be marked 'latest', the
    // last latest version will no longer be latest.
    // A latest version can't be deleted and api should return
    // error if a call tries to do so.
    // call api, send itemType, itemName, parentType = TEST, itemParentId,
    // retrieve versionId, name, code, isCurrent
    // !! put the following statement on success callback
    return new Version(
      newRandom(),
      payload.itemName,
      payload.itemParentId,
      'openUrl("https://twitter.com")',
      true
    ); // simulate
  };

  // It'd be really verbose If I check before adding new file/test/version for
  // existence in 'files' cause every new thing carries a unique db id and
  // having a duplicate there is nearly impossible.
  switch (payload.itemType) {
    case ExplorerItemType.FILE: {
      const newFile = addNewFile();
      newFile.loadToTree = true;
      if (draft.files === null) {
        draft.files = {entities: {files: {newFile}}, result: [newFile.id]};
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
      const newTest = addNewTest();
      const newDefaultVersion = newTest.versions[0];
      const fid = payload.itemParentId;
      const {files} = draft; // file can't be null when adding test/version.
      const et = files.entities;
      if (et.tests === undefined) {
        // both tests and versions must be initialized.
        et.tests = {newTest};
        et.versions = {newDefaultVersion};
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
      const newVersion = addNewVersion();
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

const handleOnRename = (draft, payload) => {
  if (
    payload.itemNewName === undefined ||
    payload.itemType === undefined ||
    payload.itemCurrentName === undefined ||
    payload.itemId === undefined ||
    payload.dispatch === undefined
  ) {
    throw new Error('Insufficient arguments passed to onRename.');
  }
  if (
    payload.itemType !== ExplorerItemType.FILE &&
    payload.itemParentId === null
  ) {
    throw new Error('missing itemParentId in arguments.');
  }

  // while renaming, the siblings should be sorted ascending, to do that create
  // a new sortedIds array that excludes the one we're renaming, call a function
  // that get new sortedIds with renaming item's id placed sorted in array.
  const renameIntoState = (renameTo, draftToUse) => {
    const {files} = draftToUse;
    const et = files.entities;
    switch (payload.itemType) {
      case ExplorerItemType.FILE:
        et.files[payload.itemId].name = renameTo;
        files.result = getSortedNames(files.result, et.files);
        break;
      case ExplorerItemType.TEST:
        et.tests[payload.itemId].name = renameTo;
        et.files[payload.itemParentId].tests = getSortedNames(
          et.files[payload.itemParentId].tests,
          et.tests
        );
        break;
      case ExplorerItemType.VERSION:
        et.versions[payload.itemId].name = renameTo;
        et.tests[payload.itemParentId].versions = getSortedNames(
          et.tests[payload.itemParentId].versions,
          et.versions
        );
        break;
      default:
        throw new Error(
          `Couldn't identify item ${payload.itemType} while renaming`
        );
    }
  };

  const revert = (newDraft) => {
    renameIntoState(payload.itemCurrentName, newDraft);
  };

  // eslint-disable-next-line no-unused-vars
  const invokeRevert = () => {
    payload.dispatch([ON_RENAME_REVERT_CALLBACK, {revertFunc: revert}]);
  };

  renameIntoState(payload.itemNewName, draft);
  // TODO: now call api, if it fails, run following callback
  // renameIntoState(payload.itemCurrentName);
  // and show error with cause in form of snackbar, handled centrally.
  // Note that we're first renaming, i.e not waiting for api call to finish,
  // then starting it and if fails for some reason revert and show error.
  // For now call invokeRevert() in a setTimeout to simulate
  // setTimeout(invokeRevert, 500);
};

const handleOnRenameRevert = (draft, payload) => {
  if (payload.revertFunc === undefined) {
    throw new Error('No revert function found in payload');
  }

  payload.revertFunc(draft);
};

const handleOnDelete = (draft, payload) => {
  if (
    payload.itemType === undefined ||
    payload.itemId === undefined ||
    payload.dispatch === undefined
  ) {
    throw new Error('Insufficient arguments passed to onRename.');
  }
  if (
    payload.itemType !== ExplorerItemType.FILE &&
    payload.itemParentId === null
  ) {
    throw new Error('missing itemParentId in arguments.');
  }
  const {files} = draft;
  const et = files.entities;
  const revertOnError = {
    versions: [],
    tests: [],
    files: [],
    idsAdjustment: () => null,
  };
  switch (payload.itemType) {
    case ExplorerItemType.FILE: {
      const fid = payload.itemId;
      if (Array.isArray(et.files[fid].tests)) {
        et.files[fid].tests.forEach((tid) => {
          if (Array.isArray(et.tests[tid].versions)) {
            et.tests[tid].versions.forEach((vid) => {
              // Following and all similar object cloning is important for immer
              // to work, because while reverting, we're working on a new draft,
              // and if we don't clone, it's reference to the old draft's
              // object breaks immer.
              revertOnError.versions.push({[vid]: {...et.versions[vid]}});
              delete et.versions[vid];
            });
          }
          const testClone = {...et.tests[tid]};
          testClone.versions = [...testClone.versions];
          revertOnError.tests.push({[tid]: testClone});
          delete et.tests[tid];
        });
      }
      const fileClone = {...et.files[fid]};
      fileClone.tests = [...fileClone.tests];
      revertOnError.files.push({[fid]: fileClone});
      delete et.files[fid];
      pull(files.result, fid);
      revertOnError.idsAdjustment = (newDraft) => {
        const newFiles = newDraft.files;
        const newET = newFiles.entities;
        // don't just remember the index of current fid in result and place
        // in that index, because when api delays and user has renamed some file
        // the sort order may have changed, thus compute again.
        newFiles.result.push(fid);
        newFiles.result = getSortedNames(newFiles.result, newET.files);
      };
      break;
    }
    case ExplorerItemType.TEST: {
      const tid = payload.itemId;
      const fid = payload.itemParentId;
      if (Array.isArray(et.tests[tid].versions)) {
        et.tests[tid].versions.forEach((vid) => {
          revertOnError.versions.push({[vid]: {...et.versions[vid]}});
          delete et.versions[vid];
        });
      }
      const testClone = {...et.tests[tid]};
      testClone.versions = [...testClone.versions];
      revertOnError.tests.push({[tid]: testClone});
      delete et.tests[tid];
      pull(et.files[fid].tests, tid);
      revertOnError.idsAdjustment = (newDraft) => {
        const newET = newDraft.files.entities;
        if (newET.files[fid] !== undefined) {
          newET.files[fid].tests.push(tid);
          newET.files[fid].tests = getSortedNames(
            newET.files[fid].tests,
            newET.tests
          );
        }
      };
      break;
    }
    case ExplorerItemType.VERSION: {
      const vid = payload.itemId;
      const tid = payload.itemParentId;
      revertOnError.versions.push({[vid]: {...et.versions[vid]}});
      delete et.versions[vid];
      pull(et.tests[tid].versions, vid);
      revertOnError.idsAdjustment = (newDraft) => {
        const newET = newDraft.files.entities;
        if (newET.tests[tid] !== undefined) {
          newET.tests[tid].versions.push(vid);
          newET.tests[tid].versions = getSortedNames(
            newET.tests[tid].versions,
            newET.versions
          );
        }
      };
      break;
    }
    default:
      throw new Error(
        `Couldn't identify item ${payload.itemType} while deleting`
      );
  }

  const revert = (newDraft) => {
    const newET = newDraft.files.entities;
    revertOnError.versions.forEach((v) => {
      Object.assign(newET.versions, v);
    });
    revertOnError.tests.forEach((t) => {
      Object.assign(newET.tests, t);
    });
    revertOnError.files.forEach((f) => {
      Object.assign(newET.files, f);
    });
    revertOnError.idsAdjustment(newDraft);
  };

  /*
  Reverting isn't easy because the same draft in arguments couldn't be used
  for revert. The calling code will have to send a 'dispatch' as we don't have
  access to it here and revert has to be called as a separate action so we get
  a new draft.
  */
  // eslint-disable-next-line no-unused-vars
  const invokeRevert = () => {
    payload.dispatch([ON_DELETE_REVERT_CALLBACK, {revertFunc: revert}]);
  };

  // Deletion done in data, now invoke api and call invokeRevert() on failure
  // and show an error in snackbar, no action when it passes.
  // For now just call it in a setTimeout to simulate API call and see whether
  // it work, setTimeout(invokeRevert, 500);
};

const handleOnDeleteRevert = (draft, payload) => {
  if (payload.revertFunc === undefined) {
    throw new Error('No revert function found in payload');
  }

  payload.revertFunc(draft);
};

const handleOnRunBuild = (draft, payload) => {
  if (payload.itemType === undefined || payload.itemId === undefined) {
    throw new Error('Insufficient arguments passed to onRename.');
  }

  console.log('invoked handleRunBuild with arguments:');
  console.log(payload);
  // Open build config, show the selected ones as 'selected' and offer
  // to add more file/test/version. We should show file/test/version details
  // with every version of test going to run (the block that is draggable),
  // This handler makes changes in state to display the build config and other
  // things.
};

const handleOnRunBuildMulti = (draft, payload) => {
  if (payload.selectedNodes === undefined) {
    throw new Error('Insufficient arguments passed to onRename.');
  }

  console.log('invoked handleRunBuildMulti with arguments:');
  console.log(payload);
};

const callHandler = (state, payload, handler) => {
  return produce(state, (draft) => {
    handler(draft, payload, state);
  });
};

// - Reducer must be pure https://redux.js.org/basics/reducers#handling-actions,
//   though we can perform side effects following https://redux.js.org/advanced/async-actions
// - Action is designed per https://github.com/redux-utilities/flux-standard-action#actions
// - Don't use 'produce' on root reducer https://immerjs.github.io/immer/docs/example-reducer,
//   we can use them in reducers involved within the root reducers, for example
//   in reducers used for data fetching.

// TODO: currently this reducer is not using api calls etc, follow the above
// mentioned links to see how to make async reducers and use swr library etc to
// do that. Remove references to Math.random() etc from here if any.
const ideRootReducer = (state, [type, payload, error, meta]) => {
  if (error) {
    handleErrorsGlobally(payload, meta);
    return state;
  }
  switch (type) {
    case INITIAL_SET_FILES:
      return produce(state, (draft) => {
        draft.files = payload.files;
      });
    case SET_PROJECT:
      return produce(state, (draft) => {
        if (payload.projectId === undefined) {
          throw new Error('Insufficient arguments passed to onProjectChange.');
        }
        draft.projectId = payload.projectId;
        // TODO: we may also change qs value to new projectId
      });
    case ON_LOAD_CALLBACK:
      return callHandler(state, payload, handleOnLoad);
    case ON_UNLOAD_CALLBACK:
      return callHandler(state, payload, handleOnUnload);
    case ON_NEW_ITEM_CALLBACK:
      return callHandler(state, payload, handleOnNewItem);
    case ON_RENAME_CALLBACK:
      return callHandler(state, payload, handleOnRename);
    case ON_RENAME_REVERT_CALLBACK:
      return callHandler(state, payload, handleOnRenameRevert);
    case ON_DELETE_CALLBACK:
      return callHandler(state, payload, handleOnDelete);
    case ON_DELETE_REVERT_CALLBACK:
      return callHandler(state, payload, handleOnDeleteRevert);
    case ON_RUN_BUILD_CALLBACK:
      return callHandler(state, payload, handleOnRunBuild);
    case ON_RUN_BUILD_MULTI_CALLBACK:
      return callHandler(state, payload, handleOnRunBuildMulti);
    default:
      return state;
  }
};

const initialState = {
  projectId: new URLSearchParams(document.location.search).get('project'),
  files: null,
};

const Ide = () => {
  const [state, dispatch] = useReducer(ideRootReducer, initialState);

  useEffect(() => {
    /*
    - Fetching and populating files into state:
      - User may visit IDE choosing either a file/test/version. If version is
        selected, we've all 3 ids in qs, if test, we've file/test ids in qs,
        if file was selected we've just fileId in qs.
      - if no file exists yet, we won't get fileId in qs.
      - projectId is always in qs unless user hasn't selected a project or none
        exist yet.
      - when version was selected, code of that should be opened in editor,
        when test, code of it's latest (with tree expanded and focused on that)
      - Based on whether a file is received, fetch all it's tests/versions.
        Also fetch other files within the project but only file part, no tests.
        this should be done using single api, after api returns validate
        response using a json-schema.
      - make sure all content is ordered, i.e files, tests, versions should be
        in ascending order within their parent.
    */
    const qsParams = new URLSearchParams(document.location.search);
    // TODO: remove '?? 1' after test done
    const fileId = qsParams.get('file') ?? 1;
    /* const testId = qsParams.get('test');
    const versionId = qsParams.get('version'); */
    // Send to api fileId (if not null) and get list of files, only the given
    // fileId will have it's tests fetched.
    // assume sampleFiles is what we got from api
    if (Array.isArray(sampleFiles) && sampleFiles.length) {
      const normalizedFiles = normalize(sampleFiles, filesSchema);
      if (normalizedFiles.result.includes(fileId)) {
        normalizedFiles.entities.files[fileId].loadToTree = true;
      }
      dispatch([INITIAL_SET_FILES, {files: normalizedFiles}]);
    }
    // Note: If some error occurs during fetch of files, set error=true,
    // payload to error object and in meta the type of error we should
    // show, for example asking user to reload through a modal dialog,
    // sending to an error page, showing snackbar.
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <RootDispatchContext.Provider value={dispatch}>
        <RootStateContext.Provider value={state}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              margin: 0,
            }}>
            <div style={{display: 'flex', flex: '1 1 auto'}}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}>
                <TopNavigation />
                <Content />
              </div>
            </div>
          </div>
        </RootStateContext.Provider>
      </RootDispatchContext.Provider>
    </ThemeProvider>
  );
};

export default Ide;

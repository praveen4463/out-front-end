import produce from 'immer';
import pull from 'lodash-es/pull';
import {
  EDR_EXP_VERSIONS_DELETED,
  EDR_EXP_VERSION_CLICK,
  EDR_EXP_VERSION_DBL_CLICK,
  EDR_SWITCH_TAB,
  EDR_CLOSE_TAB,
  EDR_DBL_CLICK_TAB,
  EDR_VERSION_CODE_UPDATED,
} from '../actionTypes';
import Tab from '../Editor/model';

// TODO: Think whether we need to limit the number of tabs opened at a time.

// Finds and returns tab using versionId from maps, if no tab is returned an
// error is thrown by default.
// Note: TabEntry is a 2D array of versionId and Tab
const getTabEntry = (maps, versionId, throwOnNotFound = true) => {
  const tab = maps.find((m) => m[0] === versionId);
  if (!tab && throwOnNotFound) {
    throw new Error(`No such tab of versionId ${versionId} exist.`);
  }
  return tab;
};

const getTabValue = (maps, versionId, throwOnNotFound = true) => {
  const tab = getTabEntry(maps, versionId, throwOnNotFound);
  return tab[1];
};

// Note that we can remove
// tabs from editor immediately rather than saying 'deleted from explorer' or
// something like that, as we always auto save the code written, so
// there is no chance user loosing their code if they had done an unload
// rather than a delete. When deleted, don't worry about code lose, we can
// anyway retrieve that from archives.
const deleteTab = (editor, versionId) => {
  const {tabs} = editor;
  const {maps} = tabs;
  const tab = getTabEntry(maps, versionId);
  // We need to switch selected tab if this tab is the selected one, rule is,
  // if this tab is on index 0, select the one after it else behind it. If there
  // are no more tabs, don't do anything.
  if (tabs.selectedTabVersionId === versionId) {
    if (maps.length > 1) {
      const selectedTabIndex = maps.findIndex((m) => m[0] === versionId);
      const newSelectedTabIndex =
        selectedTabIndex === 0 ? 1 : selectedTabIndex - 1;
      const newSelectedTab = maps[newSelectedTabIndex];
      newSelectedTab[1].selected = true;
      [tabs.selectedTabVersionId] = newSelectedTab;
    } else {
      tabs.selectedTabVersionId = null;
    }
  }
  // Reset temporary if this was a temporary tab
  if (tabs.temporaryTabVersionId === versionId) {
    tabs.temporaryTabVersionId = null;
  }
  // finally delete this tab
  pull(maps, tab);
};

const explorerVersionsDeleted = (draft, payload) => {
  if (!Array.isArray(payload.versionIds)) {
    throw new Error(
      'Insufficient arguments passed to explorerVersionsDeleted.'
    );
  }
  const {versionIds} = payload;
  const {tabs} = draft.editor;
  // check whether any of incoming version is a tab, if none then return.
  const allTabsVersionIds = tabs.maps.map((m) => m[0]);
  if (!versionIds.some((v) => allTabsVersionIds.includes(v))) {
    return;
  }
  if (versionIds.length === 1) {
    deleteTab(draft.editor, versionIds[0]);
    return;
  }
  // If deleted tabs had temporary tab, reset temporaryVersionId
  if (versionIds.includes(tabs.temporaryTabVersionId)) {
    tabs.temporaryTabVersionId = null;
  }
  // if selected version is not among deleting versions, just delete tabs and done.
  if (!versionIds.includes(tabs.selectedTabVersionId)) {
    tabs.maps = tabs.maps.filter((m) => !versionIds.includes(m[0]));
    return;
  }
  const {maps} = tabs;
  // keep remaining tabs separately, don't yet assign into tabs, we will make
  // selected tab changes into it and then assign to tabs.
  const tabsRemaining = tabs.maps.filter((m) => !versionIds.includes(m[0]));
  if (tabsRemaining.length === 0) {
    // if all tabs are going to delete, there won't be a selected tab
    tabs.selectedTabVersionId = null;
    tabs.maps = [];
    return;
  }
  const selectedTabIndex = maps.findIndex(
    (m) => m[0] === tabs.selectedTabVersionId
  );
  // if just one tab remains after deletion or the selected tab is in index 0
  // or 1, we're going to make tab at index 0 the selected tab in the
  // remaining tabs. This is done because tab at index 1 when deleted will
  // always find either tab and left or right, if left is not deleting it is
  // the selected (which is at index 0), and if left is deleting, any tab
  // from the right not deleting becomes tab at index 0 hence selected.
  if (
    tabsRemaining.length === 1 ||
    selectedTabIndex === 0 ||
    selectedTabIndex === 1
  ) {
    tabsRemaining[0][1].selected = true;
    [[tabs.selectedTabVersionId]] = tabsRemaining;
  } else {
    // When remaining tabs and selected tab index are higher than 1, we need to
    // find which tab on the left is not going to delete, if one found, make it
    // selected and assign it's versionId to selected. If none found, that would
    // means all tabs on left are deleting, in which case we can just select
    // 0th index tab from remaining tabs.
    let found = false;
    for (let i = selectedTabIndex - 1; i >= 0; i -= 1) {
      if (!versionIds.includes(maps[i][0])) {
        maps[i][1].selected = true;
        [tabs.selectedTabVersionId] = maps[i];
        found = true;
        break;
      }
    }
    if (!found) {
      tabsRemaining[0][1].selected = true;
      [[tabs.selectedTabVersionId]] = tabsRemaining;
    }
  }
  tabs.maps = tabsRemaining;
};

const addTab = (editor, versionId, temporary, atIndex = null) => {
  const {tabs} = editor;
  const {maps} = tabs;
  const newTab = [versionId, new Tab(versionId, temporary, true)];
  if (atIndex) {
    maps.splice(atIndex, 0, newTab);
  } else {
    maps.push(newTab);
  }
  if (temporary) {
    tabs.temporaryTabVersionId = versionId;
  }
  // Deselect previously selected.
  // first check if some selection exist, cause this could be the first tab
  if (tabs.selectedTabVersionId) {
    const currentlySelectedTab = getTabEntry(maps, tabs.selectedTabVersionId);
    // possible that the tab was deleted
    if (currentlySelectedTab) {
      currentlySelectedTab[1].selected = false;
    }
  }
  // select the newly added tab.
  tabs.selectedTabVersionId = versionId;
};

const changeTabSelection = (editor, changeToTabVersionId) => {
  const {tabs} = editor;
  const {maps} = tabs;
  // reset selected status of currently selected tab
  const currentlySelectedTab = getTabValue(maps, tabs.selectedTabVersionId);
  currentlySelectedTab.selected = false;
  // assign new tab selected status
  tabs.selectedTabVersionId = changeToTabVersionId;
  const newlySelectedTab = getTabValue(maps, changeToTabVersionId);
  newlySelectedTab.selected = true;
};

const explorerVersionClick = (draft, payload) => {
  if (payload.versionId === undefined) {
    throw new Error('Insufficient arguments passed to explorerVersionClick.');
  }
  const {versionId} = payload;
  const temporary = true;
  const {editor} = draft;
  const {tabs} = editor;
  const {maps} = tabs;

  // First check whether some tab exist for this version
  if (maps.some((m) => m[0] === versionId)) {
    // if this tab is not selected, select it.
    if (tabs.selectedTabVersionId !== versionId) {
      changeTabSelection(editor, versionId);
    }
    // now we can return
    return;
  }

  // if there is no tab yet, just put it and done, i.e no need to see currently
  // selected tab and put after that.
  if (maps.length === 0) {
    addTab(editor, versionId, temporary);
    return;
  }

  // check if there is any temporary tab already, if so, keep it, don't remove
  // it now as it may be the selected tab and we need it's index to put new one
  // after it. If it's the selected one and we keep it's index before deleting,
  // the index won't be valid as one item got deleted. So, just keep the temp
  // tab, find the selected index, put the new temp item after selected, and
  // then delete previous temp if it was there.
  const existingTempTab = tabs.temporaryTabVersionId
    ? getTabEntry(maps, tabs.temporaryTabVersionId)
    : null;
  // there will always be some selected tab
  const indexOfSelected = maps.findIndex(
    (m) => m[0] === tabs.selectedTabVersionId
  );
  addTab(editor, versionId, temporary, indexOfSelected + 1);
  if (existingTempTab) {
    pull(maps, existingTempTab);
  }
};

// double click comes after two single click events, it is fine that when a
// temp file is opened and another file is double clicked, it deletes temp file
// and replaces it because first single click event fires. This is a known bug
// that we can handle sometime in future.
const explorerVersionDblClick = (draft, payload) => {
  if (payload.versionId === undefined) {
    throw new Error(
      'Insufficient arguments passed to explorerVersionDblClick.'
    );
  }
  const {versionId} = payload;
  const temporary = false;
  const {editor} = draft;
  const {tabs} = editor;
  const {maps} = tabs;
  // if there is no tab, just put it and done, i.e no need to look the selected
  // one and put after that.
  if (maps.length === 0) {
    addTab(editor, versionId, temporary);
    return;
  }
  // if this version already exist, check if it's temporary, if so, make it
  // permanent, else do nothing.

  // First check whether some tab exist for this version
  const existingTabEntry = getTabEntry(maps, versionId, false);
  if (existingTabEntry) {
    const [, existingTab] = existingTabEntry;
    // if this tab is temporary, make it permanent
    if (existingTab.temporary) {
      existingTab.temporary = false;
      // as there is no temp tab now, reset temp tab status.
      tabs.temporaryTabVersionId = null;
    }
    // if this tab is not selected, select it.
    if (tabs.selectedTabVersionId !== versionId) {
      changeTabSelection(editor, versionId);
    }
    return;
  }

  const indexOfSelected = maps.findIndex(
    (m) => m[0] === tabs.selectedTabVersionId
  );
  addTab(editor, versionId, temporary, indexOfSelected + 1);
};

const switchTab = (draft, payload) => {
  if (payload.versionId === undefined) {
    throw new Error('Insufficient arguments passed to switchTab.');
  }
  const {tabs} = draft.editor;
  if (tabs.selectedTabVersionId === payload.versionId) {
    throw new Error(
      'Tabs switch event not actually switching but keeping the same selected tab.'
    );
  }
  changeTabSelection(draft.editor, payload.versionId);
};

const closeTab = (draft, payload) => {
  if (payload.versionId === undefined) {
    throw new Error('Insufficient arguments passed to closeTab.');
  }
  deleteTab(draft.editor, payload.versionId);
};

const dblClickTab = (draft, payload) => {
  if (payload.versionId === undefined) {
    throw new Error('Insufficient arguments passed to dblClickTab.');
  }
  const {versionId} = payload;
  const {tabs} = draft.editor;
  const {maps} = tabs;
  if (!tabs.temporaryTabVersionId || tabs.temporaryTabVersionId !== versionId) {
    // This tab is not the temporary one in editor tabs, thus double clicking
    // has no effect, it makes sense for temporary tab only.
    return;
  }
  const tab = getTabValue(maps, versionId);
  tab.temporary = false;
  tabs.temporaryTabVersionId = null;
};

const editorVersionCodeUpdated = (draft, payload) => {
  // console.log('editor version code updating reducer invoked', payload);
  if (payload.versionId === undefined || payload.versionCode === undefined) {
    throw new Error(
      'Insufficient arguments passed to editorVersionCodeUpdated.'
    );
  }
  draft.files.entities.versions[payload.versionId].code = payload.versionCode;
};

const editorReducer = produce((draft, action) => {
  const {payload} = action;
  switch (action.type) {
    case EDR_EXP_VERSIONS_DELETED:
      explorerVersionsDeleted(draft, payload);
      break;
    case EDR_EXP_VERSION_CLICK:
      explorerVersionClick(draft, payload);
      break;
    case EDR_EXP_VERSION_DBL_CLICK:
      explorerVersionDblClick(draft, payload);
      break;
    case EDR_SWITCH_TAB:
      switchTab(draft, payload);
      break;
    case EDR_CLOSE_TAB:
      closeTab(draft, payload);
      break;
    case EDR_DBL_CLICK_TAB:
      dblClickTab(draft, payload);
      break;
    case EDR_VERSION_CODE_UPDATED:
      editorVersionCodeUpdated(draft, payload);
      break;
    default:
      break;
  }
});

export default editorReducer;

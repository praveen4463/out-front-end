import produce from 'immer';
import {pull} from 'lodash-es';
import {
  EDR_EXP_VERSIONS_DELETED,
  EDR_EXP_VERSION_CLICK,
  EDR_EXP_VERSION_DBL_CLICK,
  EDR_SWITCH_TAB,
  EDR_CLOSE_TAB,
  EDR_DBL_CLICK_TAB,
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
// tabs from editor right away rather than saying 'deleted from explorer' or
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
  if (tabs.selectedTabVersionId === versionId && maps.length > 1) {
    const currentTabIndex = maps.findIndex((m) => m[0] === versionId);
    const newSelectedTabIndex = currentTabIndex === 0 ? 1 : currentTabIndex - 1;
    const newSelectedTab = maps[newSelectedTabIndex];
    newSelectedTab[1].selected = true;
    [tabs.selectedTabVersionId] = newSelectedTab;
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
  if (versionIds.length === 1) {
    deleteTab(draft.editor, [versionIds]);
    return;
  }
  tabs.maps = tabs.maps.filter((m) => !versionIds.includes(m[0]));
  // For now, just select the first tab when multiple are deleted, I could also
  // find the lowest index among all deleted and then decide which one to
  // select but leaving that for later time. This is a TODO for now.
  const {maps} = tabs;
  if (versionIds.includes(tabs.selectedTabVersionId) && maps.length > 0) {
    const [first] = maps;
    first[1].selected = true;
    [tabs.selectedTabVersionId] = first;
  }
  // If deleted tabs had temporary tab, reset temporaryVersionId
  if (versionIds.includes(tabs.temporaryTabVersionId)) {
    tabs.temporaryTabVersionId = null;
  }
};

const addTab = (editor, versionId, temporary, selected, atIndex = null) => {
  const {tabs} = editor;
  const {maps} = tabs;
  const newTab = [versionId, new Tab(versionId, temporary, selected)];
  if (atIndex) {
    maps.splice(atIndex, 0, newTab);
  } else {
    maps.push(newTab);
  }
  if (temporary) {
    tabs.temporaryTabVersionId = versionId;
  }
  if (selected) {
    tabs.selectedTabVersionId = versionId;
  }
};

const selectAnotherTab = (editor, anotherTabVersionId) => {
  const {tabs} = editor;
  const {maps} = tabs;
  // reset selected status of currently selected tab
  const currentlySelectedTab = getTabValue(maps, tabs.selectedTabVersionId);
  currentlySelectedTab.selected = false;
  // assign new tab selected status
  tabs.selectedTabVersionId = anotherTabVersionId;
  const newlySelectedTab = getTabValue(maps, anotherTabVersionId);
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
      selectAnotherTab(editor, versionId);
    }
    // now we can return
    return;
  }

  // if there is no tab yet, just put it and done, i.e no need to see currently
  // selected tab and put after that.
  if (maps.length === 0) {
    addTab(editor, versionId, temporary, true);
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
  addTab(editor, versionId, temporary, true, indexOfSelected + 1);
  if (existingTempTab) {
    pull(maps, existingTempTab);
  }
};

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
    addTab(editor, versionId, temporary, true);
    return;
  }
  // if this version already exist, check if it's temporary, if so, make it
  // permanent, else do nothing.

  // First check whether some tab exist for this version
  const existingTab = getTabValue(maps, versionId, false);
  if (existingTab) {
    // if this tab is temporary, make it permanent
    if (existingTab.temporary) {
      existingTab.temporary = false;
    }
    // if this tab is not selected, select it.
    if (tabs.selectedTabVersionId !== versionId) {
      selectAnotherTab(editor, versionId);
    }
    return;
  }

  const indexOfSelected = maps.findIndex(
    (m) => m[0] === tabs.selectedTabVersionId
  );
  addTab(editor, versionId, temporary, true, indexOfSelected + 1);
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
  selectAnotherTab(draft.editor, payload.versionId);
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
    default:
      break;
  }
});

export default editorReducer;

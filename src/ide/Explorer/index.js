import React, {
  useRef,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Typography from '@material-ui/core/Typography';
import Skeleton from '@material-ui/lab/Skeleton';
import IconButton from '@material-ui/core/IconButton';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import produce, {immerable} from 'immer';
import axios from 'axios';
import {ExplorerItemType, ExplorerEditOperationType} from '../Constants';
import {handleApiError, fromJson} from '../../common';
import {getExplorerItemEndpoint} from '../common';
import TreeItemEditor from './TreeItemEditor';
import TreeItemContent from './TreeItemContent';
import Tooltip from '../../TooltipCustom';
import {
  IdeDispatchContext,
  IdeProjectIdContext,
  IdeFilesContext,
  IdeEditorContext,
} from '../Contexts';
import batchActions from '../actionCreators';
import {EXP_NEW_ITEM, EDR_EXP_VERSION_CLICK} from '../actionTypes';
import {Version, Test, File} from './model';
import ColoredItemIcon from '../../components/ColoredItemIcon';
import {getNodeId, getBrokenNodeId} from './internal';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';

const useStyles = makeStyles((theme) => ({
  explorer: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
  root: {
    color: 'inherit',
    '&$selected > $content $label, &$selected:focus > $content $label, &$selected:hover > $content $label': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  content: {
    color: 'inherit',
  },
  group: {
    marginLeft: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
  expanded: {},
  selected: {},
  label: {
    paddingLeft: '0px',
    fontWeight: 'inherit',
    color: 'inherit',
  },
  iconButton: {
    padding: theme.spacing(1),
  },
  icon: {
    fontSize: '1rem',
    opacity: theme.textOpacity.highEmphasis,
  },
  fileCaption: {
    paddingLeft: theme.spacing(1),
  },
  noFiles: {
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(2),
  },
  iconContainer: {
    marginRight: '0px',
  },
  highlight: {
    backgroundColor: theme.palette.action.selected,
  },
  errorContainer: {
    backgroundColor: theme.palette.background.paper,
  },
  newItemSkelton: {
    backgroundColor: theme.palette.background.contrastText,
  },
  borderBottomLight: {
    borderBottom: `1px solid ${theme.palette.border.light}`,
  },
  header: {
    minHeight: theme.spacing(4),
  },
  borderLeftLight: {
    borderLeft: `1px solid ${theme.palette.border.light}`,
  },
}));

const getExplorerParentTypeByChild = (childType) => {
  let parentType;
  switch (childType) {
    case ExplorerItemType.TEST:
      parentType = ExplorerItemType.FILE;
      break;
    case ExplorerItemType.VERSION:
      parentType = ExplorerItemType.TEST;
      break;
    default:
      throw new Error(`No parent for this child type ${childType}`);
  }
  return parentType;
};

/*
  Every tree item content invoke this to get sibling names that are used in
  checking duplicates. I could have just placed them next to child array like
  'result', 'tests' but don't want to pollute 'files' too much with data that
  can be computed. There is surely a performance penalty with this as all the
  items have to compute their siblings but this is not that bad as it seems.
  TreeItem doesn't render all items at once, only the top nodes are rendered
  first and subsequent render occurs when nodes are expanded to only the child
  nodes and so on. So this computation will be done for fewer nodes at a time.
*/
const getNamesByIdMapping = (ids, sourceObjWithIdKey) => {
  if (!Array.isArray(ids)) {
    return null;
  }
  return ids.map((id) => sourceObjWithIdKey[id].name);
};

function AddNewItem(type, parentId = null, submitted = false) {
  this.type = type;
  this.parentId = parentId;
  this.submitted = submitted;
  this[immerable] = true;
}

const selectedTabChange = (state, action) => {
  return produce(state, (draft) => {
    const {payload} = action;
    if (
      payload.selectedTabVersionId === undefined ||
      payload.entitiesVersions === undefined ||
      payload.entitiesTests === undefined
    ) {
      throw new Error('Insufficient arguments to selectedTabChange');
    }
    const {selectedTabVersionId} = payload;
    /*
    selectedVersionId is kept just to keep track of tab changes and nothing else.
    When user changes a version selection either form explorer or tabs, it needs
    to reflect in both tabs and explorer. Explorer uses useEffect to check the
    selected version and selects that after each update in selectedTabVersionId.
    Since effect uses versions and tests entities to expand the nodes of
    a version, effect also runs when one of these entities have changes, so for
    example, user selects few versions that open in tabs. Now they select some
    test/file and try renaming them, this will cause effect run, but 
    selectedTabVersionId hasn't changed. How will we know whether to change
    'selected' state? If we compare selectedTabVersionId with currently selected
    node, they're different, means its a legit version change, but it's not
    cause we have selected a test/file. To know the last selected version, keep
    it separately in state and update it whenever a new selectedTabVersionId is
    arrived by comparing both of them, once different update selectedVersionId
    with latest selectedTabVersionId, this way even when the effect runs on
    test/file updates, we will never de select their selection nor will we
    expand nodes unnecessarily, we will expand only when a version selection
    is changed.
    */
    if (selectedTabVersionId === draft.selectedVersionId) {
      // no version changed but something else changed like a test was renamed.
      return;
    }
    if (!selectedTabVersionId) {
      // if the incoming tab is null (for instance, last tab closed), reset
      // selectedNode only if currently a version is selected. If a test or file
      // is selected we don't want to deselect it.
      if (draft.selectedNode) {
        const node = getBrokenNodeId(draft.selectedNode);
        if (node.itemType === ExplorerItemType.VERSION) {
          draft.selectedNode = null;
        }
      }
      // reassign into selectedVersionId
      draft.selectedVersionId = null;
      return;
    }
    draft.selectedNode = getNodeId(
      ExplorerItemType.VERSION,
      selectedTabVersionId
    );
    // expand test and file for this version
    const version = payload.entitiesVersions[selectedTabVersionId];
    const testNode = getNodeId(ExplorerItemType.TEST, version.testId);
    const fileNode = getNodeId(
      ExplorerItemType.FILE,
      payload.entitiesTests[version.testId].fileId
    );
    const {expandedNodes} = draft;
    if (!expandedNodes.includes(testNode)) {
      expandedNodes.push(testNode);
    }
    if (!expandedNodes.includes(fileNode)) {
      expandedNodes.push(fileNode);
    }
    // reassign into selectedVersionId
    draft.selectedVersionId = selectedTabVersionId;
  });
};

const actionTypes = {
  SELECTED_TAB_CHANGE: 'SELECTED_TAB_CHANGE',
  NODE_SELECTED: 'NODE_SELECTED',
  NODE_TOGGLE: 'NODE_TOGGLE',
  EXPAND_NODE: 'EXPAND_NODE',
  ADD_NEW_ITEM: 'ADD_NEW_ITEM',
  NEW_ITEM_SUBMITTED: 'NEW_ITEM_SUBMITTED',
  NEW_ITEM_SET_NULL: 'NEW_ITEM_SET_NULL',
};

const reducer = (state, action) => {
  const {type} = action;
  switch (type) {
    case actionTypes.SELECTED_TAB_CHANGE:
      return selectedTabChange(state, action);
    case actionTypes.NODE_SELECTED:
      if (action.payload.nodeId === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      return produce(state, (draft) => {
        draft.selectedNode = action.payload.nodeId;
      });
    case actionTypes.NODE_TOGGLE:
      if (action.payload.nodeIds === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      return produce(state, (draft) => {
        draft.expandedNodes = action.payload.nodeIds;
      });
    case actionTypes.EXPAND_NODE:
      if (action.payload.nodeId === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      return produce(state, (draft) => {
        if (!draft.expandedNodes.includes(action.payload.nodeId)) {
          draft.expandedNodes.push(action.payload.nodeId);
        }
      });
    case actionTypes.ADD_NEW_ITEM: {
      const {payload} = action;
      if (payload.itemType === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      return produce(state, (draft) => {
        let newItem;
        if (payload.itemParentId === undefined) {
          newItem = new AddNewItem(payload.itemType);
        } else {
          newItem = new AddNewItem(payload.itemType, payload.itemParentId);
        }
        draft.addNewItem = newItem;
      });
    }
    case actionTypes.NEW_ITEM_SUBMITTED:
      return produce(state, (draft) => {
        if (!draft.addNewItem) {
          throw new Error(
            'addNewItem can not be marked submitted because it does not exist.'
          );
        }
        draft.addNewItem.submitted = true;
      });
    case actionTypes.NEW_ITEM_SET_NULL:
      return produce(state, (draft) => {
        draft.addNewItem = null;
      });
    default:
      return state;
  }
};

const initialState = {
  selectedNode: null,
  expandedNodes: [],
  selectedVersionId: null,
  addNewItem: null,
};

/* Re render only if the subscribed context or local state changes, not when
parent re renders. */
const Explorer = React.memo(({closeButton}) => {
  const dispatchGlobal = useContext(IdeDispatchContext);
  const projectId = useContext(IdeProjectIdContext);
  const files = useContext(IdeFilesContext);
  const etFiles = files !== null ? files.entities.files : null;
  const etTests = files !== null ? files.entities.tests : null;
  const etVersions = files !== null ? files.entities.versions : null;
  const filesResult = files !== null ? files.result : null;
  const editor = useContext(IdeEditorContext);
  const [state, dispatchLocal] = useReducer(reducer, initialState);
  // console.log(`Explorer renders ${Date.now()}`);
  const filesRef = useRef(files);
  const errorContainerRef = useRef(null);
  // ref object doesn't change thus safe to use in pure components. It's mutable
  // current property will give us latest set value without a re render of
  // component that uses it.
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const classes = useStyles();

  // Sets state changes into various refs
  useEffect(() => {
    if (filesRef.current !== files) {
      filesRef.current = files;
    }
  });

  useEffect(() => {
    // etVersions and etTests could be undefined when none of the files have
    // a test
    dispatchLocal({
      type: actionTypes.SELECTED_TAB_CHANGE,
      payload: {
        selectedTabVersionId: editor.tabs.selectedTabVersionId,
        entitiesVersions: etVersions === undefined ? null : etVersions,
        entitiesTests: etTests === undefined ? null : etTests,
      },
    });
  }, [
    // Don't assume that we don't need tests/versions in dependencies as they
    // are not primitives. Whenever there is an change in any of
    // these, we create new object and replace these, if we don't add, it will
    // refer to the old objects, that's why these are needed here. Important
    // thing is we never mutate but create new.
    editor.tabs.selectedTabVersionId,
    etTests,
    etVersions,
  ]);

  const handleSelect = (e, nodeId) => {
    const node = getBrokenNodeId(nodeId);
    // when the same selected version is clicked, nothing happens and tabs
    // context doesn't change, if we send a dispatch in that and return
    // , the selection state doesn't change. This is desirable when clicking
    // on a version that is highlighted but if for example version's test is
    // clicked and again version is clicked, that click doesn't select version
    // cause selected state didn't change (as the version is the selected tab)
    // To let version > test > version, or version > file > version navigation
    // work for versions that are selected as tabs, don't send a dispatch for
    // those version click and just change the selected state.
    // when version > version click occurs, selected state logic doesn't
    // update itself.
    if (
      node.itemType === ExplorerItemType.VERSION &&
      node.itemId !== editor.tabs.selectedTabVersionId
    ) {
      // dispatch a version select when user explicitly selects a version.
      // Don't update local selected state, it will be updated after
      // the dispatch due to editor.tabs's selectedVersion change.
      dispatchGlobal({
        type: EDR_EXP_VERSION_CLICK,
        payload: {versionId: node.itemId},
      });
      return;
    }
    // Always change local selected state for different node than a version.
    // Don't change selected state if incoming nodeId is already selected,
    // for example clicking on the same item that's selected.
    // since nodeId is a primitive, if it's the same as what's selected, state
    // won't change.
    // Note: when double click happens, this can cause an extra re render after
    // the first click goes, because 2 click happens before a dbl click, and
    // on second click, even though no state change occurs, react may still
    // re render.
    dispatchLocal({type: actionTypes.NODE_SELECTED, payload: {nodeId}});
  };

  const handleToggle = (e, nodeIds) => {
    // nodeIds have all expanded nodeIds, including ones opened on 'new item'
    // call, thus it's safe to reset entire array.
    dispatchLocal({type: actionTypes.NODE_TOGGLE, payload: {nodeIds}});
  };

  const onNewFile = () => {
    dispatchLocal({
      type: actionTypes.ADD_NEW_ITEM,
      payload: {itemType: ExplorerItemType.FILE},
    });
  };

  const newItemCallback = useCallback((itemType, itemParentId) => {
    // I've checked these two dispatches causes just a single re render not two,
    // if this may cause two, move expand logic within add new item.
    dispatchLocal({
      type: actionTypes.ADD_NEW_ITEM,
      payload: {itemType, itemParentId},
    });
    if (!itemParentId) {
      return;
    }
    dispatchLocal({
      type: actionTypes.EXPAND_NODE,
      payload: {
        nodeId: getNodeId(getExplorerParentTypeByChild(itemType), itemParentId),
      },
    });
  }, []);

  // TODO: see if we need to put this in useCallback
  const newItemCommitCallback = (newItemName, newItemType) => {
    async function save() {
      try {
        let body;
        let ctor;
        switch (newItemType) {
          case ExplorerItemType.FILE:
            body = new File(null, newItemName);
            ctor = File;
            break;
          case ExplorerItemType.TEST:
            body = new Test(null, newItemName, state.addNewItem.parentId);
            ctor = Test;
            break;
          case ExplorerItemType.VERSION:
            body = new Version(null, newItemName, state.addNewItem.parentId);
            ctor = Version;
            break;
          default:
            throw new Error(`Can't recognize ${newItemType}`);
        }
        const {data} = await axios.post(
          getExplorerItemEndpoint(newItemType, projectId),
          body
        );
        const newItem = fromJson(ctor, data);
        if (newItem instanceof Test) {
          // convert any nested instances as well, only a new test contain single
          // nested version.
          newItem.versions = newItem.versions.map((v) => fromJson(Version, v));
        }
        const actions = [
          {
            type: EXP_NEW_ITEM,
            payload: {
              item: newItem,
              itemType: newItemType,
              itemParentId: state.addNewItem.parentId,
            },
          },
        ];
        // if new item was version or test, select the new version
        if (
          newItemType === ExplorerItemType.TEST ||
          newItemType === ExplorerItemType.VERSION
        ) {
          const newVersion =
            newItemType === ExplorerItemType.TEST
              ? newItem.versions[0]
              : newItem;
          // dispatch a version select when an implicit selection of a version
          // occurs. Don't update local selected state, it will be updated after
          // the dispatch due to editor.tabs's selectedVersion change.
          actions.push({
            type: EDR_EXP_VERSION_CLICK,
            payload: {versionId: newVersion.id},
          });
        }
        dispatchGlobal(batchActions(actions));
      } catch (error) {
        handleApiError(error, setSnackbarErrorMsg, "Couldn't save");
      } finally {
        dispatchLocal({type: actionTypes.NEW_ITEM_SET_NULL});
      }
    }

    save();
    dispatchLocal({type: actionTypes.NEW_ITEM_SUBMITTED});
  };

  const newItemCancelCallback = useCallback(() => {
    dispatchLocal({type: actionTypes.NEW_ITEM_SET_NULL});
  }, []);

  const getNewItemEditor = (existingNames) => {
    return (
      <div
        className={classes.content}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
        }}>
        <div
          className={classes.iconContainer}
          style={{
            width: '15px',
            display: 'flex',
            flexShrink: 0,
            justifyContent: 'center',
          }}
        />
        <div
          className={classes.label}
          style={{
            width: '100%',
            position: 'relative',
          }}>
          <Box
            display="flex"
            px={0.5}
            minHeight={28}
            className={classes.highlight}>
            {!state.addNewItem.submitted ? (
              <TreeItemEditor
                defaultName=""
                existingNames={existingNames}
                itemType={state.addNewItem.type}
                operationType={ExplorerEditOperationType.NEW_ITEM}
                onCommit={newItemCommitCallback}
                onCancel={newItemCancelCallback}
                errorContainerRef={errorContainerRef}
              />
            ) : (
              <Box display="flex" flex={1}>
                <Box display="flex" alignItems="center" flex={1}>
                  <ColoredItemIcon itemType={state.addNewItem.type} />
                  <Skeleton
                    variant="text"
                    className={classes.newItemSkelton}
                    width="60%"
                  />
                </Box>
              </Box>
            )}
          </Box>
          <Box ref={errorContainerRef} className={classes.errorContainer} />
        </div>
      </div>
    );
  };

  const getTreeItemContent = (
    itemType,
    itemName,
    itemId,
    itemParentId,
    itemSiblingNames,
    showAsErrorInExplorer,
    isCurrentVersion
  ) => (
    <TreeItemContent
      itemType={itemType}
      itemName={itemName}
      itemId={itemId}
      itemParentId={itemParentId}
      itemSiblingNames={itemSiblingNames}
      showAsErrorInExplorer={showAsErrorInExplorer}
      isCurrentVersion={isCurrentVersion}
      onNewItem={newItemCallback}
      filesRef={filesRef}
    />
  );

  return (
    <>
      <Box className={classes.explorer} data-testid="explorer">
        <Box
          display="flex"
          alignItems="center"
          className={classes.header}
          boxShadow={3}>
          <Typography variant="body2" className={classes.fileCaption}>
            Files
          </Typography>
          <Box flex={1} />
          <Tooltip title="New File">
            <span>
              <IconButton
                aria-label="New File"
                className={classes.iconButton}
                disabled={!projectId}
                onClick={onNewFile}>
                <AddCircleOutlineIcon className={classes.icon} />
              </IconButton>
            </span>
          </Tooltip>
          <div className={classes.borderLeftLight}>{closeButton}</div>
        </Box>
        <Box py={1}>
          <TreeView
            defaultCollapseIcon={<ArrowDropDownIcon />}
            defaultExpandIcon={<ArrowRightIcon />}
            defaultEndIcon={<div style={{width: 24}} />}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
            expanded={state.expandedNodes}
            selected={state.selectedNode}>
            {Boolean(state.addNewItem) &&
              state.addNewItem.type === ExplorerItemType.FILE &&
              getNewItemEditor(getNamesByIdMapping(filesResult, etFiles))}
            {filesResult?.length ? (
              filesResult.map((fid) => (
                <TreeItem
                  nodeId={getNodeId(ExplorerItemType.FILE, fid)}
                  key={fid}
                  label={getTreeItemContent(
                    ExplorerItemType.FILE,
                    files.entities.files[fid].name,
                    fid,
                    null,
                    getNamesByIdMapping(files.result, files.entities.files),
                    files.entities.files[fid].showAsErrorInExplorer
                  )}
                  classes={{
                    root: classes.root,
                    content: classes.content,
                    expanded: classes.expanded,
                    selected: classes.selected,
                    group: classes.group,
                    label: classes.label,
                    iconContainer: classes.iconContainer,
                  }}
                  data-testid={`${ExplorerItemType.FILE}-treeItem`}>
                  {/* onNodeSelect passes nodeId as node parameter, I've
                appended type to id because id's are not unique across
                file/test/version and also I'd need it to know what type of
                items selected */}
                  {Boolean(state.addNewItem) &&
                    state.addNewItem.type === ExplorerItemType.TEST &&
                    state.addNewItem.parentId === fid &&
                    getNewItemEditor(
                      getNamesByIdMapping(
                        files.entities.files[fid].tests,
                        files.entities.tests
                      )
                    )}
                  {Array.isArray(files.entities.files[fid].tests) &&
                    files.entities.files[fid].tests.map((tid) => (
                      <TreeItem
                        nodeId={getNodeId(ExplorerItemType.TEST, tid)}
                        key={tid}
                        label={getTreeItemContent(
                          ExplorerItemType.TEST,
                          files.entities.tests[tid].name,
                          files.entities.tests[tid].id,
                          fid,
                          getNamesByIdMapping(
                            files.entities.files[fid].tests,
                            files.entities.tests
                          ),
                          files.entities.tests[tid].showAsErrorInExplorer
                        )}
                        classes={{
                          root: classes.root,
                          content: classes.content,
                          expanded: classes.expanded,
                          selected: classes.selected,
                          group: classes.group,
                          label: classes.label,
                          iconContainer: classes.iconContainer,
                        }}
                        data-testid={`${ExplorerItemType.TEST}-treeItem`}>
                        {Boolean(state.addNewItem) &&
                          state.addNewItem.type === ExplorerItemType.VERSION &&
                          state.addNewItem.parentId === tid &&
                          getNewItemEditor(
                            getNamesByIdMapping(
                              files.entities.tests[tid].versions,
                              files.entities.versions
                            )
                          )}
                        {Array.isArray(files.entities.tests[tid].versions) &&
                          files.entities.tests[tid].versions.map((vid) => (
                            <TreeItem
                              nodeId={getNodeId(ExplorerItemType.VERSION, vid)}
                              key={vid}
                              label={getTreeItemContent(
                                ExplorerItemType.VERSION,
                                files.entities.versions[vid].name,
                                files.entities.versions[vid].id,
                                tid,
                                getNamesByIdMapping(
                                  files.entities.tests[tid].versions,
                                  files.entities.versions
                                ),
                                files.entities.versions[vid]
                                  .showAsErrorInExplorer,
                                files.entities.versions[vid].isCurrent
                              )}
                              classes={{
                                root: classes.root,
                                content: classes.content,
                                expanded: classes.expanded,
                                selected: classes.selected,
                                group: classes.group,
                                label: classes.label,
                                iconContainer: classes.iconContainer,
                              }}
                              data-testid={`${ExplorerItemType.VERSION}-treeItem`}
                            />
                          ))}
                      </TreeItem>
                    ))}
                </TreeItem>
              ))
            ) : (
              <Typography variant="body2" className={classes.noFiles}>
                No files to show, add/load some file(s)
              </Typography>
            )}
          </TreeView>
        </Box>
      </Box>
      {snackbarTypeError}
    </>
  );
});

Explorer.propTypes = {
  closeButton: PropTypes.node.isRequired,
};

export default Explorer;

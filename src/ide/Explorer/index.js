import React, {useState, useCallback, useRef, useContext} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import {ExplorerItemType} from '../Constants';
import TreeItemEditor from './TreeItemEditor';
import TreeItemContent from './TreeItemContent';
import Tooltip from '../../TooltipCustom';
import {RootDispatchContext, RootStateContext} from '../Contexts';
import {
  ON_LOAD_CALLBACK,
  ON_NEW_ITEM_CALLBACK,
  ON_RUN_BUILD_MULTI_CALLBACK,
} from '../actionTypes';

const useStyles = makeStyles((theme) => ({
  explorer: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
  root: {
    userSelect: 'none',
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
  iconContainer: {
    marginRight: '0px',
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

const getNamesByIdMapping = (ids, sourceObjWithIdKey) => {
  if (!Array.isArray(ids)) {
    throw new Error('the given ids is not an array type');
  }
  return ids.map((id) => sourceObjWithIdKey[id].name);
};

function AddNewItem(type, parentId = null) {
  this.type = type;
  this.parentId = parentId;
}

// take props with current state and functions to send updates to state,
// handlers for starting the build. On re-render, always create using the
// state.
const Explorer = () => {
  const dispatch = useContext(RootDispatchContext);
  const {files} = useContext(RootStateContext);
  const [addNewItem, setAddNewItem] = useState(null);
  const classes = useStyles();
  const selectedNodes = useRef();

  const onNodeSelect = (e, node) => {
    selectedNodes.current = node;
  };

  const handleOnLoad = () => {
    dispatch([ON_LOAD_CALLBACK]);
  };

  const onNewFile = () => {
    const fileItemType = ExplorerItemType.FILE;
    setAddNewItem(new AddNewItem(fileItemType, null));
  };

  const newItemCallback = useCallback((itemType, itemParentId) => {
    setAddNewItem(new AddNewItem(itemType, itemParentId));
  }, []);

  const newItemCommitCallback = useCallback(
    (newItemName, newItemType) => {
      dispatch([
        ON_NEW_ITEM_CALLBACK,
        {
          itemName: newItemName,
          itemType: newItemType,
          itemParentId: addNewItem.parentId,
        },
      ]);
      setAddNewItem(null);
    },
    [addNewItem, dispatch]
    // add dispatch despite it's not needed, because if we ignore any further
    // wrong updates may go unnoticed,
    // https://github.com/reactjs/reactjs.org/issues/1889
  );

  const newItemCancelCallback = useCallback(() => {
    setAddNewItem(null);
  }, []);

  const runBuildMultipleCallback = useCallback(() => {
    dispatch([
      ON_RUN_BUILD_MULTI_CALLBACK,
      {selectedNodes: selectedNodes.current},
    ]);
  }, [selectedNodes, dispatch]);

  const getTotalSelectedCallback = useCallback(() => {
    if (!Array.isArray(selectedNodes.current)) {
      return 0;
    }
    return selectedNodes.current.length;
  }, [selectedNodes]);

  const getItemEditorFormatted = (existingNames, itemType) => {
    return (
      <div className="MuiTreeItem-content">
        <div className="MuiTreeItem-iconContainer" />
        <div className="MuiTreeItem-label">
          <TreeItemEditor
            defaultName=""
            existingNames={existingNames}
            itemType={itemType}
            onCommit={newItemCommitCallback}
            onCancel={newItemCancelCallback}
          />
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
    hasError,
    isCurrentVersion
  ) => (
    <TreeItemContent
      itemType={itemType}
      itemName={itemName}
      itemId={itemId}
      itemParentId={itemParentId}
      itemSiblingNames={itemSiblingNames}
      hasError={hasError}
      isCurrentVersion={isCurrentVersion}
      onNewItem={newItemCallback}
      onRunBuildMultiple={runBuildMultipleCallback}
      getTotalSelected={getTotalSelectedCallback}
    />
  );

  return (
    <Box className={classes.explorer}>
      <Box
        display="flex"
        alignItems="center"
        style={{borderBottom: '1px solid #363636'}}>
        <Typography variant="caption" className={classes.fileCaption}>
          Files
        </Typography>
        <Box flex={1} />
        <Tooltip title="New File">
          <IconButton
            aria-label="New File"
            className={classes.iconButton}
            onClick={onNewFile}>
            <FileIcon className={classes.icon} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load Existing File(s)">
          <IconButton
            aria-label="Load Existing File(s)"
            className={classes.iconButton}
            onClick={handleOnLoad}>
            <AddCircleOutlineIcon className={classes.icon} />
          </IconButton>
        </Tooltip>
      </Box>
      {files && Array.isArray(files.result) && files.result.length && (
        <Box py={1}>
          <TreeView
            defaultCollapseIcon={<ArrowDropDownIcon />}
            defaultExpandIcon={<ArrowRightIcon />}
            defaultEndIcon={<div style={{width: 24}} />}
            multiSelect
            onNodeSelect={onNodeSelect}
            defaultExpanded={
              Boolean(addNewItem) && addNewItem.parentId !== null
                ? [
                    `${getExplorerParentTypeByChild(addNewItem.type)}-${
                      addNewItem.parentId
                    }`,
                  ]
                : []
            }>
            {Boolean(addNewItem) &&
              addNewItem.type === ExplorerItemType.FILE &&
              getItemEditorFormatted(
                getNamesByIdMapping(files.result, files.entities.files),
                ExplorerItemType.FILE
              )}
            {files.result
              .filter((fid) => files.entities.files[fid].loadToTree)
              .map((fid) => (
                <TreeItem
                  nodeId={`${ExplorerItemType.FILE}-${fid}`}
                  key={fid}
                  label={getTreeItemContent(
                    ExplorerItemType.FILE,
                    files.entities.files[fid].name,
                    fid,
                    null,
                    getNamesByIdMapping(files.result, files.entities.files),
                    files.entities.files[fid].hasError
                  )}
                  classes={{
                    root: classes.root,
                    content: classes.content,
                    expanded: classes.expanded,
                    selected: classes.selected,
                    group: classes.group,
                    label: classes.label,
                    iconContainer: classes.iconContainer,
                  }}>
                  {/* onNodeSelect passes nodeId as node parameter, I've
                appended type to id because id's are not unique across
                file/test/version and also I'd need it to know what type of
                items selected */}
                  {Boolean(addNewItem) &&
                    addNewItem.type === ExplorerItemType.TEST &&
                    addNewItem.parentId === fid &&
                    getItemEditorFormatted(
                      getNamesByIdMapping(
                        files.entities.files[fid].tests,
                        files.entities.tests
                      ),
                      ExplorerItemType.TEST
                    )}
                  {Array.isArray(files.entities.files[fid].tests) &&
                    files.entities.files[fid].tests.map((tid) => (
                      <TreeItem
                        nodeId={`${ExplorerItemType.TEST}-${tid}`}
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
                          files.entities.tests[tid].hasError
                        )}
                        classes={{
                          root: classes.root,
                          content: classes.content,
                          expanded: classes.expanded,
                          selected: classes.selected,
                          group: classes.group,
                          label: classes.label,
                          iconContainer: classes.iconContainer,
                        }}>
                        {Boolean(addNewItem) &&
                          addNewItem.type === ExplorerItemType.VERSION &&
                          addNewItem.parentId === tid &&
                          getItemEditorFormatted(
                            getNamesByIdMapping(
                              files.entities.tests[tid].versions,
                              files.entities.versions
                            ),
                            ExplorerItemType.VERSION
                          )}
                        {Array.isArray(files.entities.tests[tid].versions) &&
                          files.entities.tests[tid].versions.map((vid) => (
                            <TreeItem
                              nodeId={`${ExplorerItemType.VERSION}-${vid}`}
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
                                files.entities.versions[vid].hasError,
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
                            />
                          ))}
                      </TreeItem>
                    ))}
                </TreeItem>
              ))}
          </TreeView>
        </Box>
      )}
    </Box>
  );
};

export default Explorer;

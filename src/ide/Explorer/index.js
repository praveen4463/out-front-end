import React, {useState, useRef, useCallback, useContext} from 'react';
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
import {ON_LOAD_CALLBACK, ON_NEW_ITEM_CALLBACK} from '../actionTypes';

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
  iconContainer: {
    marginRight: '0px',
  },
  highlight: {
    backgroundColor: theme.palette.action.selected,
  },
  errorContainer: {
    backgroundColor: theme.palette.background.paper,
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
  items have to compute their siblings but there is a gotcha.
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
  console.log('Explorer received files:');
  console.log(files);
  const [addNewItem, setAddNewItem] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState([]);
  const selectedNodesRef = useRef();
  const errorContainerRef = useRef(null);
  // ref object doesn't change thus safe to use in pure components. It's mutable
  // current property will give us latest set value without a re render of
  // component that uses it.
  const classes = useStyles();

  const handleSelect = (e, nodeIds) => {
    setSelected(nodeIds);
    // setting a new ref to be used in tree items so that whenever 'selected'
    // state changes it doesn't have to re render.
    selectedNodesRef.current = nodeIds;
  };

  const handleToggle = (e, nodeIds) => {
    // nodeIds have all expanded nodeIds, including ones opened on 'new item'
    // call, thus it's safe to reset entire array.
    setExpanded(nodeIds);
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
    if (!itemParentId) {
      return;
    }
    const parentNode = `${getExplorerParentTypeByChild(
      itemType
    )}-${itemParentId}`;
    setExpanded((current) =>
      !current.includes(parentNode) ? [...current, parentNode] : current
    );
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

  const getItemEditorFormatted = (existingNames, itemType) => {
    return (
      <div className={`MuiTreeItem-content ${classes.content}`}>
        <div className={`MuiTreeItem-iconContainer ${classes.iconContainer}`} />
        <div className={`MuiTreeItem-label ${classes.label}`}>
          <Box px={0.5} minHeight={28} className={classes.highlight}>
            <TreeItemEditor
              defaultName=""
              existingNames={existingNames}
              itemType={itemType}
              onCommit={newItemCommitCallback}
              onCancel={newItemCancelCallback}
              errorContainerRef={errorContainerRef}
            />
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
      selectedNodes={selectedNodesRef}
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
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
            expanded={expanded}
            selected={selected}>
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

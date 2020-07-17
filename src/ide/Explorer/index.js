import React, {useState, useCallback, useRef} from 'react';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/styles';
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
import Tooltip from '../../TooltipCustom';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
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

// take props with current state and functions to send updates to state,
// handlers for starting the build. On re-render, always create using the
// state.
// const Explorer = ({files, onUnload, onNewItem}) => {
const Explorer = ({files, onNewItem}) => {
  const [addNewItem, setAddNewItem] = useState(null);
  const classes = useStyles();

  // eslint-disable-next-line no-unused-vars
  const onNewFile = () => {
    const fileItemType = ExplorerItemType.FILE;
    setAddNewItem({type: fileItemType, parentId: undefined});
  };

  // eslint-disable-next-line no-unused-vars
  const newItemCallback = useCallback((itemType, parentItemId) => {
    setAddNewItem({type: itemType, parent: parentItemId});
  }, []);

  const newItemCommitCallback = useCallback(
    (newItemName, newItemType) => {
      onNewItem(newItemName, newItemType, addNewItem.parentId);
    },
    [onNewItem, addNewItem.parentId]
  );

  const newItemCancelCallback = useCallback(() => {
    setAddNewItem(null);
  }, []);

  const selectedNodes = useRef();

  const onNodeSelect = (e, node) => {
    selectedNodes.current = node;
  };

  // eslint-disable-next-line no-unused-vars
  const getTotalSelected = useCallback(() => {
    if (!Array.isArray(selectedNodes.current)) {
      return 0;
    }
    return selectedNodes.current.length;
  }, []);

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

  const getItemNamesFromFiles = (itemType) => {
    if (!Array.isArray(files)) {
      return [];
    }
    let sourceArray;
    if (itemType === ExplorerItemType.FILE) {
      sourceArray = files;
    } else if (itemType === ExplorerItemType.TEST) {
      sourceArray = Array.isArray(files.tests) ? files.tests : [];
    } else if (itemType === ExplorerItemType.VERSION) {
      sourceArray = Array.isArray(files.tests.versions)
        ? files.tests.versions
        : [];
    }
    return sourceArray.reduce((a, c) => {
      a.push(c.name);
      return a;
    }, []);
  };

  return (
    <Box className={classes.root}>
      <Box
        display="flex"
        alignItems="center"
        style={{borderBottom: '1px solid #363636'}}>
        <Typography variant="caption" className={classes.fileCaption}>
          Files
        </Typography>
        <Box flex={1} />
        <Tooltip title="New File">
          <IconButton aria-label="New File" className={classes.iconButton}>
            <FileIcon className={classes.icon} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load Existing File(s)">
          <IconButton
            aria-label="Load Existing File(s)"
            className={classes.iconButton}>
            <AddCircleOutlineIcon className={classes.icon} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box py={1}>
        <TreeView
          defaultCollapseIcon={<ArrowDropDownIcon />}
          defaultExpandIcon={<ArrowRightIcon />}
          multiSelect
          onNodeSelect={onNodeSelect}
          expanded={
            Boolean(addNewItem) && addNewItem.parentId !== undefined
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
              getItemNamesFromFiles(ExplorerItemType.FILE),
              ExplorerItemType.FILE
            )}
          {Array.isArray(files) &&
            files
              .filter((f) => f.loadToTree)
              .map((f) => (
                <TreeItem
                  nodeId={`${ExplorerItemType.FILE}-${f.id}`}
                  key={f.id}
                  label={<Typography variant="caption">{f.name}</Typography>}>
                  {/* onNodeSelect passes nodeId as node parameter, we've
                appended type to id because id's are not unique across
                file/test/version and also we need it to know what type of items
                selected */}
                  {Boolean(addNewItem) &&
                    addNewItem.type === ExplorerItemType.TEST &&
                    addNewItem.parentId === f.id &&
                    getItemEditorFormatted(
                      getItemNamesFromFiles(ExplorerItemType.TEST),
                      ExplorerItemType.TEST
                    )}
                  {Array.isArray(f.tests) &&
                    f.tests.map((t) => (
                      <TreeItem
                        nodeId={`${ExplorerItemType.TEST}-${t.id}`}
                        key={t.id}
                        label={
                          <Typography variant="caption">{t.name}</Typography>
                        }>
                        {Boolean(addNewItem) &&
                          addNewItem.type === ExplorerItemType.VERSION &&
                          addNewItem.parentId === t.id &&
                          getItemEditorFormatted(
                            getItemNamesFromFiles(ExplorerItemType.VERSION),
                            ExplorerItemType.VERSION
                          )}
                        {Array.isArray(t.versions) &&
                          t.versions.map((v) => (
                            <TreeItem
                              nodeId={`${ExplorerItemType.VERSION}-${v.id}`}
                              key={v.id}
                              label={
                                <Typography variant="caption">
                                  {v.name}
                                </Typography>
                              }
                            />
                          ))}
                      </TreeItem>
                    ))}
                </TreeItem>
              ))}
        </TreeView>
      </Box>
    </Box>
  );
};

Explorer.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewItem: PropTypes.func.isRequired,
};

export default Explorer;

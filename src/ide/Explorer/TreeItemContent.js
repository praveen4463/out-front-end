import React, {useState, useCallback} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/styles';
import PropTypes from 'prop-types';
import TestIcon from '@material-ui/icons/Title';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import {ContextMenu, MenuItem, ContextMenuTrigger} from 'react-contextmenu';
import clsx from 'clsx';
import Tooltip from '../../TooltipCustom';
import {ExplorerItemType} from '../Constants';
import TreeItemEditor from './TreeItemEditor';
import ZwlFileIcon from '../zwlFileIcon';
import VersionIcon from '../newVersionIcon';

const useStyle = makeStyles((theme) => ({
  contextMenu: {
    backgroundColor: theme.palette.background.paper,
    backgroundClip: 'padding-box',
    border: '1px solid',
    minHeight: '0px',
    opacity: 0,
    borderRadius: theme.shape.borderRadius,
    margin: '2px 0 0',
    outline: 'none',
    padding: '5px 0',
    textAlign: 'left',
    transition: `opacity 251ms ${theme.transitions.easing.easeInOut} 0ms, transform 167ms ${theme.transitions.easing.easeInOut} 0ms`,
  },
  contextMenuItem: {
    background: '0 0',
    border: 0,
    color: theme.palette.background.contrastText,
    fontWeight: 400,
    fontSize: '0.8125rem',
    lineHeight: 1,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    textAlign: 'inherit',
    whiteSpace: 'nowrap',
    '&:hover > $content': {
      backgroundColor: theme.palette.action.hover,
    },
    '&$selected > $content': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  icon: {
    fontSize: '1rem',
  },
  zwlFileColoredIcon: {
    backgroundColor: '#e2cdfd',
  },
  testColoredIcon: {
    backgroundColor: '#f1e05a',
  },
  versionColoredIcon: {
    backgroundColor: '#89e051',
  },
}));

const ConfirmDialogTypes = {
  DELETE: 'DELETE',
  UNLOAD: 'UNLOAD',
};

const ContextMenuRenderType = {
  SINGLE_ITEM_SELECTION: 'SINGLE_ITEM_SELECTION',
  MULTIPLE_ITEM_SELECTION: 'MULTIPLE_ITEM_SELECTION',
};

const TreeItemContent = ({
  itemType,
  itemName,
  itemId,
  itemSiblingNames,
  onUnload,
  onNewItem,
  onRename,
  onDelete,
  onRunBuild,
  onRunBuildMultiple,
  getTotalSelected,
}) => {
  const [editing, setEditing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [contextMenuRenderType, setContextMenuRenderType] = useState(null);
  const [currentConfirmDialog, setCurrentConfirmDialog] = useState(null);
  const classes = useStyle();

  const newItemHandler = () => {
    onNewItem(itemType);
  };

  const renameCommitCallback = useCallback(
    (newName, type) => {
      onRename(newName, type, itemId);
    },
    [onRename, itemId]
  );

  const editCancelCallback = useCallback(() => {
    setEditing(false);
  }, []);

  const runBuildHandler = () => {
    onRunBuild(itemType, itemId);
  };

  const onEdit = () => {
    setEditing(true);
  };

  const onHoveringCancel = () => {
    setHovering(false);
  };

  const onHovering = () => {
    setHovering(true);
  };

  const deleteHandler = () => {
    setCurrentConfirmDialog(ConfirmDialogTypes.DELETE);
  };

  const deleteAcceptHandler = () => {
    setCurrentConfirmDialog(null);
    onDelete(itemType, itemId);
  };

  const unloadHandler = () => {
    setCurrentConfirmDialog(ConfirmDialogTypes.UNLOAD);
  };

  const unloadAcceptHandler = () => {
    setCurrentConfirmDialog(null);
    onUnload(itemType, itemId);
  };

  const confirmDialogCancelHandler = () => {
    setCurrentConfirmDialog(null);
  };

  const onContextMenu = () => {
    const currentlySelectedItems = getTotalSelected();
    setContextMenuRenderType(
      currentlySelectedItems > 1
        ? ContextMenuRenderType.MULTIPLE_ITEM_SELECTION
        : ContextMenuRenderType.SINGLE_ITEM_SELECTION
    );
  };

  const onContextMenuHide = () => {
    setContextMenuRenderType(null);
  };

  const getBuildRunTextPerExplorerItem = () => {
    let text;
    switch (itemType) {
      case ExplorerItemType.FILE:
        text = 'Run Build For All Tests (Latest Version Only)';
        break;
      case ExplorerItemType.TEST:
        text = 'Run Build For This Test (Latest Version Only)';
        break;
      case ExplorerItemType.VERSION:
        text = 'Run Build For This Version Only';
        break;
      default:
        throw new Error(`Can't find build run text for ${itemType}`);
    }
    return text;
  };

  const getColoredItemIcon = (type) => {
    let icon;
    switch (type) {
      case ExplorerItemType.FILE:
        icon = (
          <ZwlFileIcon
            className={clsx(classes.icon, classes.zwlFileColoredIcon)}
          />
        );
        break;
      case ExplorerItemType.TEST:
        icon = (
          <TestIcon className={clsx(classes.icon, classes.testColoredIcon)} />
        );
        break;
      case ExplorerItemType.VERSION:
        icon = (
          <VersionIcon
            className={clsx(classes.icon, classes.versionColoredIcon)}
          />
        );
        break;
      default:
        throw new Error(`Can't find icon for ${type}`);
    }
    return icon;
  };

  if (editing) {
    return (
      <Box display="flex" alignItems="center" flex={1}>
        {getColoredItemIcon(itemType)}
        <TreeItemEditor
          defaultName={itemName}
          existingNames={itemSiblingNames}
          itemType={itemType}
          onCommit={renameCommitCallback}
          onCancel={editCancelCallback}
        />
      </Box>
    );
  }

  return (
    <>
      <ContextMenuTrigger
        id={`tree-item-cm-${itemId}`}
        className={classes.contextMenu}>
        <Box
          display="flex"
          alignItems="center"
          px={1}
          onContextMenu={onContextMenu}
          onMouseEnter={onHovering}
          onMouseLeave={onHoveringCancel}>
          <Box flex={1}>
            {getColoredItemIcon(itemType)}
            <Typography variant="caption">{itemName}</Typography>
          </Box>
          {hovering && (
            <Box>
              {itemType === ExplorerItemType.FILE && (
                <>
                  <Tooltip title="Unload File From Workspace">
                    <RemoveCircleOutlineIcon
                      className={classes.icon}
                      onClick={unloadHandler}
                    />
                  </Tooltip>
                  <Tooltip title="Create New Test">
                    <TestIcon
                      className={classes.icon}
                      onClick={newItemHandler}
                    />
                  </Tooltip>
                </>
              )}
              {itemType === ExplorerItemType.TEST && (
                <Tooltip title="Create New Version">
                  <VersionIcon
                    className={classes.icon}
                    onClick={newItemHandler}
                  />
                </Tooltip>
              )}
              <Tooltip title="Rename">
                <EditIcon className={classes.icon} onClick={onEdit} />
              </Tooltip>
              <Tooltip title="Delete">
                <DeleteIcon className={classes.icon} onClick={deleteHandler} />
              </Tooltip>
            </Box>
          )}
        </Box>
      </ContextMenuTrigger>
      {/* Render menu only when the event is triggerred. */}
      {Boolean(contextMenuRenderType) &&
        (contextMenuRenderType ===
        ContextMenuRenderType.SINGLE_ITEM_SELECTION ? (
          <ContextMenu
            id={`tree-item-cm-${itemId}`}
            className={classes.contextMenuItem}
            onHide={onContextMenuHide}>
            <MenuItem onClick={runBuildHandler}>
              {getBuildRunTextPerExplorerItem()}
            </MenuItem>
            {itemType === ExplorerItemType.FILE && (
              <>
                <MenuItem onClick={unloadHandler}>
                  Unload File From Workspace
                </MenuItem>
                <MenuItem onClick={newItemHandler}>Add New Test</MenuItem>
              </>
            )}
            {itemType === ExplorerItemType.TEST && (
              <MenuItem onClick={newItemHandler}>Add New Version</MenuItem>
            )}
            <MenuItem onClick={onEdit}>Rename</MenuItem>
            <MenuItem onClick={deleteHandler}>Delete</MenuItem>
          </ContextMenu>
        ) : (
          <ContextMenu
            id={`tree-item-cm-${itemId}`}
            className={classes.contextMenuItem}
            onHide={onContextMenuHide}>
            <MenuItem onClick={onRunBuildMultiple}>
              Run Build For Selected Items
            </MenuItem>
          </ContextMenu>
        ))}
      <Dialog
        open={Boolean(currentConfirmDialog)}
        onClose={confirmDialogCancelHandler}
        aria-describedby="alert-dialog-description">
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {currentConfirmDialog === ConfirmDialogTypes.DELETE
              ? `Are you sure you want to delete ${itemType.toLowerCase()} ${itemName}?`
              : `Are you sure you want to unload ${itemType.toLowerCase()} ${itemName} from workspace?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDialogCancelHandler} color="primary">
            Cancel
          </Button>
          <Button
            onClick={
              currentConfirmDialog === ConfirmDialogTypes.DELETE
                ? deleteAcceptHandler
                : unloadAcceptHandler
            }
            color="primary"
            autoFocus>
            {currentConfirmDialog === ConfirmDialogTypes.DELETE
              ? 'Delete'
              : 'Unload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

TreeItemContent.propTypes = {
  itemType: PropTypes.string.isRequired,
  itemName: PropTypes.string.isRequired,
  itemId: PropTypes.number.isRequired,
  itemSiblingNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  onUnload: PropTypes.func.isRequired,
  onNewItem: PropTypes.func.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRunBuild: PropTypes.func.isRequired,
  onRunBuildMultiple: PropTypes.func.isRequired,
  getTotalSelected: PropTypes.func.isRequired,
};

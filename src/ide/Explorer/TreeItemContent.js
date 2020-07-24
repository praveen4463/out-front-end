import React, {useState, useCallback, useContext} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/styles';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
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
import TestIcon from '@material-ui/icons/Title';
import Chip from '@material-ui/core/Chip';
import clsx from 'clsx';
import VersionIcon from '../newVersionIcon';
import Tooltip from '../../TooltipCustom';
import {ExplorerItemType} from '../Constants';
import TreeItemEditor from './TreeItemEditor';
import ColoredItemIcon from './ColoredItemIcon';
import {RootDispatchContext} from '../Contexts';
import {
  ON_UNLOAD_CALLBACK,
  ON_RENAME_CALLBACK,
  ON_DELETE_CALLBACK,
  ON_RUN_BUILD_CALLBACK,
} from '../actionTypes';

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
  iconButton: {
    padding: theme.spacing(1),
  },
  errorText: {
    color: theme.palette.error.dark,
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

const TreeItemContent = React.memo(
  ({
    itemType,
    itemName,
    itemId,
    itemParentId,
    itemGrandParentId,
    itemSiblingNames,
    hasError,
    isCurrentVersion,
    onNewItem,
    onRunBuildMultiple,
    getTotalSelected,
  }) => {
    const dispatch = useContext(RootDispatchContext);
    const [editing, setEditing] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [contextMenuRenderType, setContextMenuRenderType] = useState(null);
    const [currentConfirmDialog, setCurrentConfirmDialog] = useState(null);
    const classes = useStyle();

    const newItemHandler = () => {
      let newItemType;
      if (itemType === ExplorerItemType.FILE) {
        newItemType = ExplorerItemType.TEST;
      } else if (itemType === ExplorerItemType.TEST) {
        newItemType = ExplorerItemType.VERSION;
      } else {
        throw new Error("Can't add items under a version");
      }
      // the current item actually becomes parentId when adding new item.
      onNewItem(newItemType, itemId);
    };

    const renameCommitCallback = useCallback(
      (newName, type) => {
        dispatch([
          ON_RENAME_CALLBACK,
          {
            itemNewName: newName,
            itemType: type,
            itemCurrentName: itemName,
            itemId,
            itemParentId,
          },
        ]);
        /*
        parent will first update the name and then change the data set based on
        new name. It will then sort the list by new name which will re render
        it. Re render will iterate thru data set but should keep all tree item
        components unchanged except current one that triggered rename. This
        happens thanks for the 'key' prop, react will keep components from
        memory that have matching keys, removing those that are not in new set
        and create those were not existing.
        Now, since we were in editing mode, new name will not appear until the
        next statement cancel editing which will show new name.
        TODO: verify that this behaviour is true.
        */
        setEditing(false);
      },
      [dispatch, itemName, itemId, itemParentId]
    );

    const editCancelCallback = useCallback(() => {
      setEditing(false);
    }, []);

    const runBuildHandler = () => {
      dispatch([
        ON_RUN_BUILD_CALLBACK,
        {itemType, itemId, itemParentId, itemGrandParentId},
      ]);
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
      dispatch([ON_DELETE_CALLBACK, {itemType, itemId, itemParentId}]);
    };

    const unloadHandler = () => {
      setCurrentConfirmDialog(ConfirmDialogTypes.UNLOAD);
    };

    const unloadAcceptHandler = () => {
      setCurrentConfirmDialog(null);
      dispatch([ON_UNLOAD_CALLBACK, {itemType, itemId}]);
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

    if (editing) {
      return (
        <TreeItemEditor
          defaultName={itemName}
          existingNames={itemSiblingNames}
          itemType={itemType}
          onCommit={renameCommitCallback}
          onCancel={editCancelCallback}
        />
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
              <ColoredItemIcon itemType={itemType} />
              <Typography
                variant="caption"
                className={clsx(hasError && classes.errorText)}>
                {itemName}
              </Typography>
              {itemType === ExplorerItemType.VERSION && isCurrentVersion && (
                <Chip size="small" label="Latest" />
              )}
            </Box>
            {hovering && (
              <Box>
                {itemType === ExplorerItemType.FILE && (
                  <>
                    <Tooltip title="Unload File From Workspace">
                      <IconButton
                        aria-label="Unload File From Workspace"
                        onClick={unloadHandler}
                        className={classes.iconButton}>
                        <RemoveCircleOutlineIcon className={classes.icon} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create New Test">
                      <IconButton
                        aria-label="Create New Test"
                        onClick={newItemHandler}
                        className={classes.iconButton}>
                        <TestIcon className={classes.icon} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                {itemType === ExplorerItemType.TEST && (
                  <Tooltip title="Create New Version">
                    <IconButton
                      aria-label="Create New Version"
                      onClick={newItemHandler}
                      className={classes.iconButton}>
                      <VersionIcon className={classes.icon} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Rename">
                  <IconButton
                    aria-label="Rename"
                    onClick={onEdit}
                    className={classes.iconButton}>
                    <EditIcon className={classes.icon} />
                  </IconButton>
                </Tooltip>
                {!isCurrentVersion && (
                  <Tooltip title="Delete">
                    <IconButton
                      aria-label="Delete"
                      onClick={deleteHandler}
                      className={classes.iconButton}>
                      <DeleteIcon className={classes.icon} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </ContextMenuTrigger>
        {/* Render menu only when the event is triggered. */}
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
              {!isCurrentVersion && (
                <MenuItem onClick={deleteHandler}>Delete</MenuItem>
              )}
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
  }
);

TreeItemContent.propTypes = {
  itemType: PropTypes.string.isRequired,
  itemName: PropTypes.string.isRequired,
  itemId: PropTypes.number.isRequired,
  itemParentId: PropTypes.number.isRequired,
  itemGrandParentId: PropTypes.number.isRequired,
  itemSiblingNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  hasError: PropTypes.bool.isRequired,
  isCurrentVersion: PropTypes.bool,
  onNewItem: PropTypes.func.isRequired,
  onRunBuildMultiple: PropTypes.func.isRequired,
  getTotalSelected: PropTypes.func.isRequired,
};

TreeItemContent.defaultProps = {
  isCurrentVersion: undefined,
};

import React, {useState, useContext, useRef} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
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
  ON_RUN_BUILD_MULTI_CALLBACK,
} from '../actionTypes';
import './contextMenu.css';

const useStyle = makeStyles((theme) => ({
  contextMenu: {
    backgroundColor: theme.palette.background.paper,
    backgroundClip: 'padding-box',
    minHeight: '0px',
    opacity: 0,
    borderRadius: theme.shape.borderRadius,
    margin: '2px 0 0',
    outline: 'none',
    padding: '8px 0',
    textAlign: 'left',
    pointerEvents: 'none',
    boxShadow: theme.shadows[3],
    transition: `opacity 251ms ${theme.transitions.easing.easeInOut} 0ms, transform 167ms ${theme.transitions.easing.easeInOut} 0ms`,
  },
  // TODO: Note that contextMenu.css contains a 'on select' css that I couldn't
  // find a way to add so that color form 'theme' could be sent. Currently it
  // has hardcoded color, fix it once you know how to. May be use
  // styled-components.
  contextMenuItem: {
    background: '0 0',
    border: 0,
    color: theme.palette.background.contrastText,
    cursor: 'pointer',
    fontWeight: 400,
    fontSize: '0.8125rem',
    lineHeight: 1,
    padding: `${theme.spacing(1)}px ${theme.spacing(4)}px ${theme.spacing(
      1
    )}px ${theme.spacing(4)}px`,
    textAlign: 'inherit',
    whiteSpace: 'nowrap',
    outline: 'none',
  },
  iconButton: {
    padding: theme.spacing(0.8),
  },
  errorText: {
    color: theme.palette.error.dark,
  },
  dialogText: {
    fontSize: '0.9125rem',
  },
  dialogPaper: {
    marginBottom: '20%',
  },
  fontSizeSmall: {
    fontSize: '0.875rem',
  },
  chip: {
    marginLeft: theme.spacing(0.5),
    fontSize: '0.7rem',
    height: theme.spacing(1.8),
  },
  highlight: {
    backgroundColor: theme.palette.action.selected,
  },
  errorContainer: {
    backgroundColor: theme.palette.background.paper,
  },
  itemText: {
    userSelect: 'none',
  },
}));

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
    itemSiblingNames,
    hasError,
    isCurrentVersion,
    onNewItem,
    selectedNodes,
  }) => {
    const dispatch = useContext(RootDispatchContext);
    const [editing, setEditing] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [contextMenuRenderType, setContextMenuRenderType] = useState(
      ContextMenuRenderType.SINGLE_ITEM_SELECTION
    );
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUnloadDialog, setShowUnloadDialog] = useState(false);
    const classes = useStyle();
    const errorContainerRef = useRef(null);

    const newItemHandler = (e) => {
      e.stopPropagation();
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

    const renameCommitCallback = (newName, type) => {
      dispatch([
        ON_RENAME_CALLBACK,
        {
          itemNewName: newName,
          itemType: type,
          itemCurrentName: itemName,
          itemId,
          itemParentId,
          dispatch,
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
    };

    const editCancelCallback = () => {
      setEditing(false);
    };

    const runBuildHandler = (e) => {
      e.stopPropagation();
      dispatch([ON_RUN_BUILD_CALLBACK, {itemType, itemId}]);
    };

    const runBuildMultipleHandler = (e) => {
      e.stopPropagation();
      dispatch([
        ON_RUN_BUILD_MULTI_CALLBACK,
        {selectedNodes: selectedNodes.current},
      ]);
    };

    const onEdit = (e) => {
      e.stopPropagation();
      setEditing(true);
    };

    const onHoveringCancel = () => {
      setHovering(false);
    };

    const onHovering = () => {
      setHovering(true);
    };

    const deleteHandler = (e) => {
      e.stopPropagation();
      setShowDeleteDialog(true);
    };

    const deleteAcceptHandler = () => {
      setShowDeleteDialog(false);
      dispatch([
        ON_DELETE_CALLBACK,
        {itemType, itemId, itemParentId, dispatch},
      ]);
    };

    const unloadHandler = (e) => {
      e.stopPropagation();
      setShowUnloadDialog(true);
    };

    const unloadAcceptHandler = () => {
      setShowUnloadDialog(false);
      dispatch([ON_UNLOAD_CALLBACK, {itemType, itemId}]);
    };

    const deleteDialogCancelHandler = (e) => {
      e.stopPropagation();
      setShowDeleteDialog(false);
    };

    const unloadDialogCancelHandler = (e) => {
      e.stopPropagation();
      setShowUnloadDialog(false);
    };

    const onContextMenu = () => {
      const currentlySelectedItems =
        selectedNodes.current === undefined ? 0 : selectedNodes.current.length;
      setContextMenuRenderType(
        currentlySelectedItems > 1
          ? ContextMenuRenderType.MULTIPLE_ITEM_SELECTION
          : ContextMenuRenderType.SINGLE_ITEM_SELECTION
      );
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
        <>
          <Box
            display="flex"
            alignItems="center"
            px={0.5}
            minHeight={28}
            className={classes.highlight}>
            <TreeItemEditor
              defaultName={itemName}
              existingNames={itemSiblingNames}
              itemType={itemType}
              onCommit={renameCommitCallback}
              onCancel={editCancelCallback}
              errorContainerRef={errorContainerRef}
              onHovering={onHovering}
              onHoveringCancel={onHoveringCancel}
            />
          </Box>
          <Box ref={errorContainerRef} className={classes.errorContainer} />
        </>
      );
    }

    return (
      <>
        <ContextMenuTrigger id={`explorer-cm-${itemType}-${itemId}`}>
          <Box
            display="flex"
            alignItems="center"
            px={0.5}
            minHeight={28}
            onContextMenu={onContextMenu}
            onMouseEnter={onHovering}
            onMouseLeave={onHoveringCancel}>
            <Box display="flex" alignItems="center" flex={1}>
              <ColoredItemIcon itemType={itemType} />
              <Typography
                variant="caption"
                className={clsx(
                  hasError && classes.errorText,
                  classes.itemText
                )}>
                {itemName}
              </Typography>
              {itemType === ExplorerItemType.VERSION && isCurrentVersion && (
                <Chip size="small" label="Latest" className={classes.chip} />
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
                        size="small"
                        className={classes.iconButton}>
                        <RemoveCircleOutlineIcon
                          fontSize="small"
                          classes={{fontSizeSmall: classes.fontSizeSmall}}
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Create New Test">
                      <IconButton
                        aria-label="Create New Test"
                        onClick={newItemHandler}
                        className={classes.iconButton}>
                        <TestIcon
                          fontSize="small"
                          classes={{fontSizeSmall: classes.fontSizeSmall}}
                        />
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
                      <VersionIcon
                        fontSize="small"
                        classes={{fontSizeSmall: classes.fontSizeSmall}}
                      />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Rename">
                  <IconButton
                    aria-label="Rename"
                    onClick={onEdit}
                    className={classes.iconButton}>
                    <EditIcon
                      fontSize="small"
                      classes={{fontSizeSmall: classes.fontSizeSmall}}
                    />
                  </IconButton>
                </Tooltip>
                {!isCurrentVersion && (
                  <Tooltip title="Delete">
                    <IconButton
                      aria-label="Delete"
                      onClick={deleteHandler}
                      className={classes.iconButton}>
                      <DeleteIcon
                        fontSize="small"
                        classes={{fontSizeSmall: classes.fontSizeSmall}}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </ContextMenuTrigger>
        {/* TODO: currently contextmenu stays on page for every tree item.
        I tried rendering it only on contextmenu event but there were problems
        because this contextmenu component requires it on the page. Change this
        asap and may be use some other component. */}
        <ContextMenu
          id={`explorer-cm-${itemType}-${itemId}`}
          className={classes.contextMenu}>
          {contextMenuRenderType ===
          ContextMenuRenderType.MULTIPLE_ITEM_SELECTION ? (
            <MenuItem
              onClick={runBuildMultipleHandler}
              className={classes.contextMenuItem}>
              Run Build For Selected Items
            </MenuItem>
          ) : (
            <>
              <MenuItem
                onClick={runBuildHandler}
                className={classes.contextMenuItem}>
                {getBuildRunTextPerExplorerItem()}
              </MenuItem>
              {itemType === ExplorerItemType.FILE && (
                <>
                  <MenuItem
                    onClick={unloadHandler}
                    className={classes.contextMenuItem}>
                    Unload File From Workspace
                  </MenuItem>
                  <MenuItem
                    onClick={newItemHandler}
                    className={classes.contextMenuItem}>
                    Add New Test
                  </MenuItem>
                </>
              )}
              {itemType === ExplorerItemType.TEST && (
                <MenuItem
                  onClick={newItemHandler}
                  className={classes.contextMenuItem}>
                  Add New Version
                </MenuItem>
              )}
              <MenuItem onClick={onEdit} className={classes.contextMenuItem}>
                Rename
              </MenuItem>
              {!isCurrentVersion && (
                <MenuItem
                  onClick={deleteHandler}
                  className={classes.contextMenuItem}>
                  Delete
                </MenuItem>
              )}
            </>
          )}
        </ContextMenu>
        <Dialog
          open={showDeleteDialog}
          onClose={deleteDialogCancelHandler}
          classes={{paper: classes.dialogPaper}}
          aria-describedby="delete-alert-dialog-description">
          <DialogContent>
            <DialogContentText
              id="delete-alert-dialog-description"
              className={classes.dialogText}>
              Are you sure you want to delete {itemType.toLowerCase()}{' '}
              {itemName}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={deleteDialogCancelHandler} size="small">
              Cancel
            </Button>
            <Button
              onClick={deleteAcceptHandler}
              variant="contained"
              size="small">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={showUnloadDialog}
          onClose={unloadDialogCancelHandler}
          classes={{paper: classes.dialogPaper}}
          aria-describedby="unload-alert-dialog-description">
          <DialogContent>
            <DialogContentText
              id="unload-alert-dialog-description"
              className={classes.dialogText}>
              Are you sure you want to unload {itemType.toLowerCase()}{' '}
              {itemName} from workspace?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={unloadDialogCancelHandler} size="small">
              Cancel
            </Button>
            <Button
              onClick={unloadAcceptHandler}
              variant="contained"
              size="small">
              Unload
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  },
  (prevProps, nextProps) => {
    return Object.keys(prevProps).every((k) => {
      if (prevProps[k] !== nextProps[k]) {
        if (
          // if one of prev or next itemSiblingNames is undefined, they are
          // unequal.
          k === 'itemSiblingNames' &&
          Array.isArray(prevProps.itemSiblingNames) &&
          Array.isArray(nextProps.itemSiblingNames) &&
          prevProps.itemSiblingNames.length ===
            nextProps.itemSiblingNames.length
        ) {
          return (
            nextProps.itemSiblingNames.filter(
              (name) => !prevProps.itemSiblingNames.includes(name)
            ).length === 0
          );
        }
        return false;
      }
      return true;
    });
  }
  /*
  I've included a custom prop check function rather than shallow check of all
  props.
  - selectedNodes is a ref and doesn't change so need to ignore in check.
  - siblingNames are created new for each of this component, most of the time
    it remains same thus a shallow check forces a re render that can be avoided
    by deep checking.
  - if any prop name changes that is included here as string, update here too.
  */
);

TreeItemContent.propTypes = {
  itemType: PropTypes.string.isRequired,
  itemName: PropTypes.string.isRequired,
  itemId: PropTypes.number.isRequired,
  itemParentId: PropTypes.number,
  itemSiblingNames: PropTypes.arrayOf(PropTypes.string),
  hasError: PropTypes.bool,
  isCurrentVersion: PropTypes.bool,
  onNewItem: PropTypes.func.isRequired,
  selectedNodes: PropTypes.exact({
    current: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

TreeItemContent.defaultProps = {
  itemParentId: undefined,
  itemSiblingNames: null,
  hasError: undefined,
  isCurrentVersion: undefined,
};

export default TreeItemContent;

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
import {ExplorerItemType, ExplorerEditOperationType} from '../Constants';
import TreeItemEditor from './TreeItemEditor';
import ColoredItemIcon from '../ColoredItemIcon';
import {IdeDispatchContext} from '../Contexts';
import batchActions from '../actionCreators';
import {
  EXP_UNLOAD_FILE,
  EXP_RENAME_ITEM,
  EXP_DELETE_ITEM,
  EXP_DELETE_REVERT,
  EDR_EXP_VERSIONS_DELETED,
  EDR_EXP_VERSION_DBL_CLICK,
  RUN_BUILD,
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
    cursor: 'pointer',
  },
  highlight: {
    backgroundColor: theme.palette.action.selected,
  },
  errorContainer: {
    backgroundColor: theme.palette.background.paper,
  },
  textContentRoot: {
    userSelect: 'none',
    cursor: 'pointer',
  },
}));

// !!! Make sure there is no prop/context here that causes unnecessary re render
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
    filesRef,
  }) => {
    const dispatch = useContext(IdeDispatchContext);
    const [editing, setEditing] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUnloadDialog, setShowUnloadDialog] = useState(false);
    const classes = useStyle();
    const errorContainerRef = useRef(null);
    const files = filesRef.current;

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
      // first dispatch and rename locally
      dispatch({
        type: EXP_RENAME_ITEM,
        payload: {itemNewName: newName, itemType: type, itemId, itemParentId},
      });
      // Since state change is asynchronous, dispatch will complete but the
      // state change and render will start after the current function's
      // completion (as this one already in stack), so the api request goes
      // before any re render.

      // eslint-disable-next-line no-unused-vars
      const onError = (error) => {
        // Show some precise error and revert to the original name
        dispatch({
          type: EXP_RENAME_ITEM,
          payload: {
            itemNewName: itemName, // if error, send original name
            itemType: type,
            itemId,
            itemParentId,
          },
        });
      };
      /*
      Send api request, send itemType, itemId, newName.
      if request fails, invoke onError, if passes do nothing.
      For now simulate the error situation using a setTimeout, hide once test
      done. setTimeout(onError, 500);
      */

      setEditing(false);
      /*
        Note on the re render react functionality.
        parent will first update the name and then change the data set based on
        new name. It will then sort the list by new name which will re render
        it. Re render will iterate thru data set but should keep all tree item
        components unchanged except current one that triggered rename. This
        happens thanks for the 'key' prop, react will keep components from
        memory that have matching keys, removing those that are not in new set
        and create those were not existing.
        Now, since we were in editing mode, new name will not appear until the
        next statement cancel editing which will show new name.
        */
    };

    const editCancelCallback = () => {
      setEditing(false);
    };

    const runBuildHandler = (e) => {
      e.stopPropagation();
      dispatch({type: RUN_BUILD, payload: {itemType, itemId}});
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

    const handleDoubleClick = (e) => {
      e.stopPropagation();
      if (itemType !== ExplorerItemType.VERSION) {
        return;
      }
      dispatch({
        type: EDR_EXP_VERSION_DBL_CLICK,
        payload: {versionId: itemId},
      });
    };

    const deleteHandler = (e) => {
      e.stopPropagation();
      setShowDeleteDialog(true);
    };

    const deleteAcceptHandler = (e) => {
      e.stopPropagation();
      const actions = [
        {
          type: EXP_DELETE_ITEM,
          payload: {itemType, itemId, itemParentId},
        },
      ];
      // prepare for revert, it doesn't matter whether we prepare for revert
      // before dispatching a delete or after it cause the current state is not
      // going to update before this function completes execution as state
      // updates are async.
      // While preparing for revert, also gather the versions being deleted in
      // this operation for updating tabs.
      const et = files.entities;
      const versionsDeleting = [];
      const revertOnError = {
        versions: [],
        tests: [],
        files: [],
        idsAdjustment: () => null,
      };
      switch (itemType) {
        case ExplorerItemType.FILE: {
          const fid = itemId;
          if (Array.isArray(et.files[fid].tests)) {
            et.files[fid].tests.forEach((tid) => {
              if (Array.isArray(et.tests[tid].versions)) {
                et.tests[tid].versions.forEach((vid) => {
                  revertOnError.versions.push({[vid]: et.versions[vid]});
                  versionsDeleting.push(vid);
                });
              }
              revertOnError.tests.push({[tid]: et.tests[tid]});
            });
          }
          revertOnError.files.push({[fid]: et.files[fid]});
          // following function gets new state post deletion from reducer
          revertOnError.idsAdjustment = (newState, sortIdsUsingNameMapping) => {
            const newFiles = newState.files;
            // don't just remember the index of current fid in result and place
            // in that index, because when api delays and user may have renamed
            // some file causing sort order to change, thus compute again.
            newFiles.result.push(fid);
            newFiles.result = sortIdsUsingNameMapping(
              newFiles.result,
              newFiles.entities.files
            );
          };
          break;
        }
        case ExplorerItemType.TEST: {
          const tid = itemId;
          const fid = itemParentId;
          if (Array.isArray(et.tests[tid].versions)) {
            et.tests[tid].versions.forEach((vid) => {
              revertOnError.versions.push({[vid]: et.versions[vid]});
              versionsDeleting.push(vid);
            });
          }
          revertOnError.tests.push({[tid]: et.tests[tid]});
          revertOnError.idsAdjustment = (newState, sortIdsUsingNameMapping) => {
            const newET = newState.files.entities;
            // The entire file might have been deleted while we attempted to
            // delete in case of an api delay, thus check whether it really
            // exists now.
            if (newET.files[fid] !== undefined) {
              newET.files[fid].tests.push(tid);
              newET.files[fid].tests = sortIdsUsingNameMapping(
                newET.files[fid].tests,
                newET.tests
              );
            }
          };
          break;
        }
        case ExplorerItemType.VERSION: {
          const vid = itemId;
          const tid = itemParentId;
          revertOnError.versions.push({[vid]: et.versions[vid]});
          versionsDeleting.push(vid);
          revertOnError.idsAdjustment = (newState, sortIdsUsingNameMapping) => {
            const newET = newState.files.entities;
            // The entire test might have been deleted while we attempted to
            // delete in case of an api delay, thus check whether it really
            // exists now.
            if (newET.tests[tid] !== undefined) {
              newET.tests[tid].versions.push(vid);
              newET.tests[tid].versions = sortIdsUsingNameMapping(
                newET.tests[tid].versions,
                newET.versions
              );
            }
          };
          break;
        }
        default:
          throw new Error(`Can't detect ${itemType} while working on deletion`);
      }
      const revert = (newState, sortIdsUsingNameMapping) => {
        const newET = newState.files.entities;
        revertOnError.versions.forEach((v) => {
          Object.assign(newET.versions, v);
        });
        revertOnError.tests.forEach((t) => {
          Object.assign(newET.tests, t);
        });
        revertOnError.files.forEach((f) => {
          Object.assign(newET.files, f);
        });
        revertOnError.idsAdjustment(newState, sortIdsUsingNameMapping);
      };

      if (versionsDeleting.length > 0) {
        // now we've versions being deleted, let's send dispatch for updating tabs
        actions.push({
          type: EDR_EXP_VERSIONS_DELETED,
          payload: {versionIds: versionsDeleting},
        });
      }

      // send a dispatch now
      dispatch(batchActions(actions));

      // eslint-disable-next-line no-unused-vars
      const onError = (error) => {
        // Show some precise error and revert.
        dispatch({type: EXP_DELETE_REVERT, payload: {revertFunc: revert}});
      };
      /*
      Send api request, send itemType, itemId.
      if request fails, invoke onError, if passes do nothing.
      For now simulate the error situation using a setTimeout, hide once test
      done. setTimeout(onError, 500);
      */
      setShowDeleteDialog(false);
    };

    const unloadHandler = (e) => {
      e.stopPropagation();
      setShowUnloadDialog(true);
    };

    const unloadAcceptHandler = (e) => {
      e.stopPropagation();
      setShowUnloadDialog(false);
      const actions = [{type: EXP_UNLOAD_FILE, payload: {itemType, itemId}}];
      // find all versions within this file, all of them need to be removed from
      // tabs
      const et = files.entities;
      const versionIds = [];
      // eslint-disable-next-line no-unused-expressions
      Array.isArray(et.files[itemId].tests) &&
        et.files[itemId].tests.forEach((t) =>
          et.tests[t].versions.forEach((v) => versionIds.push(v))
        );
      if (versionIds.length > 0) {
        actions.push({
          type: EDR_EXP_VERSIONS_DELETED,
          payload: {versionIds},
        });
      }
      dispatch(batchActions(actions));
    };

    const deleteDialogCancelHandler = (e) => {
      e.stopPropagation();
      setShowDeleteDialog(false);
    };

    const unloadDialogCancelHandler = (e) => {
      e.stopPropagation();
      setShowUnloadDialog(false);
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
              operationType={ExplorerEditOperationType.RENAME}
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
            onMouseEnter={onHovering}
            onMouseLeave={onHoveringCancel}
            onDoubleClick={handleDoubleClick}
            data-testid={`${itemType}-treeItemContent`}>
            <Box
              display="flex"
              alignItems="center"
              flex={1}
              className={classes.textContentRoot}>
              <ColoredItemIcon itemType={itemType} />
              <Typography
                variant="caption"
                className={clsx(hasError && classes.errorText)}
                data-testid={`${itemType}-treeItemName`}>
                {itemName}
              </Typography>
              {itemType === ExplorerItemType.VERSION && isCurrentVersion && (
                <Chip
                  size="small"
                  label="Latest"
                  className={classes.chip}
                  data-testid="latestVersion"
                />
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
            <Button
              onClick={deleteDialogCancelHandler}
              size="small"
              aria-label="cancel">
              Cancel
            </Button>
            <Button
              onClick={deleteAcceptHandler}
              variant="contained"
              size="small"
              aria-label="delete">
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
            <Button
              onClick={unloadDialogCancelHandler}
              size="small"
              aria-label="cancel">
              Cancel
            </Button>
            <Button
              onClick={unloadAcceptHandler}
              variant="contained"
              size="small"
              aria-label="unload">
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
          Array.isArray(prevProps[k]) &&
          Array.isArray(nextProps[k]) &&
          prevProps[k].length === nextProps[k].length
        ) {
          return (
            nextProps[k].filter((name) => !prevProps[k].includes(name))
              .length === 0
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
  - selectedNodesRef is a ref and doesn't change so need to ignore in check.
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
  filesRef: PropTypes.exact({
    current: PropTypes.object,
  }).isRequired,
};

TreeItemContent.defaultProps = {
  itemParentId: undefined,
  itemSiblingNames: null,
  hasError: undefined,
  isCurrentVersion: undefined,
};

export default TreeItemContent;

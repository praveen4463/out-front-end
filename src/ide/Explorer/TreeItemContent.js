import React, {useState, useContext, useRef} from 'react';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Box from '@material-ui/core/Box';
import {ContextMenu, MenuItem, ContextMenuTrigger} from 'react-contextmenu';
import TestIcon from '@material-ui/icons/Title';
import Chip from '@material-ui/core/Chip';
import clsx from 'clsx';
import VersionIcon from '../../components/newVersionIcon';
import Tooltip from '../../TooltipCustom';
import {ApiStatuses, RunType} from '../../Constants';
import {ExplorerItemType, ExplorerEditOperationType} from '../Constants';
import TreeItemEditor from './TreeItemEditor';
import ColoredItemIcon from '../../components/ColoredItemIcon';
import {
  IdeDispatchContext,
  IdeBuildRunOngoingContext,
  IdeDryRunOngoingContext,
  IdeParseRunOngoingContext,
} from '../Contexts';
import batchActions from '../actionCreators';
import {
  EXP_UNLOAD_FILE,
  EXP_RENAME_ITEM,
  EXP_DELETE_ITEM,
  EXP_DELETE_REVERT,
  EDR_EXP_VERSIONS_DELETED,
  EDR_EXP_VERSION_DBL_CLICK,
  DRY_START_RUN,
  PARSE_START_RUN,
} from '../actionTypes';
import {
  CONFIG_BUILD_ON_VERSIONS_DELETE,
  BUILD_NEW_RUN,
} from '../../actions/actionTypes';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import useConfirmationDialog from '../../hooks/useConfirmationDialog';
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
    color: theme.palette.error.main,
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
  itemFont: {
    fontSize: '0.825rem',
  },
}));

const {FILE, TEST, VERSION} = ExplorerItemType;

// !!! Make sure there is no prop/context here that causes unnecessary re render
const TreeItemContent = React.memo(
  ({
    itemType,
    itemName,
    itemId,
    itemParentId,
    itemSiblingNames,
    showAsErrorInExplorer,
    isCurrentVersion,
    onNewItem,
    filesRef,
  }) => {
    const dispatch = useContext(IdeDispatchContext);
    const buildOngoing = useContext(IdeBuildRunOngoingContext);
    const dryOngoing = useContext(IdeDryRunOngoingContext);
    const parseOngoing = useContext(IdeParseRunOngoingContext);
    const [editing, setEditing] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
    const classes = useStyle();
    const errorContainerRef = useRef(null);
    const files = filesRef.current;

    const newItemHandler = (e) => {
      e.stopPropagation();
      let newItemType;
      if (itemType === FILE) {
        newItemType = TEST;
      } else if (itemType === TEST) {
        newItemType = VERSION;
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
      const onError = (response) => {
        setSnackbarErrorMsg(`Couldn't rename, ${response.error.reason}`);
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
      setTimeout(() => {
        /* const response = {
          status: ApiStatuses.FAILURE,
          error: {
            reason: 'Network error',
          },
        }; */
        const response = {
          status: ApiStatuses.SUCCESS,
        };
        if (response.status === ApiStatuses.FAILURE) {
          onError(response);
        }
      }, 500);
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

    const getRunVersionIds = () => {
      let versionIds;
      const etFiles = files.entities.files;
      const etTests = files.entities.tests;
      const etVersions = files.entities.versions;
      switch (itemType) {
        case FILE:
          versionIds = etFiles[itemId].tests.map((tid) =>
            etTests[tid].versions.find((vid) => etVersions[vid].isCurrent)
          );
          break;
        case TEST:
          versionIds = etTests[itemId].versions.find(
            (vid) => etVersions[vid].isCurrent
          );
          break;
        case VERSION:
          versionIds = [itemId];
          break;
        default:
          throw new Error(`Can't recognize ${itemType}`);
      }
      return versionIds;
    };

    const runBuildHandler = (e) => {
      e.stopPropagation();
      dispatch({
        type: BUILD_NEW_RUN,
        payload: {versionIds: getRunVersionIds()},
      });
    };

    const runDryHandler = (e) => {
      e.stopPropagation();
      dispatch({
        type: DRY_START_RUN,
        payload: {versionIds: getRunVersionIds()},
      });
    };

    const runParseHandler = (e) => {
      e.stopPropagation();
      dispatch({
        type: PARSE_START_RUN,
        payload: {versionIds: getRunVersionIds()},
      });
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
      if (itemType !== VERSION) {
        return;
      }
      dispatch({
        type: EDR_EXP_VERSION_DBL_CLICK,
        payload: {versionId: itemId},
      });
    };

    const deleteAcceptHandler = () => {
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
        case FILE: {
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
        case TEST: {
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
        case VERSION: {
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

      const onSuccess = () => {
        dispatch({
          type: CONFIG_BUILD_ON_VERSIONS_DELETE,
          payload: {versionIds: versionsDeleting},
        });
      };
      const onError = (response) => {
        setSnackbarErrorMsg(`Couldn't delete, ${response.error.reason}`);
        dispatch({type: EXP_DELETE_REVERT, payload: {revertFunc: revert}});
      };
      /*
      Send api request, send itemType, itemId.
      if request fails, invoke onError, if passes do nothing.
      For now simulate the error situation using a setTimeout, hide once test
      done.
      */
      setTimeout(() => {
        const response = {
          status: ApiStatuses.SUCCESS,
        };
        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess();
        } else if (response.status === ApiStatuses.FAILURE) {
          onError(response);
        }
      }, 500);
    };

    const [setShowDeleteDialog, deleteDialog] = useConfirmationDialog(
      deleteAcceptHandler,
      'Delete',
      `Are you sure you want to delete ${itemType.toLowerCase()} ${itemName}?`,
      'delete-alert-dialog-description'
    );

    const deleteHandler = (e) => {
      e.stopPropagation();
      setShowDeleteDialog(true);
    };

    const unloadAcceptHandler = () => {
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
        actions.push(
          {
            type: EDR_EXP_VERSIONS_DELETED,
            payload: {versionIds},
          },
          {
            type: CONFIG_BUILD_ON_VERSIONS_DELETE,
            payload: {versionIds},
          }
        );
      }
      dispatch(batchActions(actions));
    };

    const [setShowUnloadDialog, unloadDialog] = useConfirmationDialog(
      unloadAcceptHandler,
      'Unload',
      `Are you sure you want to unload ${itemType.toLowerCase()} ${itemName} from workspace?`,
      'unload-alert-dialog-description'
    );

    const unloadHandler = (e) => {
      e.stopPropagation();
      setShowUnloadDialog(true);
    };

    const getBuildRunTextPerExplorerItem = (runType) => {
      let runText;
      switch (runType) {
        case RunType.BUILD_RUN:
          runText = 'Run Build';
          break;
        case RunType.DRY_RUN:
          runText = 'Dry Run';
          break;
        case RunType.PARSE_RUN:
          runText = 'Parse';
          break;
        default:
          throw new Error(`Can't find runType ${runType}`);
      }
      const initialText = `${runText} ${
        runType === RunType.BUILD_RUN ? 'For ' : ''
      }`;
      let text;
      switch (itemType) {
        case FILE:
          text = `${initialText} All Tests (Latest Version Only)`;
          break;
        case TEST:
          text = `${initialText} This Test (Latest Version Only)`;
          break;
        case VERSION:
          text = `${initialText} This Version Only`;
          break;
        default:
          throw new Error(`Can't find build run text for ${itemType}`);
      }
      return text;
    };

    const runDisabled = () => {
      return buildOngoing || dryOngoing || parseOngoing;
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
                variant="body2"
                className={clsx(
                  classes.itemFont,
                  showAsErrorInExplorer && classes.errorText
                )}
                data-testid={`${itemType}-treeItemName`}>
                {itemName}
              </Typography>
              {itemType === VERSION && isCurrentVersion && (
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
                {itemType === FILE && (
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
                {itemType === TEST && (
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
              disabled={runDisabled()}
              className={classes.contextMenuItem}>
              {getBuildRunTextPerExplorerItem(RunType.BUILD_RUN)}
            </MenuItem>
            <MenuItem
              onClick={runDryHandler}
              disabled={runDisabled()}
              className={classes.contextMenuItem}>
              {getBuildRunTextPerExplorerItem(RunType.DRY_RUN)}
            </MenuItem>
            <MenuItem
              onClick={runParseHandler}
              disabled={runDisabled()}
              className={classes.contextMenuItem}>
              {getBuildRunTextPerExplorerItem(RunType.PARSE_RUN)}
            </MenuItem>
            {itemType === FILE && (
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
            {itemType === TEST && (
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
        {deleteDialog}
        {unloadDialog}
        {snackbarTypeError}
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
  showAsErrorInExplorer: PropTypes.bool,
  isCurrentVersion: PropTypes.bool,
  onNewItem: PropTypes.func.isRequired,
  filesRef: PropTypes.exact({
    current: PropTypes.object,
  }).isRequired,
};

TreeItemContent.defaultProps = {
  itemParentId: undefined,
  itemSiblingNames: null,
  showAsErrorInExplorer: undefined,
  isCurrentVersion: undefined,
};

export default TreeItemContent;

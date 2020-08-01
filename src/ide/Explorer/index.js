import React, {
  useState,
  useRef,
  useCallback,
  useContext,
  useEffect,
} from 'react';
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
import {normalize} from 'normalizr';
import {random} from 'lodash-es';
import {ExplorerItemType} from '../Constants';
import TreeItemEditor from './TreeItemEditor';
import TreeItemContent from './TreeItemContent';
import Tooltip from '../../TooltipCustom';
import {IdeDispatchContext, IdeFilesContext} from '../Contexts';
import {EXP_LOAD_FILES, EXP_NEW_ITEM} from '../actionTypes';
import {Version, Test, File, filesSchema} from './model';
import {fileToLoad as sampleFilesForOnLoad} from './sample';

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
  const dispatch = useContext(IdeDispatchContext);
  const files = useContext(IdeFilesContext);
  console.log('Explorer received files:');
  console.log(files);
  const [addNewItem, setAddNewItem] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState([]);
  const filesRef = useRef(files);
  const selectedNodesRef = useRef();
  const errorContainerRef = useRef(null);
  // ref object doesn't change thus safe to use in pure components. It's mutable
  // current property will give us latest set value without a re render of
  // component that uses it.
  const classes = useStyles();

  useEffect(() => {
    if (filesRef.current !== files) {
      filesRef.current = files;
    }
  });

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

  // !!! Note: Very uncompleted functionality.
  const handleOnLoad = () => {
    /*
    TODO: Make sure some project is selected, if not ask user to do so in some
    nice way like redirecting focus to project dropdown.
    Make a design for the File selection component such as something that loads
    a tree of all available files together with the test and version. For now
    we may fetch all data at once rather than fetching tests/versions on demand.
    User can see there which files are already shown in in the tree as those
    are not selectable and tells that it is already there in tree.
    When a file is selected, that node has a squish mark and green background,
    clicking again toggles it. A panel besides the file tree show selected files
    in a column and below that is a button 'load selected files'. Dialog has a
    close button and clicking outside or escape closes it without committing
    any file for loading.
    !!First investigate whether should we run api call from this event handler
    or using 'effect', use the articles mentioned in this file.!!
    use swr or similar to make request to api and get available files, when it's
    not available show skelton in the modal box, once loaded show files, if
    error, show some error that make sense to the problem within the modal.
    Validate the received data against a prebuilt json schema and normalize it
    before giving it to the FileSelect component. Note that the data should
    already be ordered.
    Once user selects file and clicks button, load all selected files into
    tree.
    */
    // For now, assume we've the selected raw files form api and take sample
    // files.
    const filesToLoad = normalize(sampleFilesForOnLoad, filesSchema);
    dispatch({type: EXP_LOAD_FILES, payload: {filesToLoad}});
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

  // TODO: uncompleted functionality
  const newItemCommitCallback = useCallback(
    (newItemName, newItemType) => {
      /*
      We need to first create the new item before updating it locally based on
      the returned data.
      First investigate whether should we run effects in this callback or some
      how use 'effects' to do so using following article from Dan
      https://overreacted.io/a-complete-guide-to-useeffect/
      Also see https://medium.com/@audisho.sada/using-react-hooks-to-asynchronously-make-api-requests-1fdf52f797ce
      and https://stackoverflow.com/questions/53845595/wrong-react-hooks-behaviour-with-event-listener
      Invoke api and expect new item based on itemType. When a response is
      received, dispatch to update the state and if failed, show some error
      in some way like snackbar/alert (on top of explorer) etc. We may not show
      some loading indicator because I don't want to interrupt any further
      actions while new item is being created, it should be fine if nothing
      happens for a sec and then new item appears in tree and opens in new
      tab.
      For now, simulate this and create data baed on random Ids, Use the same
      functions and similar functionality with exception that data will come
      from api.
      */

      // data is null while simulating
      // eslint-disable-next-line no-unused-vars
      const onSuccess = (data) => {
        // generate random ids while simulating
        const newRandom = () => {
          return random(1000, 10000);
        };
        let newItem;
        switch (newItemType) {
          case ExplorerItemType.FILE:
            // validate data: should have fileId, name (name is taken what is returned
            // from api, possible that api sanitize the name)
            newItem = new File(newRandom(), newItemName); // !!!This is sample
            break;
          case ExplorerItemType.TEST: {
            // validate data: should have testId, name, versions, versionId, versionName, code,
            // isCurrent.
            const newTestId = newRandom();
            newItem = new Test(newTestId, newItemName, addNewItem.parentId, [
              new Version(newRandom(), 'v1', newTestId, '', true),
            ]); // !!!This is sample
            break;
          }
          case ExplorerItemType.VERSION:
            // Version rules for new item: a new version will always contain code of
            // latest version (if some version exists) and will be marked 'latest', the
            // last latest version will no longer be latest.
            // A latest version can't be deleted and api should return
            // error if a call tries to do so.
            // validate data: should have versionId, name, code, isCurrent
            newItem = new Version(
              newRandom(),
              newItemName,
              addNewItem.parentId,
              'openUrl("https://twitter.com")',
              true
            ); // !!!This is sample
            break;
          default:
            throw new Error(`Couldn't add new item of type ${newItemType}`);
        }
        // now dispatch
        dispatch({
          type: EXP_NEW_ITEM,
          payload: {
            item: newItem,
            itemType: newItemType,
            itemParentId: addNewItem.parentId,
          },
        });
      };

      // eslint-disable-next-line no-unused-vars
      const onError = (error) => {
        // show error in form of snackbar etc.
      };
      // Assume that following setTimeout is api request and it's function is
      // the callback needs to run on completion.
      // Things that need to be sent to api:
      // newItemType, newItemName, (parentType = TEST/VERSION,
      // addNewItem.parentId) only when newItemType !== FILE
      setTimeout(onSuccess, 1000);
      // hide the input box and let api return in sometime and change state.
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
      selectedNodesRef={selectedNodesRef}
      filesRef={filesRef}
    />
  );

  return (
    <Box className={classes.explorer}>
      <Box
        display="flex"
        alignItems="center"
        style={{borderBottom: '1px solid #363636'}}>
        <Typography variant="body2" className={classes.fileCaption}>
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

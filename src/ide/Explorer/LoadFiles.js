/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */
import React, {useState, useContext, useEffect} from 'react';
import PropTypes from 'prop-types';
import SvgIcon from '@material-ui/core/SvgIcon';
import {fade, makeStyles, withStyles} from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Collapse from '@material-ui/core/Collapse';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import clsx from 'clsx';
import {useSpring, animated} from 'react-spring/web.cjs'; // web.cjs is required for IE 11 support
import Loader from '../../components/Loader';
import ColoredItemIcon from '../../components/ColoredItemIcon';
import {ExplorerItemType} from '../Constants';
import {
  handleApiError,
  getFilesWithTests,
  filesWithTestsApiDataToNormalizedSorted,
} from '../../common';
import {
  IdeDispatchContext,
  IdeFilesContext,
  IdeProjectIdContext,
} from '../Contexts';
import TitleDialog from '../../components/TitleDialog';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import {EXP_LOAD_FILES} from '../actionTypes';

const MinusSquare = (props) => (
  <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
    <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
  </SvgIcon>
);

const PlusSquare = (props) => (
  <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
    <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
  </SvgIcon>
);

function CloseSquare(props) {
  return (
    <SvgIcon
      className="close"
      fontSize="inherit"
      style={{width: 14, height: 14}}
      {...props}>
      <path d="M17.485 17.512q-.281.281-.682.281t-.696-.268l-4.12-4.147-4.12 4.147q-.294.268-.696.268t-.682-.281-.281-.682.294-.669l4.12-4.147-4.12-4.147q-.294-.268-.294-.669t.281-.682.682-.281.696 .268l4.12 4.147 4.12-4.147q.294-.268.696-.268t.682.281 .281.669-.294.682l-4.12 4.147 4.12 4.147q.294.268 .294.669t-.281.682zM22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0z" />
    </SvgIcon>
  );
}

const TransitionComponent = (props) => {
  const style = useSpring({
    from: {opacity: 0, transform: 'translate3d(20px,0,0)'},
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
    },
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
};

TransitionComponent.propTypes = {
  /**
   * Show the component; triggers the enter or exit states
   */
  in: PropTypes.bool,
};

TransitionComponent.defaultProps = {
  in: null,
};

const StyledTreeItem = withStyles((theme) => ({
  iconContainer: {
    '& .close': {
      opacity: 0.3,
    },
  },
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${fade(theme.palette.text.primary, 0.4)}`,
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
  expanded: {},
  selected: {},
  label: {
    color: 'inherit',
  },
}))((props) => (
  <TreeItem {...props} TransitionComponent={TransitionComponent} />
));

const {FILE, TEST, VERSION} = ExplorerItemType;

const FileSelector = ({id, onChange, isSelected, isDisabled}) => {
  const handleChange = (e) => {
    onChange(id, e.target.checked);
  };

  return (
    <Checkbox
      style={{padding: '0px'}}
      onChange={handleChange}
      checked={isSelected}
      disabled={isDisabled}
    />
  );
};

FileSelector.propTypes = {
  id: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  checked: {
    color: theme.palette.secondary.highlight,
  },
  noRecordText: {
    marginTop: theme.spacing(4),
  },
  chip: {
    marginLeft: theme.spacing(0.5),
    fontSize: '0.7rem',
    height: theme.spacing(1.8),
    cursor: 'pointer',
  },
  errorText: {
    color: theme.palette.error.light,
  },
  button: {
    marginLeft: theme.spacing(1),
  },
  testSelect: {
    padding: 12,
    overflow: 'auto',
  },
  bottomBar: {
    backgroundColor: theme.palette.background.paper,
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
  },
}));

// clone shallowly as we're not going to mutate existing files, we just need to
// add tests/versions to files not in explorer.
const cloneFiles = (files) => {
  if (!files) {
    return null;
  }
  const clone = {
    entities: {
      versions: {...files.entities.versions},
      tests: {...files.entities.tests},
      files: {...files.entities.files},
    },
    result: [...files.result],
  };
  const et = clone.entities;
  // deep clone only files in entities and only those filesIds that are not loaded
  // into tree because those are what we're going to load and fill tests for them.
  // we're not deep cloning tests/versions as we don't mutate existing tests but
  // add new ones while loading.
  clone.result.forEach((fid) => {
    if (!et.files[fid].loadToTree && !et.files[fid].tests) {
      et.files[fid] = {...et.files[fid]};
    }
  });
  return clone;
};

const anyFilesExists = (files) =>
  Boolean(files && Array.isArray(files.result) && files.result.length);

const LoadFiles = React.memo(({showDialog, setShowDialog}) => {
  const dispatch = useContext(IdeDispatchContext);
  const projectId = useContext(IdeProjectIdContext);
  const filesFromContext = useContext(IdeFilesContext);
  const [files, setFiles] = useState(null);
  const etFiles = files ? files.entities.files : null;
  const etTests = files ? files.entities.tests : null;
  const etVersions = files ? files.entities.versions : null;
  const classes = useStyles();
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const [loading, setLoading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState(new Set());
  const anyFiles = anyFilesExists(files);

  // This effect set files by looking into what is in file context and in api
  useEffect(() => {
    if (!anyFilesExists(filesFromContext)) {
      return; // if there were no files at all, we don't have anything to load.
    }
    const cloned = cloneFiles(filesFromContext);
    const fileIdsNotLoaded = cloned.result.filter(
      (fid) => !cloned.entities.files[fid].loadToTree
    );
    if (!fileIdsNotLoaded.length) {
      return; // all files in editor, no data needs to be fetched.
    }
    // send fileIdsNotLoaded to api and load their tests, some files may not have any
    // tests and may still be in unloaded state, so we will show just their file
    // names. Note that api returns only files having tests, files with no
    // tests are not returned, thus an empty array may be returned.
    setLoading(true);

    async function getFiles() {
      try {
        const {data} = await getFilesWithTests(
          fileIdsNotLoaded.join(','),
          projectId
        );
        setLoading(false);
        if (!data.length) {
          return;
        }
        // data is files
        const filesToLoad = filesWithTestsApiDataToNormalizedSorted(data);
        Object.assign(cloned.entities.files, filesToLoad.entities.files);
        Object.assign(cloned.entities.tests, filesToLoad.entities.tests);
        Object.assign(cloned.entities.versions, filesToLoad.entities.versions);
        setFiles(cloned);
      } catch (error) {
        handleApiError(error, setSnackbarErrorMsg, "Couldn't fetch files");
      }
    }

    getFiles();
  }, [filesFromContext, projectId, setSnackbarErrorMsg]);

  const handleToggle = (e, nodeIds) => {
    if (e.target.getAttribute('type') !== 'checkbox') {
      setExpandedNodes(nodeIds);
    }
  };

  const handleFileSelectorChange = (fid, isChecked) => {
    setSelectedFileIds((fids) => {
      if (isChecked) {
        fids.add(fid);
      } else {
        fids.delete(fid);
      }
      return new Set(fids);
    });
  };

  const handleLoadFiles = () => {
    if (!selectedFileIds.size) {
      return;
    }
    const selectedFileIdsArray = Array.from(selectedFileIds);
    selectedFileIdsArray.forEach((fid) => {
      etFiles[fid].loadToTree = true;
    });
    // Make tests null for files those are not selected but loaded with tests as
    // files those are not loaded must have their tests set to null.
    files.result.forEach((fid) => {
      if (!etFiles[fid].loadToTree && etFiles[fid].tests) {
        etFiles[fid].tests = null;
      }
    });
    dispatch({type: EXP_LOAD_FILES, payload: {files}});
    setShowDialog(false);
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  return (
    <TitleDialog
      showDialog={showDialog}
      closeDialog={handleCancel}
      title="Load Files">
      {loading ? <Loader rows={6} /> : null}
      {!loading && anyFiles ? (
        <Box display="flex" flexDirection="column" height="90%" overflow="auto">
          <Box className={classes.testSelect}>
            <TreeView
              className={classes.root}
              expanded={expandedNodes}
              onNodeToggle={handleToggle}
              defaultCollapseIcon={<MinusSquare />}
              defaultExpandIcon={<PlusSquare />}
              defaultEndIcon={<CloseSquare />}
              id="loadFiles">
              {files.result.map((fid) => (
                <StyledTreeItem
                  nodeId={`${FILE}-${fid}`}
                  key={fid}
                  label={
                    <Box display="flex" alignItems="center">
                      <FileSelector
                        id={fid}
                        onChange={handleFileSelectorChange}
                        isSelected={
                          etFiles[fid].loadToTree || selectedFileIds.has(fid)
                        }
                        isDisabled={etFiles[fid].loadToTree ?? false}
                      />
                      <ColoredItemIcon itemType={FILE} />
                      <Typography
                        variant="body2"
                        style={{marginLeft: '4px'}}
                        className={clsx(
                          etFiles[fid].showAsErrorInExplorer &&
                            classes.errorText
                        )}>
                        {etFiles[fid].name}
                      </Typography>
                    </Box>
                  }>
                  {etFiles[fid].tests &&
                    etFiles[fid].tests.map((tid) => (
                      <StyledTreeItem
                        nodeId={`${TEST}-${tid}`}
                        key={tid}
                        label={
                          <Box display="flex" alignItems="center">
                            <ColoredItemIcon itemType={TEST} />
                            <Typography
                              variant="body2"
                              style={{marginLeft: '4px'}}
                              className={clsx(
                                etTests[tid].showAsErrorInExplorer &&
                                  classes.errorText
                              )}>
                              {etTests[tid].name}
                            </Typography>
                          </Box>
                        }>
                        {etTests[tid].versions.map((vid) => (
                          <StyledTreeItem
                            nodeId={`${VERSION}-${vid}`}
                            key={vid}
                            label={
                              <Box display="flex" alignItems="center">
                                <ColoredItemIcon itemType={VERSION} />
                                <Typography
                                  variant="body2"
                                  style={{marginLeft: '4px'}}
                                  className={clsx(
                                    etVersions[vid].showAsErrorInExplorer &&
                                      classes.errorText
                                  )}>
                                  {etVersions[vid].name}
                                </Typography>
                                {etVersions[vid].isCurrent && (
                                  <Chip
                                    size="small"
                                    label="Latest"
                                    className={classes.chip}
                                  />
                                )}
                              </Box>
                            }
                          />
                        ))}
                      </StyledTreeItem>
                    ))}
                </StyledTreeItem>
              ))}
            </TreeView>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            boxShadow={2}
            height={60}
            className={classes.bottomBar}>
            <Box display="flex" pr={2}>
              <Button
                variant="contained"
                color="secondary"
                className={classes.button}
                onClick={handleLoadFiles}
                disabled={!selectedFileIds.size}>
                Load Selected Files Into Workspace
              </Button>
              <Button
                variant="contained"
                className={classes.button}
                onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      ) : null}
      {!loading && !anyFiles ? (
        <Typography variant="body2" className={classes.noRecordText}>
          No file exists
        </Typography>
      ) : null}
      {snackbarTypeError}
    </TitleDialog>
  );
});

LoadFiles.propTypes = {
  showDialog: PropTypes.bool.isRequired,
  setShowDialog: PropTypes.func.isRequired,
};

export default LoadFiles;

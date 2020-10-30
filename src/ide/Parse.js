import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import Box from '@material-ui/core/Box';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CloseIcon from '@material-ui/icons/Close';
import SuccessIcon from '@material-ui/icons/Check';
import FailureIcon from '@material-ui/icons/HighlightOff';
import BuildIcon from '@material-ui/icons/Build';
import ErrorIcon from '@material-ui/icons/Error';
import Typography from '@material-ui/core/Typography';
import {makeStyles, withStyles, useTheme} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import clsx from 'clsx';
import {intersection} from 'lodash-es';
import Tooltip from '../TooltipCustom';
import {getNodeId, getBrokenNodeId} from './Explorer/internal';
import {
  IdeDispatchContext,
  IdeParseRunOngoingContext,
  IdeParseContext,
  IdeParseRunContext,
  IdeFilesContext,
  IdeVersionIdsCodeSaveInProgressContext,
} from './Contexts';
import {
  RUN_PARSE_ON_NEW_RUN,
  RUN_PARSE_ON_COMPLETED,
  RUN_PARSE_COMPLETE_ON_ERROR,
  PARSE_START_RUN,
  PARSE_COMPLETE_RUN,
} from './actionTypes';
import {ExplorerItemType} from './Constants';
import batchActions from './actionCreators';
import {
  getVersionsWithParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
  fillLastParseStatusAndGetFailed,
  getVersionsNoParseStatus,
} from './common';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
    borderLeft: `1px solid ${theme.palette.border.light}`,
  },
  tree: {
    width: '100%',
  },
  outputPanelContent: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'scroll',
  },
  statusPanelContent: {
    overflowY: 'scroll',
  },
  header: {
    minHeight: theme.spacing(3),
  },
  output: {
    fontFamily: "'Fira Mono', 'Courier New', Courier, monospace",
    fontSize: '0.8rem',
    fontWeight: 'normal',
    lineHeight: 1.5,
    color: theme.palette.error.light,
    margin: `${theme.spacing(1)}px 0px`,
  },
  rerun: {
    color: '#4caf50',
  },
  testStatusIcon: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
  },
  testStatusRunningIcon: {
    marginRight: theme.spacing(0.5),
  },
  success: {
    color: '#4caf50',
  },
  failure: {
    color: '#d3c138',
  },
  neutral: {
    color: '#868686',
  },
  fontSizeSmall: {
    fontSize: '1rem',
  },
  iconParseActions: {
    padding: theme.spacing(0.25),
    borderRight: `1px solid ${theme.palette.border.light}`,
    borderRadius: 'unset',
  },
  itemFont: {
    fontSize: '0.8rem',
  },
  timeText: {
    fontSize: '0.8rem',
    color: theme.palette.text.hint,
  },
  statusMsg: {
    fontSize: '0.8rem',
    color: theme.palette.background.contrastText,
  },
  error: {
    color: theme.palette.error.light,
  },
  greyText: {
    color: theme.palette.text.hint,
  },
  itemContainer: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  itemTextContainer: {
    flex: '1 1 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  whitespace: {
    '&:before': {
      content: '"\\00a0"',
    },
  },
  errorText: {
    color: theme.palette.error.light,
  },
}));

const handleLabelClick = (e) => {
  e.preventDefault();
};

const StyledTreeItem = withStyles((theme) => ({
  iconContainer: {
    marginRight: '0px',
  },
  group: {
    marginLeft: theme.spacing(1),
    paddingLeft: theme.spacing(1),
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
    paddingLeft: '0px',
    fontWeight: 'inherit',
    color: 'inherit',
  },
  // eslint-disable-next-line react/jsx-props-no-spreading
}))((props) => <TreeItem {...props} onLabelClick={handleLabelClick} />);

const {FILE, TEST, VERSION} = ExplorerItemType;
const TOP_NODE = 'TOP_NODE';
const TOP_NODE_ID = 0;

const Parse = ({closeHandler}) => {
  const dispatch = useContext(IdeDispatchContext);
  const parseOngoing = useContext(IdeParseRunOngoingContext);
  const files = useContext(IdeFilesContext);
  const allVersionIdsInSaveProgress = useContext(
    IdeVersionIdsCodeSaveInProgressContext
  );
  const etFiles = files.entities.files;
  const etTests = files.entities.tests;
  const etVersions = files.entities.versions;
  const parse = useContext(IdeParseContext);
  const parseRun = useContext(IdeParseRunContext);
  const [statusMsg, setStatusMsg] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState(null);
  const versionsParseOngoingRef = useRef(false);
  const completed = parseRun === null ? false : parseRun.completed;
  const parseRunError = parseRun === null ? null : parseRun.error;
  // don't use versionIds in tree or output, versionIdsInError will be used
  // there as we show only versions having errors there.
  const versionIds = parseRun === null ? null : parseRun.versionIds;
  const versionIdsInSaveProgress = useMemo(
    () =>
      versionIds
        ? intersection(versionIds, Array.from(allVersionIdsInSaveProgress))
        : null,
    [allVersionIdsInSaveProgress, versionIds]
  );
  const classes = useStyles();
  const theme = useTheme();

  const getTreeFilterData = useCallback(() => {
    if (!versionIds || !completed) {
      return {fileIds: null, testIds: null, versionIdsInError: null};
    }
    const tids = new Set();
    const fids = new Set();
    const vidsInError = getVersionsWithParseErrorWhenStatusAvailable(
      etVersions,
      versionIds
    );
    vidsInError.forEach((vid) => {
      const v = etVersions[vid];
      if (v) {
        const tid = v.testId;
        const fid = etTests[tid].fileId;
        tids.add(tid);
        fids.add(fid);
      }
    });
    return {
      fileIds: Array.from(fids),
      testIds: Array.from(tids),
      versionIdsInError: vidsInError,
    };
  }, [versionIds, completed, etVersions, etTests]);

  // This will recalculate on every change in dryRun, this can't be avoided
  // without introducing bugs.
  const {fileIds, testIds, versionIdsInError} = useMemo(() => {
    return getTreeFilterData();
  }, [getTreeFilterData]);

  const getInfoTypeStatusMsg = useCallback(
    (msg) => {
      return (
        <Typography variant="body2" className={classes.statusMsg}>
          {msg}
        </Typography>
      );
    },
    [classes.statusMsg]
  );

  const getErrorTypeStatusMsg = useCallback(
    (msg) => {
      return (
        <>
          <ErrorIcon
            fontSize="small"
            color="error"
            className={classes.testStatusIcon}
          />
          <Typography
            variant="body2"
            className={clsx(classes.statusMsg, classes.error)}>
            {msg}
          </Typography>
        </>
      );
    },
    [classes.error, classes.statusMsg, classes.testStatusIcon]
  );

  useEffect(() => {
    if (!parseOngoing) {
      return;
    }
    if (parseRun && parse.runId === parseRun.runId) {
      return; // already created
    }
    versionsParseOngoingRef.current = false;
    dispatch({
      type: RUN_PARSE_ON_NEW_RUN,
    });
  }, [parse.runId, parseRun, parseOngoing, dispatch]);

  useEffect(() => {
    if (!(versionIds && versionIdsInSaveProgress.length && !completed)) {
      return;
    }
    setStatusMsg(getInfoTypeStatusMsg('Saving changes...'));
  }, [completed, getInfoTypeStatusMsg, versionIds, versionIdsInSaveProgress]);

  // check if all versions have parse status, else send api request.
  useEffect(() => {
    if (
      !(
        versionIds &&
        !versionIdsInSaveProgress.length &&
        !completed &&
        !versionsParseOngoingRef.current
      )
    ) {
      return;
    }
    const versionIdsNoParseStatus = getVersionsNoParseStatus(
      etVersions,
      versionIds
    );
    if (!versionIdsNoParseStatus.length) {
      return;
    }
    // console.log('parsing all versions');
    versionsParseOngoingRef.current = true; // don't reset from here, it is used once per parse
    // and reset on parse run start.
    fillLastParseStatusAndGetFailed(versionIdsNoParseStatus, dispatch)
      .then() // no action when parsed, other code will check results.
      .catch((error) => {
        const msg = `Can't parse, ${error.message}`;
        dispatch(
          batchActions([
            {
              type: PARSE_COMPLETE_RUN,
            },
            {
              type: RUN_PARSE_COMPLETE_ON_ERROR,
              payload: {
                error: msg,
              },
            },
          ])
        );
        setStatusMsg(getErrorTypeStatusMsg(msg));
      });
    setStatusMsg(getInfoTypeStatusMsg('Parsing...'));
  }, [
    completed,
    dispatch,
    etVersions,
    getErrorTypeStatusMsg,
    getInfoTypeStatusMsg,
    versionIds,
    versionIdsInSaveProgress,
  ]);

  useEffect(() => {
    if (
      !(
        versionIds &&
        !completed &&
        !versionIdsInSaveProgress.length &&
        versionsHaveLastParseStatus(etVersions, versionIds)
      )
    ) {
      return;
    }
    // parsing done, mark completed
    dispatch(
      batchActions([
        {
          type: PARSE_COMPLETE_RUN,
        },
        {
          type: RUN_PARSE_ON_COMPLETED,
        },
      ])
    );
  }, [
    versionIds,
    versionIdsInSaveProgress,
    completed,
    etVersions,
    getInfoTypeStatusMsg,
    getErrorTypeStatusMsg,
    dispatch,
  ]);

  const expandAllNodes = useCallback(() => {
    setExpanded(
      [
        getNodeId(TOP_NODE, TOP_NODE_ID),
        fileIds.map((fid) => getNodeId(FILE, fid)),
        testIds.map((tid) => getNodeId(TEST, tid)),
      ].flat()
    );
  }, [fileIds, testIds]);

  // assign to expanded nodes state to expand all nodes on completion
  useEffect(() => {
    if (completed) {
      expandAllNodes();
    }
  }, [completed, expandAllNodes]);

  // when run completes, select the top node
  useEffect(() => {
    if (completed) {
      setSelected(getNodeId(TOP_NODE, TOP_NODE_ID));
    }
  }, [completed]);

  const handleSelect = (e, nodeId) => {
    setSelected(nodeId);
  };

  const handleToggle = (e, nodeIds) => {
    setExpanded(nodeIds);
  };

  const successMark = useMemo(
    () => (
      <SuccessIcon
        titleAccess="Passed"
        className={clsx(classes.success, classes.testStatusIcon)}
      />
    ),
    [classes.success, classes.testStatusIcon]
  );
  const failureMark = useMemo(
    () => (
      <FailureIcon
        titleAccess="Failed"
        className={clsx(classes.failure, classes.testStatusIcon)}
      />
    ),
    [classes.failure, classes.testStatusIcon]
  );

  const getFinalStatusIcon = useCallback(() => {
    if (versionIdsInError.length) {
      return failureMark;
    }
    return successMark;
  }, [failureMark, successMark, versionIdsInError]);

  const getTopNodeText = () => {
    if (versionIdsInError.length) {
      return 'Parse Results';
    }
    return 'No Parse Errors';
  };

  const getRunCompleteStatus = useCallback(() => {
    let status;
    if (versionIdsInError.length) {
      status = 'Parsing failed with errors';
    } else {
      status = 'Parsing completed successfully';
    }
    return (
      <>
        {getFinalStatusIcon()}
        <Typography
          variant="body2"
          className={clsx(
            classes.statusMsg,
            versionIdsInError.length && classes.error
          )}>
          {status}
        </Typography>
      </>
    );
  }, [classes.error, classes.statusMsg, getFinalStatusIcon, versionIdsInError]);

  useEffect(() => {
    if (!completed || parseRunError) {
      return;
    }
    setStatusMsg(getRunCompleteStatus());
  }, [completed, parseRunError, getRunCompleteStatus]);

  const handleRerun = () => {
    dispatch({
      type: PARSE_START_RUN,
      payload: {versionIds},
    });
  };

  const getAllVersionIdsInErrorByType = useCallback(
    (itemType, itemId) => {
      switch (itemType) {
        case TOP_NODE: {
          return versionIdsInError;
        }
        case FILE:
          return etFiles[itemId].tests
            .filter((tid) => testIds.indexOf(tid) >= 0)
            .map((tid) =>
              etTests[tid].versions.filter(
                (vid) => versionIdsInError.indexOf(vid) >= 0
              )
            )
            .flat();
        case TEST:
          return etTests[itemId].versions.filter(
            (vid) => versionIdsInError.indexOf(vid) >= 0
          );
        default:
          throw new Error(
            `Can't retrieve versionIdsInError array for ${itemType}`
          );
      }
    },
    [etFiles, etTests, testIds, versionIdsInError]
  );

  const getSelectedNodeVersionIdsInError = () => {
    if (!selected) {
      return [];
    }
    const {itemType, itemId} = getBrokenNodeId(selected);
    if (itemType === VERSION) {
      return [itemId];
    }
    return getAllVersionIdsInErrorByType(itemType, itemId);
  };

  return (
    <SplitPane
      split="vertical"
      defaultSize="30%"
      style={{position: 'relative'}}
      pane1Style={{minWidth: '10%', maxWidth: '40%'}}>
      <Box display="flex" flexDirection="column" className={classes.root}>
        <Box
          display="flex"
          alignItems="center"
          className={classes.header}
          boxShadow={1}>
          {parseRun && completed ? (
            <Tooltip title="Rerun">
              <span>
                <IconButton
                  aria-label="Rerun"
                  className={classes.iconParseActions}
                  onClick={handleRerun}>
                  <BuildIcon
                    fontSize="small"
                    className={classes.rerun}
                    classes={{fontSizeSmall: classes.fontSizeSmall}}
                  />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>
        <Box px={1} my={1} flex={1} className={classes.statusPanelContent}>
          {parseRun && completed ? (
            <TreeView
              className={classes.tree}
              expanded={expanded}
              selected={selected}
              onNodeToggle={handleToggle}
              onNodeSelect={handleSelect}
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              id="parseRun">
              <StyledTreeItem
                nodeId={getNodeId(TOP_NODE, TOP_NODE_ID)}
                label={
                  <Box className={classes.itemContainer}>
                    {getFinalStatusIcon()}
                    <Box className={classes.itemTextContainer}>
                      <Typography variant="body2" className={classes.itemFont}>
                        {getTopNodeText()}
                      </Typography>
                    </Box>
                  </Box>
                }>
                {fileIds.map((fid) => (
                  <StyledTreeItem
                    nodeId={getNodeId(FILE, fid)}
                    key={fid}
                    label={
                      <Box className={classes.itemContainer}>
                        {failureMark}
                        <Box className={classes.itemTextContainer}>
                          <Typography
                            variant="body2"
                            className={clsx(
                              classes.itemFont,
                              etFiles[fid].showAsErrorInExplorer &&
                                classes.errorText
                            )}>
                            {etFiles[fid].name}
                          </Typography>
                        </Box>
                      </Box>
                    }>
                    {etFiles[fid].tests
                      .filter((tid) => testIds.indexOf(tid) >= 0)
                      .map((tid) => (
                        <StyledTreeItem
                          nodeId={getNodeId(TEST, tid)}
                          key={tid}
                          label={
                            <Box className={classes.itemContainer}>
                              {failureMark}
                              <Box className={classes.itemTextContainer}>
                                <Typography
                                  variant="body2"
                                  className={clsx(
                                    classes.itemFont,
                                    etTests[tid].showAsErrorInExplorer &&
                                      classes.errorText
                                  )}>
                                  {etTests[tid].name}
                                </Typography>
                              </Box>
                            </Box>
                          }>
                          {etTests[tid].versions
                            .filter(
                              (vid) => versionIdsInError.indexOf(vid) >= 0
                            )
                            .map((vid) => (
                              <StyledTreeItem
                                nodeId={getNodeId(VERSION, vid)}
                                key={vid}
                                label={
                                  <Box className={classes.itemContainer}>
                                    {failureMark}
                                    <Box className={classes.itemTextContainer}>
                                      <Typography
                                        variant="body2"
                                        className={clsx(
                                          classes.itemFont,
                                          etVersions[vid]
                                            .showAsErrorInExplorer &&
                                            classes.errorText
                                        )}>
                                        {etVersions[vid].name}
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                            ))}
                        </StyledTreeItem>
                      ))}
                  </StyledTreeItem>
                ))}
              </StyledTreeItem>
            </TreeView>
          ) : null}
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" className={classes.root}>
        <Box
          display="flex"
          alignItems="center"
          className={classes.header}
          boxShadow={1}
          pl={1}>
          <Box flex={1} display="flex" alignItems="center">
            {statusMsg}
          </Box>
          <Box>
            <IconButton
              aria-label="Close Panel"
              onClick={closeHandler}
              title="Close Panel"
              style={{
                padding: theme.spacing(0.25),
                opacity: theme.textOpacity.highEmphasis,
              }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {completed ? (
          <Box className={classes.outputPanelContent} flex={1}>
            {getSelectedNodeVersionIdsInError().map((vid) => (
              <Box display="flex" flexDirection="column" px={1} key={vid}>
                <pre className={classes.output}>
                  {etVersions[vid].lastParseRun.error.msg}
                </pre>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
    </SplitPane>
  );
};

Parse.propTypes = {
  closeHandler: PropTypes.func.isRequired,
};

export default Parse;

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
import StopIcon from '@material-ui/icons/Stop';
import YetToRunIcon from '@material-ui/icons/FiberManualRecord';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import ErrorIcon from '@material-ui/icons/Error';
import Typography from '@material-ui/core/Typography';
import {makeStyles, withStyles, useTheme} from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import clsx from 'clsx';
import {findLastIndex, intersection} from 'lodash-es';
import Tooltip from '../TooltipCustom';
import {getNodeId, getBrokenNodeId} from './Explorer/internal';
import {
  IdeDispatchContext,
  IdeDryRunOngoingContext,
  IdeDryContext,
  IdeDryRunContext,
  IdeFilesContext,
  IdeVersionIdsCodeSaveInProgressContext,
} from './Contexts';
import {
  RUN_DRY_ON_NEW_RUN,
  RUN_DRY_COMPLETE_ON_ERROR,
  DRY_START_RUN,
  DRY_COMPLETE_RUN,
} from './actionTypes';
import {ExplorerItemType} from './Constants';
import {TestStatus} from '../Constants';
import batchActions, {getDryStoppingAction} from './actionCreators';
import {
  versionsHaveParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
  fillLastParseStatusAndGetFailed,
  getVersionsNoParseStatus,
} from './common';
import {convertMillisIntoTimeText} from '../buildsCommon';

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
    color: theme.palette.background.contrastText,
    margin: `${theme.spacing(1)}px 0px`,
  },
  outputError: {
    color: theme.palette.error.light,
    marginTop: 0,
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
  iconDryActions: {
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
const YET_TO_RUN = 'YET_TO_RUN';

const DryRun = ({closeHandler}) => {
  const dispatch = useContext(IdeDispatchContext);
  const dryRunOngoing = useContext(IdeDryRunOngoingContext);
  const files = useContext(IdeFilesContext);
  const etFiles = files.entities.files;
  const etTests = files.entities.tests;
  const etVersions = files.entities.versions;
  const dry = useContext(IdeDryContext);
  const dryRun = useContext(IdeDryRunContext);
  const allVersionIdsInSaveProgress = useContext(
    IdeVersionIdsCodeSaveInProgressContext
  );
  const [statusMsg, setStatusMsg] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState(null);
  const allDryRunVersions = useMemo(
    () =>
      dryRun === null
        ? null
        : dryRun.versionIds.map((vid) => dryRun.dryRunVersions[vid]),
    [dryRun]
  );
  const executingVersionId = useMemo(() => {
    if (!allDryRunVersions) {
      return null;
    }
    // get the first drv starting backwards that is non null, this will always
    // give latest non null entry, if we start from beginning, the first one
    // will always return.
    const lastIndex = findLastIndex(allDryRunVersions, (drv) => drv.status);
    return lastIndex >= 0 ? allDryRunVersions[lastIndex].versionId : null;
  }, [allDryRunVersions]);
  // if user selects a node, don't auto select on 'Running' status change.
  const didUserSelectNodeRef = useRef(false);
  const expandNodesBeginningRef = useRef(false);
  const versionsParseOngoingRef = useRef(false);
  const completed = dryRun === null ? false : dryRun.completed;
  const dryRunError = dryRun === null ? null : dryRun.error;
  const dryRunInProgress = dryRun === null ? false : dryRun.inProgress;
  const classes = useStyles();
  const theme = useTheme();

  const getTreeFilterData = useCallback(() => {
    if (!dryRun) {
      return {fileIds: null, testIds: null, versionIds: null};
    }
    // never use dryRun keys for getting vids because it will give string keys.
    const vids = dryRun.versionIds;
    const tids = new Set();
    const fids = new Set();
    vids.forEach((vid) => {
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
      versionIds: vids,
    };
  }, [dryRun, etTests, etVersions]);

  // This will recalculate on every change in dryRun, this can't be avoided
  // without introducing bugs.
  const {fileIds, testIds, versionIds} = useMemo(() => {
    return getTreeFilterData();
  }, [getTreeFilterData]);
  const versionIdsInSaveProgress = useMemo(
    () =>
      versionIds
        ? intersection(versionIds, Array.from(allVersionIdsInSaveProgress))
        : null,
    [allVersionIdsInSaveProgress, versionIds]
  );

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

  // assign to dryRun on new dry
  useEffect(() => {
    if (!dryRunOngoing) {
      return;
    }
    if (dryRun && dry.runId === dryRun.runId) {
      return; // already created dryRun instance for this run
    }
    // console.log('assign to dryRun on new dry: inside');
    // reset refs as this runs on new dry runs only (before dispatching)
    didUserSelectNodeRef.current = false;
    expandNodesBeginningRef.current = false;
    versionsParseOngoingRef.current = false;
    dispatch({
      type: RUN_DRY_ON_NEW_RUN,
    });
  }, [dry.runId, dryRun, dryRunOngoing, dispatch]);

  const completeOnError = useCallback(
    (error) => {
      dispatch(
        batchActions([
          {
            type: DRY_COMPLETE_RUN,
          },
          {
            type: RUN_DRY_COMPLETE_ON_ERROR,
            payload: {
              error,
            },
          },
        ])
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (
      !(
        versionIds &&
        !dryRunInProgress &&
        versionIdsInSaveProgress.length &&
        !completed
      )
    ) {
      return;
    }
    setStatusMsg(getInfoTypeStatusMsg('Saving changes...'));
  }, [
    completed,
    getInfoTypeStatusMsg,
    versionIds,
    versionIdsInSaveProgress,
    dryRunInProgress,
  ]);

  // we should parse before any request to start dry run is gone. First check
  // whether all versions have a lastParseRun, if no, first send a parse
  // request for those versions and expect to get back only failed versions and status
  // success. Set lastParseRun and lastRun of versions according to parse status (those received as failed
  // and those not received as passed). If there was a lastParseRun with all versions,
  // just verify there is no error.
  useEffect(() => {
    if (
      !(
        versionIds &&
        !versionIdsInSaveProgress.length &&
        !dryRunInProgress &&
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
    versionsParseOngoingRef.current = true; // don't reset from here, it is used once per dry run
    // and reset on dry run start.
    fillLastParseStatusAndGetFailed(versionIdsNoParseStatus, dispatch)
      .then() // no action when parsed, next effect will check results.
      .catch((error) => {
        completeOnError(error.message);
      });
    setStatusMsg(getInfoTypeStatusMsg('Parsing...')); // next effect will overwrite this
    // once all are parsed.
  }, [
    completeOnError,
    completed,
    dispatch,
    dryRunInProgress,
    etVersions,
    getInfoTypeStatusMsg,
    versionIds,
    versionIdsInSaveProgress,
  ]);

  // Check whether any test has parse errors, if so we should halt entire dry run
  // and also reset dry state together with dryRun.
  useEffect(() => {
    if (
      !(
        versionIds &&
        !versionIdsInSaveProgress.length &&
        !dryRunInProgress &&
        !completed &&
        versionsHaveLastParseStatus(etVersions, versionIds)
      )
    ) {
      return;
    }
    // console.log('check parse errors');
    if (versionsHaveParseErrorWhenStatusAvailable(etVersions, versionIds)) {
      completeOnError(
        "Can't start dry run, there are parse errors in some of selected test(s)"
      );
      return;
    }
    setStatusMsg(getInfoTypeStatusMsg('Parsing succeeded'));
  }, [
    dryRunInProgress,
    completeOnError,
    completed,
    etVersions,
    versionIds,
    versionIdsInSaveProgress,
    getInfoTypeStatusMsg,
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

  // assign to expanded nodes state to expand all nodes on dry run start
  useEffect(() => {
    if (dryRun && !expandNodesBeginningRef.current) {
      // console.log('assign to expanded nodes dry start: inside');
      expandNodesBeginningRef.current = true;
      expandAllNodes();
    }
  }, [dryRun, expandNodesBeginningRef, expandAllNodes]);

  // assign to expanded nodes state to expand all nodes on dry end
  useEffect(() => {
    if (completed) {
      // console.log('assign to expanded nodes dry end: inside');
      expandAllNodes();
    }
  }, [completed, expandAllNodes]);

  // assign to selected node state when a version's turn comes
  useEffect(() => {
    if (executingVersionId && !didUserSelectNodeRef.current) {
      // console.log('on executing select node: inside');
      setSelected(getNodeId(VERSION, executingVersionId));
    }
  }, [executingVersionId]);

  // when run completes, select the top node
  useEffect(() => {
    if (completed && !didUserSelectNodeRef.current) {
      // console.log('on complete select top node: inside');
      setSelected(getNodeId(TOP_NODE, TOP_NODE_ID));
    }
  }, [completed]);

  // check whether dry run started.
  useEffect(() => {
    if (!(dryRunOngoing && dryRunInProgress)) {
      return;
    }
    // console.log('dry run started');
    setStatusMsg(getInfoTypeStatusMsg('Starting dry run...'));
  }, [dryRunInProgress, dryRunOngoing, getInfoTypeStatusMsg]);

  // set stopping status
  useEffect(() => {
    if (!dry.stopping) {
      return;
    }
    // console.log('set stop status: inside');
    setStatusMsg(getInfoTypeStatusMsg('Attempting to stop dry run...'));
  }, [dry.stopping, getInfoTypeStatusMsg]);

  // show dryRun error whenever it changes
  useEffect(() => {
    if (dryRunError) {
      // console.log('set dryRun error: inside');
      setStatusMsg(getErrorTypeStatusMsg(dryRunError));
    }
  }, [dryRunError, getErrorTypeStatusMsg]);

  const handleSelect = (e, nodeId) => {
    didUserSelectNodeRef.current = true;
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
  const stopMark = useMemo(
    () => (
      <StopIcon
        titleAccess="Stopped"
        className={clsx(classes.neutral, classes.testStatusIcon)}
      />
    ),
    [classes.neutral, classes.testStatusIcon]
  );
  const yetToRunMark = useMemo(
    () => (
      <YetToRunIcon
        titleAccess="Yet To Run"
        className={clsx(classes.neutral, classes.testStatusIcon)}
      />
    ),
    [classes.neutral, classes.testStatusIcon]
  );
  const runningMark = useMemo(
    () => (
      <CircularProgress
        size={theme.spacing(2)}
        className={clsx(classes.neutral, classes.testStatusRunningIcon)}
      />
    ),
    [classes.neutral, classes.testStatusRunningIcon, theme]
  );

  const getIconPerStatus = useCallback(
    (testStatus) => {
      switch (testStatus) {
        case TestStatus.RUNNING:
          return runningMark;
        case TestStatus.SUCCESS:
          return successMark;
        case TestStatus.ERROR:
          return failureMark;
        case TestStatus.STOPPED:
          return stopMark;
        case YET_TO_RUN:
          return yetToRunMark;
        default:
          throw new Error(`Unrecognized status ${testStatus}`);
      }
    },
    [failureMark, runningMark, stopMark, successMark, yetToRunMark]
  );

  const getDeducedStatusOfVersionGroup = useCallback(
    (_versionIds_) => {
      const {dryRunVersions} = dryRun;
      const drvs = _versionIds_.map((vid) => dryRunVersions[vid]);
      /*
    In the order of priority, ordering of statements matter.
    - When all drvs have null status, we set a yet to run.
    - When any is running or not yet run, group status is running as we can't
      deduce a final status unless all have run.
    - When all succeeded, status is success
    - When any has error, group status is error even if some were aborted after
      error as error status has greater priority than any other status.
    - stop and abort...
    */
      if (drvs.every((drv) => !drv.status)) {
        return YET_TO_RUN;
      }
      if (
        drvs.some((drv) => !drv.status || drv.status === TestStatus.RUNNING)
      ) {
        return TestStatus.RUNNING;
      }
      if (drvs.every((drv) => drv.status === TestStatus.SUCCESS)) {
        return TestStatus.SUCCESS;
      }
      if (drvs.some((drv) => drv.status === TestStatus.ERROR)) {
        return TestStatus.ERROR;
      }
      if (drvs.some((drv) => drv.status === TestStatus.STOPPED)) {
        return TestStatus.STOPPED;
      }
      throw new Error("Couldn't deduce a status");
    },
    [dryRun]
  );

  const getAllVersionIdsByType = useCallback(
    (itemType, itemId) => {
      switch (itemType) {
        case TOP_NODE: {
          return versionIds;
        }
        case FILE:
          return etFiles[itemId].tests
            .filter((tid) => testIds.indexOf(tid) >= 0)
            .map((tid) =>
              etTests[tid].versions.filter(
                (vid) => versionIds.indexOf(vid) >= 0
              )
            )
            .flat();
        case TEST:
          return etTests[itemId].versions.filter(
            (vid) => versionIds.indexOf(vid) >= 0
          );
        default:
          throw new Error(`Can't retrieve versionIds array for ${itemType}`);
      }
    },
    [etFiles, etTests, testIds, versionIds]
  );

  const getStatusByType = useCallback(
    (itemType, itemId) => {
      if (!dryRunInProgress && !completed) {
        // nothing started yet irrelevant to type
        return YET_TO_RUN;
      }
      const {dryRunVersions} = dryRun;
      if (itemType === TOP_NODE && !completed) {
        return TestStatus.RUNNING;
      }
      if (itemType === TOP_NODE && completed && dryRunError) {
        return TestStatus.ERROR;
      }
      if (itemType === VERSION) {
        const {status} = dryRunVersions[itemId];
        if (!status) {
          return YET_TO_RUN;
        }
        return status;
      }
      return getDeducedStatusOfVersionGroup(
        getAllVersionIdsByType(itemType, itemId)
      );
    },
    [
      dryRun,
      dryRunError,
      completed,
      getAllVersionIdsByType,
      getDeducedStatusOfVersionGroup,
      dryRunInProgress,
    ]
  );

  const getTopNodeText = () => {
    let text;
    if (!dryRunInProgress && !completed) {
      text = 'Waiting for dry run to begin...';
    } else if (!completed) {
      text = 'Running dry run..';
    } else {
      text = 'Dry run Results';
    }
    return text;
  };

  const getStatusIcon = useCallback(
    (itemType, itemId) => {
      const status = getStatusByType(itemType, itemId);
      return getIconPerStatus(status);
    },
    [getIconPerStatus, getStatusByType]
  );

  const getTimeSpentText = useCallback(
    (itemType, itemId) => {
      if (!dryRunInProgress && !completed) {
        // nothing started yet irrelevant to type
        return '';
      }
      const {dryRunVersions} = dryRun;
      if (itemType === VERSION) {
        const {timeTaken} = dryRunVersions[itemId];
        if (!timeTaken) {
          return '';
        }
        return convertMillisIntoTimeText(timeTaken);
      }
      const vids = getAllVersionIdsByType(itemType, itemId);
      const totalTime = vids.reduce(
        (total, vid) => total + dryRunVersions[vid].timeTaken ?? 0,
        0
      );
      if (totalTime === 0) {
        return '';
      }
      return convertMillisIntoTimeText(totalTime);
    },
    [dryRun, completed, getAllVersionIdsByType, dryRunInProgress]
  );

  const getRunProgress = () => {
    if (!allDryRunVersions) {
      return 0;
    }
    const done = allDryRunVersions.filter(
      (drv) => drv.status && drv.status !== TestStatus.RUNNING
    ).length;
    if (done === 0) {
      return 0;
    }
    const total = allDryRunVersions.length;
    return Math.round((done / total) * 100);
  };

  const getRunStatus = useCallback(() => {
    if (!allDryRunVersions) {
      return '';
    }
    const passed = allDryRunVersions.filter(
      (drv) => drv.status === TestStatus.SUCCESS
    ).length;
    const failed = allDryRunVersions.filter(
      (drv) => drv.status === TestStatus.ERROR
    ).length;
    const total = allDryRunVersions.length;
    return (
      <>
        {failed ? (
          <Typography
            variant="body2"
            className={clsx(classes.statusMsg, classes.error)}>
            Dry run failed: {failed}
          </Typography>
        ) : null}
        <Typography variant="body2" className={classes.statusMsg}>
          {failed ? `, passed: ${passed}` : `Dry run passed: ${passed}`}
        </Typography>
        <Typography
          variant="body2"
          className={clsx(
            classes.statusMsg,
            classes.greyText,
            classes.whitespace
          )}>
          of {total} dry runs
        </Typography>
      </>
    );
  }, [
    classes.error,
    classes.statusMsg,
    classes.greyText,
    classes.whitespace,
    allDryRunVersions,
  ]);

  const getRunCompleteStatus = useCallback(() => {
    const text = getRunStatus();
    if (!text) {
      return '';
    }
    return (
      <>
        {getStatusIcon(TOP_NODE, TOP_NODE_ID)}
        {text}
        <Typography
          variant="body2"
          className={clsx(
            classes.statusMsg,
            classes.greyText,
            classes.whitespace
          )}>
          - {getTimeSpentText(TOP_NODE, TOP_NODE_ID)}
        </Typography>
      </>
    );
  }, [
    classes.greyText,
    classes.statusMsg,
    getRunStatus,
    classes.whitespace,
    getStatusIcon,
    getTimeSpentText,
  ]);

  // show dry run status as status message while dry is running
  useEffect(() => {
    if (
      !dryRunInProgress ||
      !executingVersionId ||
      dryRunError ||
      dry.stopping
    ) {
      return;
    }
    // console.log('getRunStatus run: inside');
    setStatusMsg(getRunStatus());
  }, [
    dryRunError,
    dryRunInProgress,
    getRunStatus,
    dry.stopping,
    executingVersionId,
  ]);

  // show dry run status as status message when dry is completed
  useEffect(() => {
    if (!completed || dryRunError) {
      return;
    }
    // console.log('getRunCompleteStatus run: inside');
    setStatusMsg(getRunCompleteStatus());
  }, [completed, dryRunError, getRunCompleteStatus]);

  const handleRerun = () => {
    dispatch({
      type: DRY_START_RUN,
      payload: {versionIds},
    });
  };

  const handleRunFailed = () => {
    // console.log(allDryRunVersions);
    dispatch({
      type: DRY_START_RUN,
      payload: {
        versionIds: allDryRunVersions
          .filter((drv) => drv.status === TestStatus.ERROR)
          .map((drv) => drv.versionId),
      },
    });
  };

  const handleStop = () => {
    dispatch(getDryStoppingAction(true));
  };

  const getSelectedNodeVersionIds = () => {
    if (!selected) {
      return [];
    }
    const {itemType, itemId} = getBrokenNodeId(selected);
    if (itemType === VERSION) {
      return [itemId];
    }
    return getAllVersionIdsByType(itemType, itemId);
  };

  return (
    <SplitPane
      split="vertical"
      defaultSize="30%"
      style={{position: 'relative'}}
      pane1Style={{minWidth: '10%', maxWidth: '40%'}}
      pane2Style={{overflow: 'auto'}}>
      <Box display="flex" flexDirection="column" className={classes.root}>
        <Box
          display="flex"
          alignItems="center"
          className={classes.header}
          boxShadow={1}>
          {dryRun && completed ? (
            <>
              <Tooltip title="Rerun">
                <span>
                  <IconButton
                    aria-label="Rerun"
                    className={classes.iconDryActions}
                    onClick={handleRerun}>
                    <CheckCircleIcon
                      fontSize="small"
                      className={classes.rerun}
                      classes={{fontSizeSmall: classes.fontSizeSmall}}
                    />
                  </IconButton>
                </span>
              </Tooltip>
              {versionIds.some(
                (vid) => dryRun.dryRunVersions[vid].status === TestStatus.ERROR
              ) ? (
                <Tooltip title="Run Failed">
                  <span>
                    <IconButton
                      aria-label="Run Failed"
                      className={classes.iconDryActions}
                      onClick={handleRunFailed}>
                      <CheckCircleIcon
                        color="error"
                        fontSize="small"
                        classes={{fontSizeSmall: classes.fontSizeSmall}}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : null}
            </>
          ) : null}
          {dryRun && !completed && dryRunInProgress ? (
            <Tooltip title="Stop">
              <span>
                <IconButton
                  aria-label="Stop"
                  className={classes.iconDryActions}
                  onClick={handleStop}
                  disabled={dry.stopping}>
                  <StopIcon
                    color={dry.stopping ? 'disabled' : 'error'}
                    fontSize="small"
                  />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>
        <Box px={1} my={1} flex={1} className={classes.statusPanelContent}>
          {dryRun && fileIds.length ? (
            <TreeView
              className={classes.tree}
              expanded={expanded}
              selected={selected}
              onNodeToggle={handleToggle}
              onNodeSelect={handleSelect}
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              id="dryRun">
              <StyledTreeItem
                nodeId={getNodeId(TOP_NODE, TOP_NODE_ID)}
                label={
                  <Box className={classes.itemContainer}>
                    {getStatusIcon(TOP_NODE, TOP_NODE_ID)}
                    <Box className={classes.itemTextContainer}>
                      <Typography variant="body2" className={classes.itemFont}>
                        {getTopNodeText()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" className={classes.timeText}>
                        {getTimeSpentText(TOP_NODE, TOP_NODE_ID)}
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
                        {getStatusIcon(FILE, fid)}
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
                        <Box>
                          <Typography
                            variant="body2"
                            className={classes.timeText}>
                            {getTimeSpentText(FILE, fid)}
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
                              {getStatusIcon(TEST, tid)}
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
                              <Box>
                                <Typography
                                  variant="body2"
                                  className={classes.timeText}>
                                  {getTimeSpentText(TEST, tid)}
                                </Typography>
                              </Box>
                            </Box>
                          }>
                          {etTests[tid].versions
                            .filter((vid) => versionIds.indexOf(vid) >= 0)
                            .map((vid) => (
                              <StyledTreeItem
                                nodeId={getNodeId(VERSION, vid)}
                                key={vid}
                                label={
                                  <Box className={classes.itemContainer}>
                                    {getStatusIcon(VERSION, vid)}
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
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        className={classes.timeText}>
                                        {getTimeSpentText(VERSION, vid)}
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
        {dryRunInProgress && executingVersionId && !completed ? (
          <Box width="100%">
            <LinearProgress
              color="secondary"
              variant="determinate"
              value={getRunProgress()}
            />
          </Box>
        ) : null}
        <Box className={classes.outputPanelContent} flex={1}>
          {getSelectedNodeVersionIds().map((vid) => (
            <Box display="flex" flexDirection="column" px={1} key={vid}>
              <pre className={classes.output}>
                {dryRun.dryRunVersions[vid].output}
              </pre>
              <pre className={clsx(classes.output, classes.outputError)}>
                {dryRun.dryRunVersions[vid].error
                  ? dryRun.dryRunVersions[vid].error.msg
                  : ''}
              </pre>
            </Box>
          ))}
        </Box>
      </Box>
    </SplitPane>
  );
};

DryRun.propTypes = {
  closeHandler: PropTypes.func.isRequired,
};

export default DryRun;

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
import AbortedIcon from '@material-ui/icons/NotInterested';
import YetToRunIcon from '@material-ui/icons/FiberManualRecord';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import ErrorIcon from '@material-ui/icons/Error';
import Typography from '@material-ui/core/Typography';
import {makeStyles, withStyles, useTheme} from '@material-ui/core/styles';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import clsx from 'clsx';
import {findLastIndex, intersection} from 'lodash-es';
import Tooltip from '../TooltipCustom';
import {getNoOfLines} from '../common';
import {getNodeId, getBrokenNodeId} from './Explorer/internal';
import {
  IdeDispatchContext,
  IdeBuildRunOngoingContext,
  IdeBuildContext,
  IdeBuildRunContext,
  IdeFilesContext,
  IdeVersionIdsCodeSaveInProgressContext,
} from './Contexts';
import {RUN_BUILD_ON_NEW_RUN, RUN_BUILD_COMPLETE_ON_ERROR} from './actionTypes';
import {BUILD_NEW_RUN, BUILD_COMPLETE_RUN} from '../actions/actionTypes';
import {MaxLengths, ExplorerItemType} from './Constants';
import {TestStatus} from '../Constants';
import batchActions from './actionCreators';
import {getBuildStoppingAction} from '../actions/actionCreators';
import {
  versionsHaveParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
  getVersionsNoParseStatus,
  fillLastParseStatusAndGetFailed,
  convertMillisIntoTimeText,
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
  iconBuildActions: {
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

const BuildRun = ({closeHandler}) => {
  const dispatch = useContext(IdeDispatchContext);
  const buildRunOngoing = useContext(IdeBuildRunOngoingContext);
  const files = useContext(IdeFilesContext);
  const etFiles = files.entities.files;
  const etTests = files.entities.tests;
  const etVersions = files.entities.versions;
  const build = useContext(IdeBuildContext);
  const buildRun = useContext(IdeBuildRunContext);
  const allVersionIdsInSaveProgress = useContext(
    IdeVersionIdsCodeSaveInProgressContext
  );
  const [sessionCheckIntervalId, setSessionCheckIntervalId] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState(null);
  const [versionsParseSucceeded, setVersionsParseSucceeded] = useState(false);
  const allBuildRunVersions = useMemo(
    () =>
      buildRun === null
        ? null
        : buildRun.versionIds.map((vid) => buildRun.buildRunVersions[vid]),
    [buildRun]
  );
  const executingVersionId = useMemo(() => {
    if (!allBuildRunVersions) {
      return null;
    }
    // get the first brv starting backwards that is non null, this will always
    // give latest non null entry, if we start from beginning, the first one
    // will always return.
    const lastIndex = findLastIndex(allBuildRunVersions, (brv) => brv.status);
    return lastIndex >= 0 ? allBuildRunVersions[lastIndex].versionId : null;
  }, [allBuildRunVersions]);
  // if user selects a node, don't auto select on 'Running' status change.
  const didUserSelectNodeRef = useRef(false);
  const expandNodesBeginningRef = useRef(false);
  const sessionRequestTimeRef = useRef(null);
  const versionsParseOngoingRef = useRef(false);
  sessionRequestTimeRef.current = build.sessionRequestTime;
  const completed = buildRun === null ? false : buildRun.completed;
  const buildRunError = buildRun === null ? null : buildRun.error;
  const buildRunInterval =
    buildRun === null ? null : buildRun.testProgressIntervalId;
  const classes = useStyles();
  const theme = useTheme();

  const getTreeFilterData = useCallback(() => {
    if (!buildRun) {
      return {fileIds: null, testIds: null, versionIds: null};
    }
    // never use buildRun keys for getting vids because it will give string keys.
    const vids = buildRun.versionIds;
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
  }, [buildRun, etTests, etVersions]);

  // This will recalculate on every change in buildRun, this can't be avoided
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

  // assign to buildRun on new build
  useEffect(() => {
    if (!buildRunOngoing) {
      return;
    }
    if (buildRun && build.runId === buildRun.runId) {
      return; // already created buildRun instance for this run
    }
    // console.log('assign to buildRun on new build: inside');
    // reset refs as this runs on new builds only (before dispatching)
    didUserSelectNodeRef.current = false;
    expandNodesBeginningRef.current = false;
    sessionRequestTimeRef.current = null;
    setVersionsParseSucceeded(false);
    versionsParseOngoingRef.current = false;
    dispatch({
      type: RUN_BUILD_ON_NEW_RUN,
    });
  }, [build.runId, buildRun, buildRunOngoing, dispatch]);

  const completeOnError = useCallback(
    (error) => {
      dispatch(
        batchActions([
          {
            type: BUILD_COMPLETE_RUN,
          },
          {
            type: RUN_BUILD_COMPLETE_ON_ERROR,
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
        !buildRunInterval &&
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
    buildRunInterval,
  ]);

  // we should parse before any request to start session is gone. First check
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
        !buildRunInterval &&
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
        completeOnError(`Can't start build, ${error.message}`);
      });
    setStatusMsg(getInfoTypeStatusMsg('Parsing...')); // next effect will overwrite this
    // once all are parsed.
  }, [
    completeOnError,
    completed,
    dispatch,
    buildRunInterval,
    etVersions,
    getInfoTypeStatusMsg,
    versionIds,
    versionIdsInSaveProgress,
  ]);

  // Check whether any test has parse errors, if so we should halt entire build
  // and also reset build state together with buildRun.
  useEffect(() => {
    if (
      !(
        versionIds &&
        !versionIdsInSaveProgress.length &&
        !buildRunInterval &&
        !completed &&
        versionsHaveLastParseStatus(etVersions, versionIds)
      )
    ) {
      return;
    }
    // console.log('check parse errors');
    // !! This is checked in IDE's effect too when proceeding to create new
    // session, session request doesn't begin if this is true.
    if (versionsHaveParseErrorWhenStatusAvailable(etVersions, versionIds)) {
      completeOnError(
        "Can't start build, there are parse errors in some of selected test(s)"
      );
      return;
    }
    setStatusMsg(getInfoTypeStatusMsg('Parsing succeeded'));
    setVersionsParseSucceeded(true);
  }, [
    buildRunInterval,
    completeOnError,
    completed,
    etVersions,
    versionIds,
    getInfoTypeStatusMsg,
    versionIdsInSaveProgress,
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

  // assign to expanded nodes state to expand all nodes on build start
  useEffect(() => {
    if (buildRun && !expandNodesBeginningRef.current) {
      // console.log('assign to expanded nodes build start: inside');
      expandNodesBeginningRef.current = true;
      expandAllNodes();
    }
  }, [buildRun, expandNodesBeginningRef, expandAllNodes]);

  // assign to expanded nodes state to expand all nodes on build end
  useEffect(() => {
    if (completed) {
      // console.log('assign to expanded nodes build end: inside');
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

  // create session check interval when session is not yet received, interval
  // shows a progress of connecting with machine
  useEffect(() => {
    if (
      buildRunOngoing &&
      !completed &&
      !build.sessionId &&
      !sessionCheckIntervalId &&
      versionsParseSucceeded
    ) {
      // console.log('session interval creating');
      const intervalId = setInterval(() => {
        // console.log('session interval running');
        // this interval regularly checks the time elapsed and prints some text
        // to keep user engaged. Once session result is received it has to be
        // cleared to stop the status prints.
        let msg;
        if (
          !sessionRequestTimeRef.current ||
          Date.now() - sessionRequestTimeRef.current <
            MaxLengths.IDE_TEST_HOST_ACQUIRE_TIME_STAGE1
        ) {
          msg =
            'Searching and connecting to a running machine for this build. It may' +
            ' take a few seconds...';
        } else if (
          Date.now() - sessionRequestTimeRef.current <
          MaxLengths.IDE_TEST_HOST_ACQUIRE_TIME_STAGE2
        ) {
          msg =
            "Hmm, it's taking more than expected. Machine should be up in a few more seconds...";
        } else {
          msg =
            'A new machine is getting up as no running machine was available. It' +
            " doesn't always happen. Please bear with us for a few more seconds...";
        }
        setStatusMsg(getInfoTypeStatusMsg(msg)); // when msg is same as previous, state won't update.
      }, 1000);
      setSessionCheckIntervalId(intervalId);
    }
    return () => {
      if (sessionCheckIntervalId) {
        // console.log('cleanup effect runs');
        clearInterval(sessionCheckIntervalId);
        setSessionCheckIntervalId(null);
      }
    };
  }, [
    build.sessionId,
    completed,
    buildRunOngoing,
    getInfoTypeStatusMsg,
    sessionCheckIntervalId,
    versionsParseSucceeded,
  ]);

  // check whether new session received, clear session interval if so.
  useEffect(() => {
    if (!(buildRunOngoing && build.sessionId && sessionCheckIntervalId)) {
      return;
    }
    // console.log('session created, session interval cleared');
    clearInterval(sessionCheckIntervalId);
    setSessionCheckIntervalId(null);
    setStatusMsg(
      getInfoTypeStatusMsg('Connected to build machine, starting tests...')
    );
  }, [
    build.sessionError,
    build.sessionId,
    buildRunOngoing,
    getInfoTypeStatusMsg,
    sessionCheckIntervalId,
  ]);

  // if some error occurs before session is created, clear the session check interval
  useEffect(() => {
    if (
      !(
        sessionCheckIntervalId &&
        (build.sessionError || buildRunError) &&
        !buildRunOngoing
      )
    ) {
      return;
    }
    // console.log('session interval cleared after error');
    clearInterval(sessionCheckIntervalId);
    setSessionCheckIntervalId(null);
    // status messages is shown later in effect that checks on buildRunError
  }, [
    build.sessionError,
    buildRunError,
    buildRunOngoing,
    sessionCheckIntervalId,
  ]);

  // set stopping status, after stop is done, build completes and IDE's effect
  // set build to complete when te status will change to complete.
  useEffect(() => {
    if (!build.stopping) {
      return;
    }
    // console.log('set stop status: inside');
    setStatusMsg(getInfoTypeStatusMsg('Attempting to stop the build...'));
  }, [build.stopping, getInfoTypeStatusMsg]);

  // show buildRun error whenever it changes
  useEffect(() => {
    if (buildRunError) {
      // console.log('set buildRun error: inside');
      setStatusMsg(getErrorTypeStatusMsg(buildRunError));
    }
  }, [buildRunError, getErrorTypeStatusMsg]);

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
  const abortMark = useMemo(
    () => (
      <AbortedIcon
        titleAccess="Aborted"
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
        case TestStatus.ABORTED:
          return abortMark;
        case TestStatus.STOPPED:
          return stopMark;
        case YET_TO_RUN:
          return yetToRunMark;
        default:
          throw new Error(`Unrecognized status ${testStatus}`);
      }
    },
    [abortMark, failureMark, runningMark, stopMark, successMark, yetToRunMark]
  );

  const getVersionIconRunningStatus = useCallback(
    (versionId) => {
      const {currentLine} = buildRun.buildRunVersions[versionId];
      if (!currentLine || currentLine < 1) {
        return runningMark;
      }
      const totalLines = getNoOfLines(etVersions[versionId].code);
      // console.log(`current line ${currentLine}`);
      // console.log(`total line ${totalLines}`);
      if (currentLine > totalLines) {
        throw new Error('current line can not be greater than total lines');
      }
      return (
        <CircularProgress
          variant="static"
          size={theme.spacing(2)}
          value={Math.round((currentLine / totalLines) * 100)}
          className={classes.testStatusRunningIcon}
          color="secondary"
        />
      );
    },
    [buildRun, classes.testStatusRunningIcon, etVersions, runningMark, theme]
  );

  const getDeducedStatusOfVersionGroup = useCallback(
    (_versionIds_) => {
      const {buildRunVersions} = buildRun;
      const brvs = _versionIds_.map((vid) => buildRunVersions[vid]);
      /*
    In the order of priority, ordering of statements matter.
    - When all brvs have null status, we send a yet to run.
    - When any is running or not yet run, group status is running as we can't
      deduce a final status unless all have run.
    - When all succeeded, status is success
    - When any has error, group status is error even if some were aborted after
      error as error status has greater priority than any other status.
    - stop and abort...
    */
      if (brvs.every((brv) => !brv.status)) {
        return YET_TO_RUN;
      }
      if (
        brvs.some((brv) => !brv.status || brv.status === TestStatus.RUNNING)
      ) {
        return TestStatus.RUNNING;
      }
      if (brvs.every((brv) => brv.status === TestStatus.SUCCESS)) {
        return TestStatus.SUCCESS;
      }
      if (brvs.some((brv) => brv.status === TestStatus.ERROR)) {
        return TestStatus.ERROR;
      }
      if (brvs.some((brv) => brv.status === TestStatus.STOPPED)) {
        return TestStatus.STOPPED;
      }
      if (brvs.some((brv) => brv.status === TestStatus.ABORTED)) {
        return TestStatus.ABORTED;
      }
      throw new Error("Couldn't deduce a status");
    },
    [buildRun]
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
      if (!buildRunInterval && !completed) {
        // nothing started yet irrelevant to type
        return YET_TO_RUN;
      }
      const {buildRunVersions} = buildRun;
      if (itemType === TOP_NODE && !completed) {
        return TestStatus.RUNNING;
      }
      if (itemType === VERSION) {
        const {status} = buildRunVersions[itemId];
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
      buildRun,
      completed,
      getAllVersionIdsByType,
      getDeducedStatusOfVersionGroup,
      buildRunInterval,
    ]
  );

  const getTopNodeText = () => {
    let text;
    if (!buildRunInterval && !completed) {
      text = 'Waiting for build to begin...';
    } else if (!completed) {
      text = 'Running build..';
    } else {
      text = 'Build Results';
    }
    return text;
  };

  const getStatusIcon = useCallback(
    (itemType, itemId) => {
      const status = getStatusByType(itemType, itemId);
      if (itemType === VERSION && status === TestStatus.RUNNING) {
        return getVersionIconRunningStatus(itemId);
      }
      return getIconPerStatus(status);
    },
    [getIconPerStatus, getStatusByType, getVersionIconRunningStatus]
  );

  const getTimeSpentText = useCallback(
    (itemType, itemId) => {
      if (!buildRunInterval && !completed) {
        // nothing started yet irrelevant to type
        return '';
      }
      const {buildRunVersions} = buildRun;
      if (itemType === VERSION) {
        const {timeTaken} = buildRunVersions[itemId];
        if (!timeTaken) {
          return '';
        }
        return convertMillisIntoTimeText(timeTaken);
      }
      const vids = getAllVersionIdsByType(itemType, itemId);
      const totalTime = vids.reduce(
        (total, vid) => total + buildRunVersions[vid].timeTaken ?? 0,
        0
      );
      if (totalTime === 0) {
        return '';
      }
      return convertMillisIntoTimeText(totalTime);
    },
    [buildRun, completed, getAllVersionIdsByType, buildRunInterval]
  );

  const getRunProgress = () => {
    if (!allBuildRunVersions) {
      return 0;
    }
    const done = allBuildRunVersions.filter(
      (brv) => brv.status && brv.status !== TestStatus.RUNNING
    ).length;
    if (done === 0) {
      return 0;
    }
    const total = allBuildRunVersions.length;
    return Math.round((done / total) * 100);
  };

  const getRunStatus = useCallback(() => {
    if (!allBuildRunVersions) {
      return '';
    }
    const passed = allBuildRunVersions.filter(
      (brv) => brv.status === TestStatus.SUCCESS
    ).length;
    const failed = allBuildRunVersions.filter(
      (brv) => brv.status === TestStatus.ERROR
    ).length;
    const total = allBuildRunVersions.length;
    return (
      <>
        {failed ? (
          <Typography
            variant="body2"
            className={clsx(classes.statusMsg, classes.error)}>
            Tests failed: {failed}
          </Typography>
        ) : null}
        <Typography variant="body2" className={classes.statusMsg}>
          {failed ? `, passed: ${passed}` : `Tests passed: ${passed}`}
        </Typography>
        <Typography
          variant="body2"
          className={clsx(
            classes.statusMsg,
            classes.greyText,
            classes.whitespace
          )}>
          of {total} tests
        </Typography>
      </>
    );
  }, [
    classes.error,
    classes.statusMsg,
    classes.greyText,
    classes.whitespace,
    allBuildRunVersions,
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

  // show build run status as status message while build is running
  useEffect(() => {
    if (
      !buildRunInterval ||
      !executingVersionId ||
      buildRunError ||
      build.stopping
    ) {
      return;
    }
    // console.log('getRunStatus run: inside');
    setStatusMsg(getRunStatus());
  }, [
    buildRunError,
    buildRunInterval,
    getRunStatus,
    build.stopping,
    executingVersionId,
  ]);

  // show build run status as status message when build is completed
  useEffect(() => {
    if (!completed || buildRunError) {
      return;
    }
    // console.log('getRunCompleteStatus run: inside');
    setStatusMsg(getRunCompleteStatus());
  }, [completed, buildRunError, getRunCompleteStatus]);

  const handleRerun = () => {
    dispatch({
      type: BUILD_NEW_RUN,
      payload: {versionIds, noBuildConfigIfValid: true},
    });
  };

  const handleRunFailed = () => {
    // console.log(allBuildRunVersions);
    dispatch({
      type: BUILD_NEW_RUN,
      payload: {
        versionIds: allBuildRunVersions
          .filter((brv) => brv.status === TestStatus.ERROR)
          .map((brv) => brv.versionId),
        noBuildConfigIfValid: true,
      },
    });
  };

  const handleStop = () => {
    dispatch(getBuildStoppingAction(true));
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
      pane1Style={{minWidth: '10%', maxWidth: '40%'}}>
      <Box display="flex" flexDirection="column" className={classes.root}>
        <Box
          display="flex"
          alignItems="center"
          className={classes.header}
          boxShadow={1}>
          {buildRun && completed ? (
            <>
              <Tooltip title="Rerun">
                <span>
                  <IconButton
                    aria-label="Rerun"
                    className={classes.iconBuildActions}
                    onClick={handleRerun}>
                    <PlayArrowIcon fontSize="small" className={classes.rerun} />
                  </IconButton>
                </span>
              </Tooltip>
              {versionIds.some(
                (vid) =>
                  buildRun.buildRunVersions[vid].status === TestStatus.ERROR
              ) ? (
                <Tooltip title="Run Failed">
                  <span>
                    <IconButton
                      aria-label="Run Failed"
                      className={classes.iconBuildActions}
                      onClick={handleRunFailed}>
                      <PlayCircleFilledIcon
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
          {buildRun && !completed && buildRunInterval ? (
            <Tooltip title="Stop">
              <span>
                <IconButton
                  aria-label="Stop"
                  className={classes.iconBuildActions}
                  onClick={handleStop}
                  disabled={build.stopping}>
                  <StopIcon
                    color={build.stopping ? 'disabled' : 'error'}
                    fontSize="small"
                  />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>
        <Box px={1} my={1} flex={1} className={classes.statusPanelContent}>
          {buildRun && fileIds.length ? (
            <TreeView
              className={classes.tree}
              expanded={expanded}
              selected={selected}
              onNodeToggle={handleToggle}
              onNodeSelect={handleSelect}
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              id="buildRun">
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
        {buildRunInterval && executingVersionId && !completed ? (
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
                {buildRun.buildRunVersions[vid].output}
              </pre>
              <pre className={clsx(classes.output, classes.outputError)}>
                {buildRun.buildRunVersions[vid].error
                  ? buildRun.buildRunVersions[vid].error.msg
                  : ''}
              </pre>
            </Box>
          ))}
        </Box>
      </Box>
    </SplitPane>
  );
};

BuildRun.propTypes = {
  closeHandler: PropTypes.func.isRequired,
};

export default BuildRun;

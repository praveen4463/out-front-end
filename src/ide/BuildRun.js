import React, {useState, useContext, useEffect} from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
import StopIcon from '@material-ui/icons/Stop';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import clsx from 'clsx';
import Tooltip from '../TooltipCustom';
import {
  IdeDispatchContext,
  IdeBuildRunOngoingContext,
  IdeBuildContext,
  IdeBuildRunContext,
} from './Contexts';
import {RUN_BUILD_ON_NEW_RUN} from './actionTypes';
import {MaxLengths} from './Constants';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
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
    height: theme.spacing(3),
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
  fontSizeSmall: {
    fontSize: '1rem',
  },
  iconNoHover: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
}));

const BuildRun = ({closeButton}) => {
  const dispatch = useContext(IdeDispatchContext);
  const buildRunOngoing = useContext(IdeBuildRunOngoingContext);
  const build = useContext(IdeBuildContext);
  const buildRun = useContext(IdeBuildRunContext);
  const [sessionCheckIntervalId, setSessionCheckIntervalId] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const classes = useStyles();

  // assign to buildRun on new build
  useEffect(() => {
    if (!buildRunOngoing) {
      return;
    }
    if (buildRun && build.runId === buildRun.runId) {
      return; // already created buildRun instance for this run
    }
    dispatch({
      type: RUN_BUILD_ON_NEW_RUN,
    });
  }, [build.runId, buildRun, buildRunOngoing, dispatch]);

  // after new run request, show user a status progress of connecting with machine
  // until new session is received
  useEffect(() => {
    if (build.sessionId) {
      if (!sessionCheckIntervalId) {
        // session is received while user had output panel closed, don't show status
        // about session acquired (we might have got test progress too)
        return;
      }
      // session is received while user had output panel opened
      clearInterval(sessionCheckIntervalId);
      setSessionCheckIntervalId(null);
      setStatusMsg('Connected to test machine, starting test...');
      return;
    }
    // session error is always shown even if panel is opened after it occurred
    // or user had it opened, it will be reset once a new build is triggered.
    if (build.sessionError) {
      if (sessionCheckIntervalId) {
        clearInterval(sessionCheckIntervalId);
        setSessionCheckIntervalId(null);
      }
      setStatusMsg(build.sessionError);
      return;
    }
    // session not yet received, start session checker if not yet started
    if (sessionCheckIntervalId) {
      return;
    }
    const intervalId = setInterval(() => {
      // this interval regularly checks the time elapsed and prints some text
      // to keep user engaged. Once session result is received it has to be
      // cleared to stop the status prints.
      let msg;
      if (
        !build.sessionRequestTime ||
        Date.now - build.sessionRequestTime <
          MaxLengths.IDE_TEST_HOST_ACQUIRE_TIME_STAGE1
      ) {
        msg =
          'Searching and connecting to a running machine for this build. It may' +
          ' take a few seconds...';
      } else if (
        Date.now - build.sessionRequestTime <
        MaxLengths.IDE_TEST_HOST_ACQUIRE_TIME_STAGE2
      ) {
        msg =
          "Hmm, it's taking more than usual. It should be up in a few more seconds...";
      } else {
        msg =
          'A new machine is getting up as no running machine was available. It' +
          " doesn't always happen. Please bear with us for a few more seconds...";
      }
      setStatusMsg(msg); // when msg is same as previous, state won't update.
    }, 1000);
    setSessionCheckIntervalId(intervalId);
  }, [
    build.sessionError,
    build.sessionId,
    build.sessionRequestTime,
    sessionCheckIntervalId,
  ]);

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
          <Tooltip title="Rerun">
            <IconButton aria-label="Rerun" className={classes.iconNoHover}>
              <PlayArrowIcon fontSize="small" className={classes.rerun} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Run Failed">
            <IconButton aria-label="Run Failed" className={classes.iconNoHover}>
              <PlayCircleFilledIcon
                color="error"
                fontSize="small"
                classes={{fontSizeSmall: classes.fontSizeSmall}}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Stop">
            <IconButton aria-label="Stop" className={classes.iconNoHover}>
              <StopIcon color="error" fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box px={1} flex={1} className={classes.statusPanelContent}>
          <Typography variant="caption">Tree appears here</Typography>
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" className={classes.root}>
        <Box
          display="flex"
          alignItems="center"
          className={classes.header}
          boxShadow={1}
          pl={1}>
          <Box flex={1}>
            <Typography variant="caption">{statusMsg}</Typography>
          </Box>
          {closeButton}
        </Box>
        <Box
          className={classes.outputPanelContent}
          px={1}
          boxShadow={6}
          flex={1}>
          <pre className={classes.output}>
            Running command openUrl at line 4:10
          </pre>
          <pre className={clsx(classes.output, classes.outputError)}>
            ElementClickNotInterceptedException, Element is not clickable at
            80,89
          </pre>
        </Box>
      </Box>
    </SplitPane>
  );
};

BuildRun.propTypes = {
  closeButton: PropTypes.node.isRequired,
};

export default BuildRun;

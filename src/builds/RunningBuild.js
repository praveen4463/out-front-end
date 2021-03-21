import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import {makeStyles, useTheme} from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import TimerIcon from '@material-ui/icons/Timer';
import StopIcon from '@material-ui/icons/Stop';
import CloseIcon from '@material-ui/icons/Close';
import {useQuery} from 'react-query';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
  handleApiError,
  getBrowserIcon,
  getOsIcon,
  getTestStatusDisplayName,
  getLatestShotEndpoint,
  getStopBuildEndpoint,
} from '../common';
import {QueryKeys, TestStatus, Timeouts} from '../Constants';
import {BuildDialogState, RunningBuildObj} from '../model';
import {runningBuildSummaryFetch} from '../api/fetches';
import Loader from '../components/Loader';
import BuildStatusIcon from '../components/BuildStatusIcon';
import {
  convertMillisIntoTimeText,
  DlgOpenerType,
  getShotIdFromName,
  getTestResultPerStatus,
  YET_TO_RUN,
} from '../buildsCommon';
import Tooltip from '../TooltipCustom';
import BuildStatusIconSet from '../components/BuildStatusIconSet';
import TestVersionDetailsView from '../components/TestVersionDetailsView';
import TitleDialog from '../components/TitleDialog';
import BuildPagesDlgTitle from '../components/BuildPagesDlgTitle';
import BuildOutput from '../components/BuildOutput';
import ErrorMessageWithIcon from '../components/ErrorMessageWithIcon';
import LivePreview from '../components/LivePreview';
import {BuildsSnackbarContext} from '../contexts';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  bottomBorder: {
    borderBottom: `1px solid ${theme.palette.border.lightest}`,
  },
  statusIconBuild: {
    fontSize: '1.4rem',
  },
  mainStatusIcon: {
    fontSize: '2rem',
    marginRight: theme.spacing(1),
  },
  marginR1: {
    marginRight: theme.spacing(1),
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1000,
    padding: 0,
    color: theme.palette.primary.main,
  },
  separator: {
    margin: `0 ${theme.spacing(2)}px`,
  },
  button: {
    textTransform: 'none',
  },
}));

const getCurrentStatus = (rbs) => {
  if (!rbs?.sessionKey) {
    return YET_TO_RUN;
  }
  return rbs.finalStatus || TestStatus.RUNNING;
};

const RunningBuild = React.memo(({runningBuildObj: rb, removeHandler}) => {
  const [dlg, setDlg] = useState(new BuildDialogState());
  const [refetchInterval, setRefetchInterval] = useState(3500);
  const [stopping, setStopping] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [, setSnackbarAlertError] = useContext(BuildsSnackbarContext);
  const classes = useStyles();
  const theme = useTheme();
  const {buildId} = rb;
  const queryKey = useMemo(() => [QueryKeys.RUNNING_BUILD_SUMMARY, buildId], [
    buildId,
  ]);
  // data is instance of RunningBuildSummary
  const {data: rbs, error, isLoading} = useQuery(
    queryKey,
    runningBuildSummaryFetch,
    {
      refetchInterval,
    }
  );
  const currentStatus = getCurrentStatus(rbs);

  useEffect(() => {
    if (rbs?.allDone || rbs?.newSessionFail) {
      setShowClose(true);
      setRefetchInterval(false);
    }
  }, [rbs]);

  const closeBuild = () => {
    removeHandler(buildId);
  };

  const closeDlg = useCallback(() => {
    setDlg(() => new BuildDialogState());
  }, []);

  const getBuildStatusIconSet = (testVersionDetailsList) => {
    const {
      totalSuccess,
      totalError,
      totalStopped,
      totalAborted,
    } = getTestResultPerStatus(testVersionDetailsList);
    return (
      <BuildStatusIconSet
        totalSuccess={totalSuccess}
        totalError={totalError}
        totalStopped={totalStopped}
        totalAborted={totalAborted}
      />
    );
  };

  const startLivePreview = () => {
    const setDlgState = (code) => {
      setDlg(
        () =>
          new BuildDialogState(
            true,
            <BuildPagesDlgTitle buildId={buildId} closeDlg={closeDlg} />,
            code,
            DlgOpenerType.CODE
          )
      );
    };
    async function getLatestShot() {
      try {
        const {data} = await axios(getLatestShotEndpoint(buildId));
        const latestShotIdentifier = data ? getShotIdFromName(data) : null;
        setDlgState(
          <LivePreview
            shotBucket={rb.shotBucket}
            sessionKey={rbs.sessionKey}
            buildKey={rb.buildKey}
            latestShotIdentifier={latestShotIdentifier}
            closeHandler={closeDlg}
          />
        );
      } catch (ex) {
        // For now just reject if error occurs on latest processed shot check.
        // TODO: later see if we need to retry based on logs.
        handleApiError(
          error,
          (errorMsg) => setDlgState(<ErrorMessageWithIcon msg={errorMsg} />),
          'Unable to deliver live preview'
        );
      }
    }
    getLatestShot();
    setDlgState(<Loader rows={6} />);
  };

  // currently when output is opened and build is running, i'm refetching entire
  // output rather than using nextOutputToken. I feel this should be fine for now
  // as users are not going to look it continuously unless they are debugging.
  // TODO: monitor and change to use nextOutputToken later.
  const startBuildOutput = () => {
    setDlg(
      () =>
        new BuildDialogState(
          true,
          <BuildPagesDlgTitle buildId={buildId} closeDlg={closeDlg} />,
          <BuildOutput buildId={buildId} fetchInterval={2500} />,
          DlgOpenerType.LOG
        )
    );
  };

  const getTotalTestsDone = () =>
    rbs.testVersionDetailsList.filter(
      (t) => t.status && t.status !== TestStatus.RUNNING
    ).length;

  const getBuildRunningStatus = () => {
    const totalDone = getTotalTestsDone();
    // if nothing is running or nothing is done yet, show build status icon as
    // we want to show circular progress only when something is done.
    if (currentStatus !== TestStatus.RUNNING || totalDone < 1) {
      return (
        <BuildStatusIcon
          status={currentStatus}
          className={classes.mainStatusIcon}
        />
      );
    }
    return (
      <CircularProgress
        variant="determinate"
        size={theme.spacing(4)}
        value={Math.round(
          (totalDone / rbs.testVersionDetailsList.length) * 100
        )}
        color="primary"
        className={classes.marginR1}
      />
    );
  };

  const getBuildRunStatusText = () => {
    if (rbs.finalStatus) {
      return getTestStatusDisplayName(rbs.finalStatus);
    }
    if (rbs.sessionKey) {
      return `${getTotalTestsDone()} / ${
        rbs.testVersionDetailsList.length
      } test(s) done`;
    }
    return '';
  };

  const getBuildRunInfoText = () => {
    if (rbs.acquiringSession) {
      return 'Starting a new machine for this build. It may take a few minutes...';
    }
    if (rbs.newSessionFail) {
      return rbs.newSessionFailureError;
    }
    if (stopping && !rbs.finalStatus) {
      return 'Stopping build...';
    }
    if (!rbs.finalStatus) {
      return 'Build is running...';
    }
    if (!rbs.allDone) {
      const completedText =
        rbs.testVersionDetailsList.length > 1
          ? 'Tests are completed'
          : 'Test is completed';
      return `${completedText}, assets upload in progress...`;
    }
    return 'Build is completed, feel free to remove it from this list.';
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await axios.patch(getStopBuildEndpoint(buildId), {
        timeout: Timeouts.API_TIMEOUT_SMALL,
      });
    } catch (ex) {
      setStopping(false); // when no error, don't make it false else stop button will enable,
      // it will go off once everything is stopped.
      handleApiError(error, setSnackbarAlertError, "Couldn't stop build");
    }
  };

  if (isLoading) {
    return (
      <Box width="100%">
        <Loader rows={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" fontSize="body1.fontSize" color="error.main">
        {handleApiError(
          error,
          null,
          `Couldn't retrieve progress for build # ${buildId}`
        )}
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" className={classes.bottomBorder}>
        <Box px={1} display="flex" alignItems="center">
          <BuildStatusIcon
            status={currentStatus}
            className={classes.statusIconBuild}
          />
        </Box>
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          justifyContent="center">
          <Typography
            variant="body1"
            style={{fontWeight: 500}}>{`# ${buildId} ${
            rb.buildName || ''
          }`}</Typography>
          <Box
            display="flex"
            pt={0.5}
            alignItems="center"
            color="text.secondary"
            fontSize="body2.fontSize">
            <Box flexBasis="15%" alignItems="center" display="flex">
              <TimerIcon
                fontSize="small"
                titleAccess="Running for"
                className={classes.iconsIndication}
              />
              {convertMillisIntoTimeText(rbs.runningForMillis)}
            </Box>
            <span className={classes.separator}>|</span>
            {currentStatus === TestStatus.RUNNING ? (
              <>
                <Tooltip title="Stop this build">
                  <span>
                    <IconButton
                      aria-label="Stop this build"
                      onClick={handleStop}
                      disabled={stopping}>
                      <StopIcon color={stopping ? 'disabled' : 'error'} />
                    </IconButton>
                  </span>
                </Tooltip>
                <span className={classes.separator}>|</span>
              </>
            ) : null}
            <Button
              color="secondary"
              onClick={startLivePreview}
              disabled={currentStatus !== TestStatus.RUNNING}
              className={classes.button}>
              Live Preview
            </Button>
            <span className={classes.separator}>|</span>
            <Button
              color="secondary"
              onClick={startBuildOutput}
              disabled={!rbs.sessionKey}
              className={classes.button}>
              Build Output
            </Button>
            <span className={classes.separator}>|</span>
            <img src={getBrowserIcon(rb.browserName)} alt={rb.browserName} />
            <span className={classes.separator}>|</span>
            <img src={getOsIcon(rb.os)} alt={rb.os} />
          </Box>
        </Box>
        {getBuildStatusIconSet(rbs.testVersionDetailsList)}
      </Box>
      <Box display="flex" p={1} alignItems="center">
        {getBuildRunningStatus()}
        <Typography
          variant="body1"
          className={classes.marginR1}
          style={{fontWeight: 500}}>
          {getBuildRunStatusText()}
        </Typography>
        <Box
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          fontSize="body1.fontSize"
          color={rbs.newSessionFail ? 'error.main' : 'text.medium'}>
          {getBuildRunInfoText()}
        </Box>
      </Box>
      <Box flex={1} overflow="auto">
        {/* currently versions will be updated entirely using a fetch interval
        rather than getting status for just current version as we do in BuildRun
        This will be expensive if this page is opened for long and there are several
        running builds as lot of api calls will be made concurrently and all will
        fetch their entire version list every time. TODO: lets fix it soon to
        fetch each build's currently running version only. */}
        <TestVersionDetailsView
          buildId={buildId}
          shotBucket={rb.shotBucket}
          testVersionDetailsList={rbs.testVersionDetailsList}
          allTestsDone={!!rbs?.finalStatus}
        />
      </Box>
      <TitleDialog
        showDialog={dlg.open}
        closeDialog={closeDlg}
        titleContent={dlg.title}>
        {dlg.content}
      </TitleDialog>
      {showClose ? (
        <Tooltip title="Close this build from running list">
          <IconButton
            aria-label="Close this build"
            onClick={closeBuild}
            color="inherit"
            className={classes.close}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      ) : null}
    </>
  );
});

RunningBuild.propTypes = {
  runningBuildObj: PropTypes.instanceOf(RunningBuildObj).isRequired,
  removeHandler: PropTypes.func.isRequired,
};

export default RunningBuild;

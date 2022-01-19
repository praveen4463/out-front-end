import React, {useState, useContext, useEffect, useRef} from 'react';
import {
  useLocation,
  useParams,
  Link as RouterLink,
  useHistory,
} from 'react-router-dom';
import {useQuery} from 'react-query';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import axios from 'axios';
import {
  ASSET_UPLOAD_IN_PROGRESS_ERROR,
  BuildSourceType,
  QueryKeys,
  SearchKeys,
  SnackbarHorPos,
  SnackbarType,
  SnackbarVerPos,
  TestStatus,
  Timeouts,
} from '../Constants';
import {completedBuildDetailsFetch} from '../api/fetches';
import {AppSnackbarContext} from '../contexts';
import {
  getNumberParamFromUrl,
  handleApiError,
  removeFromSearchQuery,
  reRunBuildEndpoint,
  updateInSearchQuery,
} from '../common';
import Loader from '../components/Loader';
import {getTestResultPerStatus, newSessionInBackground} from '../buildsCommon';
import BuildStatusIconSet from '../components/BuildStatusIconSet';
import {SnackbarAlertProps} from '../model';
import CompletedBuildDetails from '../components/CompletedBuildDetails';
import SimpleBuildDetails from '../components/SimpleBuildDetails';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  button: {
    textTransform: 'none',
  },
  back: {
    color: theme.palette.text.medium,
  },
  borderSuccess: {
    borderLeft: '3px solid #4caf50',
  },
  borderFailure: {
    borderLeft: `3px solid ${theme.palette.error.main}`,
  },
  borderNeutral: {
    borderLeft: '3px solid #868686',
  },
}));

const CompletedBuild = () => {
  const [reRunning, setReRunning] = useState(false);
  const [reRunSubmitted, setReRunSubmitted] = useState(false);
  const {id} = useParams();
  const location = useLocation();
  const history = useHistory();
  const simpleView = getNumberParamFromUrl(
    SearchKeys.SIMPLE_VIEW,
    location.search
  );
  const locationInState =
    location.state && location.state.location ? location.state.location : null;
  const unmounted = useRef(false);
  const {data: completeBuildDetails, error, isLoading} = useQuery(
    [QueryKeys.COMPLETED_BUILD_DETAILS, id],
    completedBuildDetailsFetch,
    {staleTime: 10000}
  );
  // use app level snackbar, so that even if user goes away we should them the message
  // about build start.
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    AppSnackbarContext
  );
  const classes = useStyles();
  // listens for builds loading error
  useEffect(() => {
    if (error) {
      handleApiError(error, setSnackbarAlertError, 'Build failed to load');
    }
  }, [error, setSnackbarAlertError]);

  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  const setNotRunningOnSessionError = () => {
    if (unmounted.current) {
      return;
    }
    setReRunning(false);
  };

  const reRun = () => {
    setReRunSubmitted(true);
    axios
      .post(
        reRunBuildEndpoint(id),
        {buildSourceType: BuildSourceType.NOT_IDE},
        {
          timeout: Timeouts.API_TIMEOUT_SMALL,
        }
      )
      .then(({data: reRunBuildId}) => {
        // we got new buildId, let's begin new session and tell user it's running,
        newSessionInBackground(
          reRunBuildId,
          completeBuildDetails.buildName,
          setSnackbarAlertProps,
          setNotRunningOnSessionError
        );
        setSnackbarAlertProps(
          new SnackbarAlertProps(
            `A duplicate build # ${reRunBuildId} is successfully created and a` +
              ' new machine is getting up for running it.' +
              " Starting a new machine may take upto two minutes. Please visit 'Running Builds' page to" +
              ' check the progress.',
            SnackbarType.SUCCESS,
            SnackbarVerPos.TOP,
            SnackbarHorPos.CENTER,
            10000
          )
        );
        setReRunning(true);
      })
      .catch((ex) => {
        handleApiError(ex, (errorMsg) =>
          setSnackbarAlertProps(
            new SnackbarAlertProps(
              errorMsg,
              SnackbarType.ERROR,
              SnackbarVerPos.TOP,
              SnackbarHorPos.CENTER,
              15000
            )
          )
        );
      })
      .finally(() => setReRunSubmitted(false));
  };

  const getNoDataMessage = (msg) => (
    <Box textAlign="center" fontSize="body1.fontSize" fontWeight={500} pt={2}>
      {msg}
    </Box>
  );

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

  const getBorderByStatus = (status) => {
    if (status === TestStatus.SUCCESS) {
      return classes.borderSuccess;
    }
    if (status === TestStatus.ERROR) {
      return classes.borderFailure;
    }
    return classes.borderNeutral;
  };

  const getDetailView = () => {
    return simpleView &&
      completeBuildDetails.finalStatus === TestStatus.ERROR ? (
      <SimpleBuildDetails completedBuildDetailsObj={completeBuildDetails} />
    ) : (
      <CompletedBuildDetails completedBuildDetailsObj={completeBuildDetails} />
    );
  };

  const changeView = () => {
    if (simpleView) {
      removeFromSearchQuery(location, history, SearchKeys.SIMPLE_VIEW);
    } else {
      updateInSearchQuery(location, history, SearchKeys.SIMPLE_VIEW, 1);
    }
  };

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      {isLoading ? (
        <Box pt={1}>
          <Loader rows={4} />
        </Box>
      ) : null}
      {!isLoading && !completeBuildDetails
        ? getNoDataMessage(
            'Either you are looking at an invalid build or the build is not yet completed.'
          )
        : null}
      {completeBuildDetails ? (
        <>
          <Box
            display="flex"
            py={1}
            boxShadow={3}
            className={getBorderByStatus(completeBuildDetails.finalStatus)}>
            <Box pr={2} display="flex" alignItems="center">
              <IconButton
                component={RouterLink}
                to={locationInState}
                disabled={!locationInState}
                aria-label="Go Back"
                title="Go Back"
                className={classes.back}>
                <ArrowBackIcon />
              </IconButton>
            </Box>
            <Box
              display="flex"
              flex={1}
              flexDirection="column"
              justifyContent="center"
              fontSize="body1.fontSize"
              fontWeight={500}>
              {`# ${completeBuildDetails.buildId} ${
                completeBuildDetails.buildName || ''
              }`}
              <Box pt={1} display="flex">
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={reRun}
                  disabled={reRunning || reRunSubmitted}
                  className={classes.button}>
                  {reRunSubmitted ? 'Trying to re run...' : ''}
                  {reRunning ? 'Build is running...' : ''}
                  {!reRunSubmitted && !reRunning ? 'Re run this build' : ''}
                </Button>
                {completeBuildDetails.finalStatus === TestStatus.ERROR ? (
                  <>
                    <Box px={2} />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={changeView}
                      className={classes.button}>
                      {simpleView
                        ? "Switch to developer's view"
                        : 'Switch to simple view'}
                    </Button>
                  </>
                ) : null}
              </Box>
            </Box>
            {getBuildStatusIconSet(completeBuildDetails.testVersionDetailsList)}
          </Box>
          {/* if allDoneDate isn't there, show an error */}
          {!completeBuildDetails.allDoneDate
            ? getNoDataMessage(ASSET_UPLOAD_IN_PROGRESS_ERROR)
            : getDetailView()}
        </>
      ) : null}
    </Box>
  );
};

export default CompletedBuild;

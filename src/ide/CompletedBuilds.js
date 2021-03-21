import React, {useContext, useState, useEffect, useRef} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import TimerIcon from '@material-ui/icons/Timer';
import CloseIcon from '@material-ui/icons/Close';
import ErrorIcon from '@material-ui/icons/Error';
import MuiSkeleton from '@material-ui/lab/Skeleton';
import Box from '@material-ui/core/Box';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import axios from 'axios';
import PropTypes from 'prop-types';
import intervalToDuration from 'date-fns/intervalToDuration';
import {IdeCompletedBuildsContext} from './Contexts';
import {TestStatus, ASSET_UPLOAD_IN_PROGRESS_ERROR} from '../Constants';
import {
  getCompletedBuildDetailsEndpoint,
  handleApiError,
  fromJson,
} from '../common';
import {
  convertMillisIntoTimeText,
  getTestResultPerStatus,
  JUST_NOW_TIME,
} from '../buildsCommon';
import {CompletedBuildDetailsObj, TestVersionDetails} from '../model';
import CompletedBuildDetails from '../components/CompletedBuildDetails';
import BuildStatusIcon from '../components/BuildStatusIcon';
import BuildStatusIconSet from '../components/BuildStatusIconSet';

const Skeleton = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.contrastText,
    margin: theme.spacing(1),
  },
}))(MuiSkeleton);

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    color: theme.palette.background.contrastText,
  },
  closeIcon: {
    padding: theme.spacing(0.25),
    borderRight: `1px solid ${theme.palette.border.light}`,
    borderRadius: 'unset',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  summaryText: {
    fontSize: '0.8rem',
    color: theme.palette.text.hint,
  },
  buildDetail: {
    display: 'flex',
    flexDirection: 'column',
    color: theme.palette.background.contrastText,
  },
  iconsIndication: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
  },
  statusIconBuild: {
    fontSize: '1.4rem',
    marginRight: theme.spacing(1),
    marginLeft: `-${theme.spacing(1)}px`,
  },
  separator: {
    margin: `0 ${theme.spacing(0.5)}px`,
    color: theme.palette.text.hint,
  },
  error: {
    fontSize: '0.8rem',
    color: theme.palette.error.light,
  },
  buildsContainer: {
    overflowY: 'scroll',
  },
}));

const useSummaryStyles = makeStyles((theme) => ({
  root: {
    '&$expanded': {
      backgroundColor: theme.palette.action.focus,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  expanded: {},
}));

const getTimeTaken = (completedBuild) => {
  const {versionIds, completedBuildVersions} = completedBuild;
  return versionIds.reduce(
    (total, vid) => total + completedBuildVersions[vid].timeTaken ?? 0,
    0
  );
};

const getBuildResultStatus = (completedBuildVersions) => {
  const cbvValues = Object.values(completedBuildVersions);
  const {
    totalSuccess,
    totalError,
    totalStopped,
    totalAborted,
  } = getTestResultPerStatus(cbvValues);
  let buildStatus;
  // !! This logic should match what is in BuildRunHandler.updateBuildOnFinish
  if (totalSuccess === cbvValues.length) {
    buildStatus = TestStatus.SUCCESS;
  } else if (totalError) {
    buildStatus = TestStatus.STOPPED;
  } else if (totalStopped) {
    buildStatus = TestStatus.ABORTED;
  } else if (totalAborted) {
    buildStatus = TestStatus.ERROR;
  } else {
    throw new Error("Couldn't get a status");
  }
  return [buildStatus, totalSuccess, totalError, totalStopped, totalAborted];
};

const CompletedBuilds = ({closeHandler}) => {
  const completedBuilds = useContext(IdeCompletedBuildsContext);
  const [expandedBuildId, setExpandedBuildId] = useState(null);
  const [loadingBuildId, setLoadingBuildId] = useState(null);
  const [currentBuildDetail, setCurrentBuildDetail] = useState(null);
  const buildDetailsBuildIdRef = useRef(null);
  buildDetailsBuildIdRef.current = currentBuildDetail
    ? currentBuildDetail.buildId
    : null;
  const summary = useSummaryStyles();
  const classes = useStyles();

  useEffect(() => {
    async function getCompletedBuildDetails() {
      try {
        const {data} = await axios(
          getCompletedBuildDetailsEndpoint(expandedBuildId)
        );
        if (!data.allDoneDate) {
          setCurrentBuildDetail(new Error(ASSET_UPLOAD_IN_PROGRESS_ERROR));
          return;
        }
        const cbd = fromJson(CompletedBuildDetailsObj, data);
        cbd.testVersionDetailsList = cbd.testVersionDetailsList.map((l) =>
          fromJson(TestVersionDetails, l)
        );
        setCurrentBuildDetail(cbd);
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => setCurrentBuildDetail(new Error(errorMsg)),
          "Couldn't fetch build details"
        );
      }
    }
    if (
      !expandedBuildId ||
      buildDetailsBuildIdRef.current === expandedBuildId // when buildDetails is an error, it doesn't
      // contain a buildId thus never match expandedBuildId when it's closed and reopened. This is intended
      // so that when error occurs we can reattempt on every close and reopen.
    ) {
      return;
    }
    // This is same for logs and elem shots api calls in this module but when we stop user at
    // build details expand time, user can't touch anything that's not uploaded yet.
    // It's important to stop user as we can't decide whether some log exist before
    // upload fully done.
    getCompletedBuildDetails();
    setCurrentBuildDetail(null);
    setLoadingBuildId(expandedBuildId); // Let loader appear
  }, [expandedBuildId]);

  const handleChange = (buildId) => (event, isExpanded) => {
    setExpandedBuildId(isExpanded ? buildId : null);
  };

  const getErrorTypeMsg = (msg) => {
    return (
      <>
        <ErrorIcon
          fontSize="small"
          color="error"
          className={classes.iconsIndication}
        />
        <Typography variant="body2" className={classes.error}>
          {msg}
        </Typography>
      </>
    );
  };

  const getLoader = (key) => {
    return (
      <Box display="flex" flexDirection="column" flex={1} key={key ?? ''}>
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <Skeleton variant="text" width="80%" height={15} key={k} />
        ))}
      </Box>
    );
  };

  // start time shown in ide is different than shown in builds page as here we
  // want to show a more direct time rather than an estimation.
  const getStartTimeFormattedText = (start) => {
    const duration = intervalToDuration({
      start,
      end: new Date(),
    });
    const {years, months, days, hours, minutes} = duration;
    const text = [];
    if (years > 0) {
      text.push(`${years}y`);
    }
    if (months > 0) {
      text.push(`${months}m`);
    }
    if (days > 0) {
      text.push(`${days}d`);
    }
    if (hours > 0) {
      text.push(`${hours}h`);
    }
    if (minutes > 0) {
      text.push(`${minutes}m`);
    }
    if (!text.length) {
      return JUST_NOW_TIME;
    }
    return text.join(' ');
  };

  return (
    <>
      <Box display="flex" flexDirection="column" className={classes.root}>
        <Box display="flex" alignItems="center">
          <IconButton
            aria-label="Close Panel"
            onClick={closeHandler}
            title="Close Panel"
            color="inherit"
            className={classes.closeIcon}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box flex={1} className={classes.buildsContainer}>
          {completedBuilds ? (
            completedBuilds.map((c) => {
              const [
                buildStatus,
                success,
                error,
                stopped,
                aborted,
              ] = getBuildResultStatus(c.completedBuildVersions);
              const startTimeText = getStartTimeFormattedText(c.completedAt);
              return (
                <Accordion
                  TransitionProps={{unmountOnExit: true}}
                  expanded={expandedBuildId && expandedBuildId === c.buildId}
                  onChange={handleChange(c.buildId)}
                  key={c.buildId}
                  data-testid="build">
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`${c.buildId}-content`}
                    id={`${c.buildId}-header`}
                    classes={{
                      root: summary.root,
                      expanded: summary.expanded,
                    }}
                    data-testid="buildSummary">
                    <Box display="flex" alignItems="center">
                      <BuildStatusIcon
                        status={buildStatus}
                        className={classes.statusIconBuild}
                      />
                      <Typography className={classes.summaryText}>
                        {`# ${c.buildId}`}
                      </Typography>
                      <span className={classes.separator}>|</span>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <AccessTimeIcon
                        fontSize="small"
                        titleAccess="Begin Time"
                        className={classes.iconsIndication}
                      />
                      <Typography className={classes.summaryText}>
                        {`Ran ${
                          startTimeText === JUST_NOW_TIME
                            ? 'just now'
                            : `${startTimeText} ago`
                        }`}
                      </Typography>
                      <span className={classes.separator}>|</span>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <TimerIcon
                        fontSize="small"
                        titleAccess="Tests Completion Time"
                        className={classes.iconsIndication}
                      />
                      <Typography className={classes.summaryText}>
                        {convertMillisIntoTimeText(getTimeTaken(c))}
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      flex={1}
                      alignItems="center"
                      justifyContent="center">
                      <span className={classes.separator}>|</span>
                    </Box>
                    <Box display="flex" alignItems="center" mr={-1}>
                      <BuildStatusIconSet
                        totalSuccess={success}
                        totalError={error}
                        totalStopped={stopped}
                        totalAborted={aborted}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    classes={{root: classes.buildDetail}}
                    data-testid="buildDetails">
                    {currentBuildDetail &&
                    currentBuildDetail instanceof CompletedBuildDetailsObj &&
                    currentBuildDetail.buildId === c.buildId ? (
                      <CompletedBuildDetails
                        completedBuildDetailsObj={currentBuildDetail}
                      />
                    ) : null}
                    {currentBuildDetail &&
                    currentBuildDetail instanceof Error ? (
                      <Box display="flex" justifyContent="center">
                        {getErrorTypeMsg(currentBuildDetail.message)}
                      </Box>
                    ) : null}
                    {!currentBuildDetail && loadingBuildId === c.buildId ? (
                      <Box display="flex" justifyContent="space-evenly">
                        {[1, 2, 3].map((k) => getLoader(k))}
                      </Box>
                    ) : null}
                  </AccordionDetails>
                </Accordion>
              );
            })
          ) : (
            <Typography variant="body1">No build yet</Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

CompletedBuilds.propTypes = {
  closeHandler: PropTypes.func.isRequired,
};

export default CompletedBuilds;

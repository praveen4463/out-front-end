/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useContext, useState, useEffect, useRef} from 'react';

import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import TimerIcon from '@material-ui/icons/Timer';
import DescriptionIcon from '@material-ui/icons/Description';
import WallpaperIcon from '@material-ui/icons/Wallpaper';
import ViewCarouselIcon from '@material-ui/icons/ViewCarousel';
import CloseIcon from '@material-ui/icons/Close';
import SuccessIcon from '@material-ui/icons/Check';
import FailureIcon from '@material-ui/icons/HighlightOff';
import StopIcon from '@material-ui/icons/Stop';
import AbortedIcon from '@material-ui/icons/NotInterested';
import ErrorIcon from '@material-ui/icons/Error';
import MuiSkeleton from '@material-ui/lab/Skeleton';
import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Slide from '@material-ui/core/Slide';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Tooltip from '../TooltipCustom';
import {IdeCompletedBuildsContext} from './Contexts';
import {
  TestStatus,
  ApiStatuses,
  Os,
  Browsers,
  Defaults,
  Platforms,
  BuildConfigLabels,
  BuildConfigFields,
  BuildCapsFields,
  BuildCapsLabels,
} from '../Constants';
import {convertMillisIntoTimeText} from './common';
import {
  invokeOnApiCompletion,
  getTestStatusDisplayName,
  getOsDisplayName,
  getOsIcon,
  getBrowserDisplayName,
  getBrowserIcon,
  getVersionNamePath,
} from '../common';
import ShotsViewer from '../components/ShotsViewer';
import Application from '../config/application';

const Skeleton = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.contrastText,
    margin: theme.spacing(1),
  },
}))(MuiSkeleton);

const Label = withStyles((theme) => ({
  root: {
    fontSize: theme.typography.pxToRem(14),
    color: theme.palette.text.secondary,
  },
}))(Typography);

const TextValue = withStyles((theme) => ({
  root: {
    fontSize: theme.typography.pxToRem(14),
    color: theme.palette.background.contrastText,
  },
}))(Typography);

const LabelBox = ({basis, children}) => {
  return (
    <Box flexBasis={basis ?? '50%'} flexShrink={0}>
      {children}
    </Box>
  );
};

LabelBox.propTypes = {
  basis: PropTypes.string,
  children: PropTypes.node.isRequired,
};

LabelBox.defaultProps = {
  basis: null,
};

const ViewRow = ({children}) => {
  return (
    <Box display="flex" p={1} data-testid="viewRow">
      {children}
    </Box>
  );
};

ViewRow.propTypes = {
  children: PropTypes.node.isRequired,
};

const Transition = React.forwardRef(function Transition(props, ref) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Slide direction="down" ref={ref} {...props} />;
});

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
  icons: {
    padding: 0,
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
  success: {
    color: '#4caf50',
  },
  failure: {
    color: theme.palette.error.light,
  },
  neutral: {
    color: '#868686',
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
  marginR4: {
    marginRight: theme.spacing(0.5),
  },
  marginRMinus12: {
    marginRight: `-${theme.spacing(1)}px`,
  },
  marginL16: {
    marginLeft: theme.spacing(2),
  },
  error: {
    fontSize: '0.8rem',
    color: theme.palette.error.light,
  },
  borderSuccess: {
    borderLeft: '3px solid #4caf50',
  },
  borderFailure: {
    borderLeft: `3px solid ${theme.palette.error.light}`,
  },
  borderNeutral: {
    borderLeft: '3px solid #868686',
  },
  link: {
    fontSize: theme.typography.pxToRem(14),
    color: '#4997E4',
  },
  elemShotLink: {
    fontSize: theme.typography.pxToRem(15),
    color: '#4997E4',
    padding: theme.spacing(1),
  },
  borderLightBottom: {
    borderBottom: `1px solid ${theme.palette.border.light}`,
  },
  testsHeading: {
    color: theme.palette.text.hint,
    backgroundColor: theme.palette.background.paperContrast,
  },
  contrastText: {
    color: theme.palette.background.contrastText,
  },
  dlgRoot: {
    backgroundColor: theme.palette.background.paperOnDefault,
    height: '90%',
    color: theme.palette.background.contrastText,
  },
  dlgTitle: {
    margin: 0,
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.border.light}`,
    backgroundColor: theme.palette.background.navigations,
  },
  fadedColor: {
    color: theme.palette.text.hint,
  },
  dlgCloseIcon: {
    color: theme.palette.grey[500],
  },
  dlgContentNoPadding: {
    padding: 0,
  },
  outputPanelContent: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'scroll',
  },
  output: {
    fontFamily: "'Fira Mono', 'Courier New', Courier, monospace",
    fontSize: '.875rem',
    fontWeight: 'normal',
    lineHeight: 1.5,
    color: theme.palette.background.contrastText,
    margin: `${theme.spacing(1)}px 0px`,
  },
  outputError: {
    color: theme.palette.error.light,
    marginTop: 0,
  },
  noOutput: {
    color: theme.palette.background.contrastText,
  },
  hoverOver: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
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

const JUST_NOW_TIME = 'JUST_NOW_TIME';
const SHOT_LABEL = 'Screenshots & Playback';
const LOG_TYPE = {
  DRIVER: 'DRIVER',
  PERF: 'PERF',
};
const VAR_TYPE = {
  GLOBAL: 'GLOBAL',
  BUILD: 'BUILD',
};

const getTimeTaken = (completedBuild) => {
  const {versionIds, completedBuildVersions} = completedBuild;
  return versionIds.reduce(
    (total, vid) => total + completedBuildVersions[vid].timeTaken ?? 0,
    0
  );
};

const getBuildResultStatus = (completedBuildVersions) => {
  const totalForStatus = (cbvValues, status) => {
    return cbvValues.filter((cbv) => cbv.status === status).length;
  };
  let buildStatus;
  const cbvValues = Object.values(completedBuildVersions);
  const success = totalForStatus(cbvValues, TestStatus.SUCCESS);
  const error = totalForStatus(cbvValues, TestStatus.ERROR);
  const stopped = totalForStatus(cbvValues, TestStatus.STOPPED);
  const aborted = totalForStatus(cbvValues, TestStatus.ABORTED);
  if (success === cbvValues.length) {
    buildStatus = TestStatus.SUCCESS;
  } else if (error) {
    buildStatus = TestStatus.ERROR;
  } else if (stopped) {
    buildStatus = TestStatus.STOPPED;
  } else if (aborted) {
    buildStatus = TestStatus.ABORTED;
  } else {
    throw new Error("Couldn't get a status");
  }
  return [buildStatus, success, error, stopped, aborted];
};

const getElapsedTimeText = (start) => {
  const elapsedMillis = Date.now() - start;
  if (elapsedMillis < 60000) {
    return JUST_NOW_TIME;
  }
  const d = new Date(70, 0, 1, 0, 0, 0, elapsedMillis);
  const text = [];
  const days = d.getDate() - 1;
  const hours = d.getHours();
  const mins = d.getMinutes();
  if (days > 0) {
    text.push(`${days} d`);
  }
  if (hours > 0) {
    text.push(`${hours} h`);
  }
  if (mins > 0) {
    text.push(`${mins} m`);
  }
  return text.join(' ');
};

function BuildDetail(
  buildId,
  os,
  browserName,
  browserVersion,
  resolution,
  timezone,
  buildCapsName,
  driverLogsAvailable, // api should check whether driver logs file is available in bucket
  perfLogsAvailable, // api should check whether perf logs file is available in bucket
  elemShotsAvailable, // api should make a head request and check whether zl-elem-shots/build-BUILD_ID
  // dir is available, if so, this will be true.
  shotBucket
) {
  this.buildId = buildId;
  this.os = os;
  this.browserName = browserName;
  this.browserVersion = browserVersion;
  this.resolution = resolution;
  this.timezone = timezone;
  this.buildCapsName = buildCapsName;
  this.driverLogsAvailable = driverLogsAvailable;
  this.perfLogsAvailable = perfLogsAvailable;
  this.elemShotsAvailable = elemShotsAvailable;
  this.shotBucket = shotBucket;
}

const DlgOpenerType = {
  LOG: 'LOG',
  SCREENSHOT: 'SCREENSHOT',
  ELEMENT_SHOT: 'ELEMENT_SHOT',
  DATA: 'DATA',
};

function DialogState(
  open = false,
  title = null,
  content = null,
  openerType = null
) {
  this.open = open;
  this.title = title;
  this.content = content;
  this.openerType = openerType;
}

const boolText = (val) => {
  return val ? 'Yes' : 'No';
};

const CompletedBuilds = ({closeHandler}) => {
  const completedBuilds = useContext(IdeCompletedBuildsContext);
  const [expandedBuildId, setExpandedBuildId] = useState(null);
  const [loadingBuildId, setLoadingBuildId] = useState(null);
  const [currentBuildDetail, setCurrentBuildDetail] = useState(null);
  const [dlg, setDlg] = useState(new DialogState());
  const buildDetailsBuildIdRef = useRef(null);
  buildDetailsBuildIdRef.current = currentBuildDetail
    ? currentBuildDetail.buildId
    : null;
  const summary = useSummaryStyles();
  const classes = useStyles();

  useEffect(() => {
    if (
      !expandedBuildId ||
      buildDetailsBuildIdRef.current === expandedBuildId // when buildDetails is an error, it doesn't
      // contain a buildId thus never match expandedBuildId when it's closed and reopened. This is intended
      // so that when error occurs we can reattempt on every close and reopen.
    ) {
      return;
    }
    const onSuccess = (response) => {
      const {data} = response;
      const buildDetail = new BuildDetail(
        expandedBuildId,
        data.os,
        data.browserName,
        data.browserVersion,
        data.resolution,
        data.timezone,
        data.buildCapsName,
        data.driverLogsAvailable,
        data.perfLogsAvailable,
        data.elemShotsAvailable,
        data.shotBucket
      );
      setCurrentBuildDetail(buildDetail);
    };
    const onError = (response) => {
      const error = new Error(
        `Couldn't fetch build details, ${response.error.reason}`
      );
      setCurrentBuildDetail(error);
    };
    // send api request to get build details, give expandedBuildId.
    // !!! if allDoneTime of build is not yet set, api sends assets upload error.
    // This is same for logs and elem shots api calls in this module but when we stop user at
    // build details expand time, user can't touch anything that's not uploaded yet.
    // It's important to stop user as we can't decide whether some log exist before
    // upload fully done.
    setTimeout(() => {
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          os: Os.WIN10.VALUE,
          browserName: Browsers.CHROME.VALUE,
          browserVersion: 90,
          resolution: Defaults.DESKTOP_RES,
          timezone: 'Central Pacific Standard Time',
          buildCapsName: 'chrome_90_win10_debug',
          driverLogsAvailable: true,
          perfLogsAvailable: true,
          elemShotsAvailable: true,
          shotBucket: 'zl-session-assets-mum',
        },
      };
      // const response = getApiError(ASSET_UPLOAD_IN_PROGRESS_ERROR);
      invokeOnApiCompletion(response, onSuccess, onError);
    }, 1000);
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

  const successMark = (css) => (
    <SuccessIcon titleAccess="Passed" className={clsx(classes.success, css)} />
  );
  const failureMark = (css) => (
    <FailureIcon titleAccess="Failed" className={clsx(classes.failure, css)} />
  );
  const stopMark = (css) => (
    <StopIcon titleAccess="Stopped" className={clsx(classes.neutral, css)} />
  );
  const abortMark = (css) => (
    <AbortedIcon titleAccess="Aborted" className={clsx(classes.neutral, css)} />
  );

  const getIconPerStatus = (testStatus, css) => {
    switch (testStatus) {
      case TestStatus.SUCCESS:
        return successMark(css);
      case TestStatus.ERROR:
        return failureMark(css);
      case TestStatus.ABORTED:
        return abortMark(css);
      case TestStatus.STOPPED:
        return stopMark(css);
      default:
        throw new Error(`Unrecognized status ${testStatus}`);
    }
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

  const getViewRow = (label, value, labelBases) => {
    return (
      <ViewRow>
        <LabelBox basis={labelBases}>
          <Label>{`${label}:`}</Label>
        </LabelBox>
        {value}
      </ViewRow>
    );
  };

  const getDataRow = (label, value, isBool = false) => {
    return (
      <Box
        display="flex"
        p={1}
        className={classes.hoverOver}
        data-testid="viewRow">
        <LabelBox basis="40%">
          <Label>{`${label}:`}</Label>
        </LabelBox>
        <TextValue>{isBool ? boolText(value) : value}</TextValue>
      </Box>
    );
  };

  const closeDlg = () => {
    setDlg(() => new DialogState());
  };

  const getOutput = (completedBuildVersionsValues) => {
    const anyOutput = completedBuildVersionsValues.some(
      (cbv) => cbv.output || cbv.error
    );
    return (
      <>
        <Box className={classes.outputPanelContent} flex={1}>
          {completedBuildVersionsValues.map((cbv) => (
            <Box
              display="flex"
              flexDirection="column"
              px={1}
              key={cbv.versionId}>
              <pre className={classes.output}>{cbv.output}</pre>
              <pre className={clsx(classes.output, classes.outputError)}>
                {cbv.error ? cbv.error.msg : ''}
              </pre>
            </Box>
          ))}
        </Box>
        {!anyOutput ? (
          <Box mt="10%" display="flex" justifyContent="center">
            <Typography variant="body1" className={classes.noOutput}>
              No Output recorded
            </Typography>
          </Box>
        ) : null}
      </>
    );
  };

  const getDlgTitle = (title, versionId, fileName, testName, versionName) => {
    return (
      <Box display="flex" alignItems="center">
        {title ? <Typography variant="h6">{title}</Typography> : null}
        <Typography
          variant="body1"
          className={clsx(
            classes.fadedColor,
            title && classes.marginL16
          )}>{`# ${expandedBuildId}`}</Typography>
        {versionId ? (
          <Typography
            variant="body1"
            className={clsx(classes.fadedColor, classes.marginL16)}>
            {getVersionNamePath(fileName, testName, versionName)}
          </Typography>
        ) : null}
        <Box flex={1} />
        <IconButton
          aria-label="Close"
          onClick={closeDlg}
          title="Close"
          color="inherit"
          className={classes.dlgCloseIcon}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const handleBuildShots = () => {
    const content = (
      <ShotsViewer
        buildId={expandedBuildId}
        shotBucket={currentBuildDetail.shotBucket}
      />
    );
    setDlg(
      () =>
        new DialogState(true, getDlgTitle(), content, DlgOpenerType.SCREENSHOT)
    );
  };

  const handleBuildOutput = (completedBuild) => {
    // always access completedBuildVersionsValues via completedBuild.versionIds
    // and not using Object.values to maintain ordering.
    const completedBuildVersionsValues = completedBuild.versionIds.map(
      (vid) => completedBuild.completedBuildVersions[vid]
    );
    setDlg(
      () =>
        new DialogState(
          true,
          getDlgTitle(),
          getOutput(completedBuildVersionsValues),
          DlgOpenerType.LOG
        )
    );
  };

  const getLogText = (logType) => {
    switch (logType) {
      case LOG_TYPE.DRIVER:
        return 'Driver Logs';
      case LOG_TYPE.PERF:
        return 'Performance Logs';
      default:
        return '';
    }
  };

  const getVarText = (varType) => {
    switch (varType) {
      case VAR_TYPE.BUILD:
        return 'Build Variables';
      case VAR_TYPE.GLOBAL:
        return 'Global Variables';
      default:
        return '';
    }
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

  const errorOnDlg = (error) => {
    return (
      <Box mt="10%" display="flex" justifyContent="center">
        {error}
      </Box>
    );
  };

  const handleLogs = (logType) => {
    const setDlgState = (output) => {
      setDlg(
        () =>
          new DialogState(
            true,
            getDlgTitle(getLogText(logType)),
            output,
            DlgOpenerType.LOG
          )
      );
    };
    const onSuccess = (response) => {
      setDlgState(
        <Box className={classes.outputPanelContent} flex={1}>
          <Box display="flex" flexDirection="column" px={1}>
            <pre className={classes.output}>{response.data.output}</pre>
          </Box>
        </Box>
      );
    };
    const onError = (response) => {
      setDlgState(
        errorOnDlg(
          getErrorTypeMsg(`Couldn't fetch logs, ${response.error.reason}`)
        )
      );
    };
    setTimeout(() => {
      // send request to api using logType, expandedBuildId and expect log text as output field
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          output: `This is ${getLogText(logType)}
It's a chrome driver`,
        },
      };
      // const response = getApiError(ASSET_UPLOAD_IN_PROGRESS_ERROR);
      invokeOnApiCompletion(response, onSuccess, onError);
    }, 1000);
    setDlgState(getLoader());
  };

  const handleDriverLogs = () => {
    handleLogs(LOG_TYPE.DRIVER);
  };

  const handlePerfLogs = () => {
    handleLogs(LOG_TYPE.PERF);
  };

  const handleElemShots = () => {
    const SHOT_NAME_TMPL = '##NAME##';
    const shotUriTemplate = `${Application.STORAGE_HOST}/${Application.ELEM_SHOT_BUCKET}/build-${expandedBuildId}/${SHOT_NAME_TMPL}`;
    const setDlgState = (output) => {
      setDlg(
        () =>
          new DialogState(
            true,
            getDlgTitle('Element Screenshots'),
            output,
            DlgOpenerType.ELEMENT_SHOT
          )
      );
    };
    const onSuccess = (response) => {
      setDlgState(
        <Box display="flex" flexDirection="column">
          {response.data.shotNames.map((n) => (
            <Link
              key={n}
              href={shotUriTemplate.replace(SHOT_NAME_TMPL, n)}
              aria-label="Download element screenshot"
              title="Download element screenshot"
              color="inherit"
              className={classes.elemShotLink}>
              {n}
            </Link>
          ))}
        </Box>
      );
    };
    const onError = (response) => {
      setDlgState(
        errorOnDlg(
          getErrorTypeMsg(
            `Couldn't fetch element screenshots, ${response.error.reason}`
          )
        )
      );
    };
    setTimeout(() => {
      // send request to api using expandedBuildId and expect element shot names
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          shotNames: [
            'age-select-323d332erer3232323.png',
            'person-box-fkj3jjkj3442jkj234.png',
            '33kjjk3kjj23k2j31kjk4j4j42kjj.png',
          ],
        },
      };
      // const response = getApiError(ASSET_UPLOAD_IN_PROGRESS_ERROR);
      invokeOnApiCompletion(response, onSuccess, onError);
    }, 1000);
    setDlgState(getLoader());
  };

  const getOsForDisplay = (labelBasis) => {
    return getViewRow(
      'OS',
      <Box display="flex" alignItems="center">
        <img
          src={getOsIcon(currentBuildDetail.os)}
          alt={currentBuildDetail.os}
        />
        <TextValue style={{marginLeft: '4px'}}>
          {getOsDisplayName(currentBuildDetail.os)}
        </TextValue>
      </Box>,
      labelBasis
    );
  };

  const getBrowserForDisplay = (labelBasis) => {
    return getViewRow(
      'Browser',
      <Box display="flex" alignItems="center">
        <img
          src={getBrowserIcon(currentBuildDetail.browserName)}
          alt={currentBuildDetail.os}
        />
        <TextValue style={{marginLeft: '4px'}}>
          {`${getBrowserDisplayName(currentBuildDetail.browserName)} ${
            currentBuildDetail.browserVersion
          }`}
        </TextValue>
      </Box>,
      labelBasis
    );
  };

  const handleBuildCaps = () => {
    const setDlgState = (output) => {
      setDlg(
        () =>
          new DialogState(
            true,
            getDlgTitle('Build Capabilities'),
            output,
            DlgOpenerType.DATA
          )
      );
    };
    const onSuccess = (response) => {
      const {data} = response;
      setDlgState(
        <Box display="flex" flexDirection="column">
          {getDataRow(BuildCapsLabels.NAME, data[BuildCapsFields.NAME])}
          <Box className={classes.hoverOver}>{getOsForDisplay('40%')}</Box>
          <Box className={classes.hoverOver}>{getBrowserForDisplay('40%')}</Box>
          {getDataRow(BuildCapsLabels.AIC, data[BuildCapsFields.AIC], true)}
          {data[BuildCapsFields.BN] === Browsers.CHROME.VALUE && (
            <>
              {getDataRow(BuildCapsLabels.CVL, data[BuildCapsFields.CVL], true)}
              {getDataRow(BuildCapsLabels.CSL, data[BuildCapsFields.CSL], true)}
              {getDataRow(
                BuildCapsLabels.CENL,
                data[BuildCapsFields.CENL],
                true
              )}
              {getDataRow(
                BuildCapsLabels.CEPL,
                data[BuildCapsFields.CEPL],
                true
              )}
            </>
          )}
          {data[BuildCapsFields.BN] === Browsers.FIREFOX.VALUE &&
            getDataRow(BuildCapsLabels.FLL, data[BuildCapsFields.FLL])}
          {data[BuildCapsFields.BN] === Browsers.IE.VALUE &&
            getDataRow(BuildCapsLabels.IELL, data[BuildCapsFields.IELL])}
          {getDataRow(BuildCapsLabels.SM, data[BuildCapsFields.SM], true)}
          {getDataRow(BuildCapsLabels.ST, data[BuildCapsFields.ST])}
          {getDataRow(BuildCapsLabels.PLT, data[BuildCapsFields.PLT])}
          {getDataRow(BuildCapsLabels.EAT, data[BuildCapsFields.EAT])}
          {getDataRow(BuildCapsLabels.SFI, data[BuildCapsFields.SFI], true)}
          {getDataRow(BuildCapsLabels.UPB, data[BuildCapsFields.UPB])}
          {data[BuildCapsFields.BN] === Browsers.IE.VALUE && (
            <>
              {getDataRow(BuildCapsLabels.IEESB, data[BuildCapsFields.IEESB])}
              {getDataRow(
                BuildCapsLabels.IEEPH,
                data[BuildCapsFields.IEEPH],
                true
              )}
              {getDataRow(
                BuildCapsLabels.IERWF,
                data[BuildCapsFields.IERWF],
                true
              )}
              {getDataRow(
                BuildCapsLabels.IEDNE,
                data[BuildCapsFields.IEDNE],
                true
              )}
            </>
          )}
        </Box>
      );
    };
    const onError = (response) => {
      setDlgState(
        errorOnDlg(
          getErrorTypeMsg(
            `Couldn't fetch build capabilities, ${response.error.reason}`
          )
        )
      );
    };
    setTimeout(() => {
      // send expandedBuildId and expect captured build caps
      // api sends only fields that makes sense for browsers, such as ie related
      // caps are sent only when browser is ie.
      // api sends back fields given in BuildCapabilities object.
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          [BuildCapsFields.NAME]: 'chrome_90_win10_debug',
          [BuildCapsFields.OS]: Os.WIN10.VALUE,
          [BuildCapsFields.BN]: Browsers.CHROME.VALUE,
          [BuildCapsFields.BV]: '90',
          [BuildCapsFields.PN]: Platforms.WINDOWS.VALUE,
          [BuildCapsFields.AIC]: false,
          [BuildCapsFields.ST]: 60000,
          [BuildCapsFields.PLT]: 200000,
          [BuildCapsFields.EAT]: 60000,
          [BuildCapsFields.SFI]: false,
          [BuildCapsFields.UPB]: 'ignore',
          [BuildCapsFields.CVL]: false,
          [BuildCapsFields.CSL]: false,
          [BuildCapsFields.CENL]: false,
          [BuildCapsFields.CEPL]: false,
          [BuildCapsFields.SM]: true,
        },
      };
      // const response = getApiError('Network error');
      invokeOnApiCompletion(response, onSuccess, onError);
    }, 1000);
    setDlgState(getLoader());
  };

  const handleVars = (varType) => {
    const setDlgState = (output) => {
      setDlg(
        () =>
          new DialogState(
            true,
            getDlgTitle(getVarText(varType)),
            output,
            DlgOpenerType.DATA
          )
      );
    };
    const onSuccess = (response) => {
      const {vars} = response.data;
      setDlgState(
        <Box display="flex" flexDirection="column">
          {Object.keys(vars).map((k) => getDataRow(k, vars[k]))}
        </Box>
      );
    };
    const onError = (response) => {
      setDlgState(
        errorOnDlg(
          getErrorTypeMsg(`Couldn't fetch variables, ${response.error.reason}`)
        )
      );
    };
    setTimeout(() => {
      // send expandedBuildId, varType and expect captured variables, both build and global
      // give just key-value pairs
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          vars: {
            'var-1': 'value1',
            'var-2': 'value1',
            'var-3': 'value1',
          },
        },
      };
      // const response = getApiError('Network error');
      invokeOnApiCompletion(response, onSuccess, onError);
    }, 1000);
    setDlgState(getLoader());
  };

  const handleBuildVars = () => {
    handleVars(VAR_TYPE.BUILD);
  };

  const handleGlobalVars = () => {
    handleVars(VAR_TYPE.GLOBAL);
  };

  const handleRunnerPrefs = () => {
    const setDlgState = (output) => {
      setDlg(
        () =>
          new DialogState(
            true,
            getDlgTitle("Runner's Preferences"),
            output,
            DlgOpenerType.DATA
          )
      );
    };
    const onSuccess = (response) => {
      const {data} = response;
      setDlgState(
        <Box display="flex" flexDirection="column">
          {getDataRow(BuildConfigLabels.AOF, data[BuildConfigFields.AOF], true)}
          {getDataRow(
            BuildConfigLabels.AKSW,
            data[BuildConfigFields.AKSW],
            true
          )}
          {getDataRow(
            BuildConfigLabels.AUUB,
            data[BuildConfigFields.AUUB],
            true
          )}
          {getDataRow(BuildConfigLabels.ART, data[BuildConfigFields.ART], true)}
          {getDataRow(
            BuildConfigLabels.ADAC,
            data[BuildConfigFields.ADAC],
            true
          )}
        </Box>
      );
    };
    const onError = (response) => {
      setDlgState(
        errorOnDlg(
          getErrorTypeMsg(
            `Couldn't fetch runner's preferences, ${response.error.reason}`
          )
        )
      );
    };
    setTimeout(() => {
      // send expandedBuildId and expect captured runners prefs
      // api sends back fields given in BuildConfig object.
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          [BuildConfigFields.AOF]: false,
          [BuildConfigFields.AKSW]: true,
          [BuildConfigFields.AUUB]: true,
          [BuildConfigFields.ART]: true,
          [BuildConfigFields.ADAC]: true,
        },
      };
      // const response = getApiError('Network error');
      invokeOnApiCompletion(response, onSuccess, onError);
    }, 1000);
    setDlgState(getLoader());
  };

  const handleVersionShots = (versionId, fileName, testName, versionName) => {
    const content = (
      <ShotsViewer
        buildId={expandedBuildId}
        shotBucket={currentBuildDetail.shotBucket}
        versionId={versionId}
        fileName={fileName}
        testName={testName}
        versionName={versionName}
      />
    );
    setDlg(
      () =>
        new DialogState(
          true,
          getDlgTitle(null, versionId, fileName, testName, versionName),
          content,
          DlgOpenerType.SCREENSHOT
        )
    );
  };

  const handleVersionOutput = (completedBuildVersion) => {
    const {versionId, fileName, testName, versionName} = completedBuildVersion;
    setDlg(
      () =>
        new DialogState(
          true,
          getDlgTitle(null, versionId, fileName, testName, versionName),
          getOutput([completedBuildVersion]),
          DlgOpenerType.LOG
        )
    );
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
              const startTimeText = getElapsedTimeText(c.completedAt);
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
                      {getIconPerStatus(buildStatus, classes.statusIconBuild)}
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
                    <Box display="flex" alignItems="center">
                      {getIconPerStatus(
                        TestStatus.SUCCESS,
                        classes.iconsIndication
                      )}
                      <Typography
                        className={clsx(classes.summaryText, classes.marginR4)}>
                        {success}
                      </Typography>
                      {getIconPerStatus(
                        TestStatus.ERROR,
                        classes.iconsIndication
                      )}
                      <Typography
                        className={clsx(classes.summaryText, classes.marginR4)}>
                        {error}
                      </Typography>
                      {getIconPerStatus(
                        TestStatus.STOPPED,
                        classes.iconsIndication
                      )}
                      <Typography
                        className={clsx(classes.summaryText, classes.marginR4)}>
                        {stopped}
                      </Typography>
                      {getIconPerStatus(
                        TestStatus.ABORTED,
                        classes.iconsIndication
                      )}
                      <Typography
                        className={clsx(
                          classes.summaryText,
                          classes.marginRMinus12
                        )}>
                        {aborted}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    classes={{root: classes.buildDetail}}
                    data-testid="buildDetails">
                    {currentBuildDetail &&
                    currentBuildDetail instanceof BuildDetail &&
                    currentBuildDetail.buildId === c.buildId ? (
                      <Box display="flex" flexDirection="column">
                        <Box
                          display="flex"
                          flexDirection="column"
                          className={getBorderByStatus(buildStatus)}
                          boxShadow={3}>
                          <Box
                            display="flex"
                            p={1}
                            alignItems="center"
                            className={classes.borderLightBottom}>
                            {getIconPerStatus(
                              buildStatus,
                              classes.iconsIndication
                            )}
                            <Typography
                              variant="body1"
                              className={classes.marginR4}>
                              {getTestStatusDisplayName(buildStatus)}
                            </Typography>
                            {buildStatus === TestStatus.ABORTED
                              ? getErrorTypeMsg(
                                  'Build aborted due to an unexpected exception'
                                )
                              : null}
                          </Box>
                          <Box display="flex" p={1}>
                            <Box
                              display="flex"
                              flexGrow={1}
                              flexBasis="35%"
                              overflow="hidden"
                              flexDirection="column">
                              {getViewRow(
                                'Duration',
                                <TextValue>
                                  {convertMillisIntoTimeText(getTimeTaken(c))}
                                </TextValue>
                              )}
                              {getOsForDisplay()}
                              {getBrowserForDisplay()}
                              {getViewRow(
                                BuildConfigLabels.DR,
                                <TextValue>
                                  {currentBuildDetail.resolution}
                                </TextValue>
                              )}
                              {getViewRow(
                                BuildConfigLabels.TZ,
                                <TextValue>
                                  {currentBuildDetail.timezone}
                                </TextValue>
                              )}
                            </Box>
                            <Box
                              display="flex"
                              flexGrow={1}
                              flexBasis="25%"
                              flexDirection="column">
                              {getViewRow(
                                SHOT_LABEL,
                                <IconButton
                                  aria-label={SHOT_LABEL}
                                  onClick={handleBuildShots}
                                  title={SHOT_LABEL}
                                  color="inherit"
                                  className={classes.icons}>
                                  <ViewCarouselIcon fontSize="small" />
                                </IconButton>,
                                '90%'
                              )}
                              {getViewRow(
                                'Output',
                                <IconButton
                                  aria-label="Output"
                                  onClick={() => handleBuildOutput(c)}
                                  title="Output"
                                  color="inherit"
                                  className={classes.icons}>
                                  <DescriptionIcon fontSize="small" />
                                </IconButton>,
                                '90%'
                              )}
                              {currentBuildDetail.driverLogsAvailable
                                ? getViewRow(
                                    'Driver Logs',
                                    <IconButton
                                      aria-label="Driver Logs"
                                      onClick={handleDriverLogs}
                                      title="Driver Logs"
                                      color="inherit"
                                      className={classes.icons}>
                                      <DescriptionIcon fontSize="small" />
                                    </IconButton>,
                                    '90%'
                                  )
                                : null}
                              {currentBuildDetail.perfLogsAvailable
                                ? getViewRow(
                                    'Performance Logs',
                                    <IconButton
                                      aria-label="Performance Logs"
                                      onClick={handlePerfLogs}
                                      title="Performance Logs"
                                      color="inherit"
                                      className={classes.icons}>
                                      <DescriptionIcon fontSize="small" />
                                    </IconButton>,
                                    '90%'
                                  )
                                : null}
                              {currentBuildDetail.elemShotsAvailable
                                ? getViewRow(
                                    'Element Screenshots',
                                    <IconButton
                                      aria-label="Element Screenshots"
                                      onClick={handleElemShots}
                                      title="Element Screenshots"
                                      color="inherit"
                                      className={classes.icons}>
                                      <WallpaperIcon fontSize="small" />
                                    </IconButton>,
                                    '90%'
                                  )
                                : null}
                            </Box>
                            <Box
                              display="flex"
                              flexGrow={1}
                              flexBasis="40%"
                              overflow="hidden"
                              flexDirection="column">
                              {getViewRow(
                                BuildConfigLabels.BCAP,
                                <Link
                                  component="button"
                                  className={classes.link}
                                  variant="body1"
                                  onClick={handleBuildCaps}>
                                  {currentBuildDetail.buildCapsName}
                                </Link>
                              )}
                              {getViewRow(
                                BuildConfigLabels.SBVIPK,
                                <Link
                                  component="button"
                                  className={classes.link}
                                  variant="body1"
                                  onClick={handleBuildVars}>
                                  View
                                </Link>
                              )}
                              {getViewRow(
                                'Global Variables',
                                <Link
                                  component="button"
                                  className={classes.link}
                                  variant="body1"
                                  onClick={handleGlobalVars}>
                                  View
                                </Link>
                              )}
                              {getViewRow(
                                "Runner's Preferences",
                                <Link
                                  component="button"
                                  className={classes.link}
                                  variant="body1"
                                  onClick={handleRunnerPrefs}>
                                  View
                                </Link>
                              )}
                            </Box>
                          </Box>
                        </Box>
                        <Box
                          mt={1}
                          display="flex"
                          flexDirection="column"
                          boxShadow={3}>
                          <Box
                            p={1}
                            boxShadow={1}
                            display="flex"
                            className={clsx(
                              classes.borderNeutral,
                              classes.testsHeading
                            )}>
                            <Box flexBasis="5%" />
                            <Box flexBasis="70%">
                              <Typography variant="caption">TESTS</Typography>
                            </Box>
                            <Box flexBasis="18%">
                              <Typography variant="caption">
                                DURATION
                              </Typography>
                            </Box>
                            <Box display="flex" flexBasis="7%" />
                          </Box>
                          {/* always access cbvs via versionIds and not Object.value
                          so that test run order is maintained */}
                          {c.versionIds.map((vid) => {
                            const {
                              status,
                              timeTaken,
                              fileName,
                              testName,
                              versionName,
                            } = c.completedBuildVersions[vid];
                            return (
                              <Box
                                p={1}
                                boxShadow={3}
                                display="flex"
                                key={vid}
                                className={clsx(
                                  getBorderByStatus(status),
                                  classes.contrastText
                                )}>
                                <Box flexBasis="5%">
                                  {getIconPerStatus(
                                    status,
                                    classes.iconsIndication
                                  )}
                                </Box>
                                <Box flexBasis="70%">
                                  <TextValue>
                                    {getVersionNamePath(
                                      fileName,
                                      testName,
                                      versionName
                                    )}
                                  </TextValue>
                                </Box>
                                <Box flexBasis="18%">
                                  <TextValue>
                                    {convertMillisIntoTimeText(timeTaken)}
                                  </TextValue>
                                </Box>
                                <Box
                                  display="flex"
                                  flexBasis="7%"
                                  justifyContent="space-evenly">
                                  <Tooltip title={SHOT_LABEL}>
                                    <IconButton
                                      aria-label={SHOT_LABEL}
                                      onClick={() =>
                                        handleVersionShots(
                                          vid,
                                          fileName,
                                          testName,
                                          versionName
                                        )
                                      }
                                      color="inherit"
                                      className={classes.icons}>
                                      <ViewCarouselIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Output">
                                    <IconButton
                                      aria-label="Output"
                                      onClick={() =>
                                        handleVersionOutput(
                                          c.completedBuildVersions[vid]
                                        )
                                      }
                                      color="inherit"
                                      className={classes.icons}>
                                      <DescriptionIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
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
      <Dialog
        TransitionComponent={Transition}
        onClose={closeDlg}
        fullWidth
        maxWidth="lg"
        open={dlg.open}
        classes={{paper: classes.dlgRoot}}>
        <DialogTitle disableTypography className={classes.dlgTitle}>
          {dlg.title}
        </DialogTitle>
        <DialogContent
          className={clsx(
            dlg.openerType === DlgOpenerType.SCREENSHOT &&
              classes.dlgContentNoPadding
          )}>
          {dlg.content}
        </DialogContent>
      </Dialog>
    </>
  );
};

CompletedBuilds.propTypes = {
  closeHandler: PropTypes.func.isRequired,
};

export default CompletedBuilds;

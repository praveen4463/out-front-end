import React, {useState} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CodeIcon from '@material-ui/icons/CodeOutlined';
import PropTypes from 'prop-types';
import Link from '@material-ui/core/Link';
import ButtonBase from '@material-ui/core/ButtonBase';
import DescriptionIcon from '@material-ui/icons/DescriptionOutlined';
import WallpaperIcon from '@material-ui/icons/WallpaperOutlined';
import ViewCarouselIcon from '@material-ui/icons/ViewCarouselOutlined';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Slide from '@material-ui/core/Slide';
import MuiSkeleton from '@material-ui/lab/Skeleton';
import CloseIcon from '@material-ui/icons/Close';
import ErrorIcon from '@material-ui/icons/Error';
import clsx from 'clsx';
import axios from 'axios';
import {CompletedBuildDetailsObj} from '../model';
import Tooltip from '../TooltipCustom';
import {
  TestStatus,
  Browsers,
  BuildConfigLabels,
  BuildConfigFields,
  BuildCapsFields,
  BuildCapsLabels,
} from '../Constants';
import {
  getTestStatusDisplayName,
  getOsDisplayName,
  getOsIcon,
  getBrowserDisplayName,
  getBrowserIcon,
  getVersionNamePath,
  handleApiError,
  getDriverLogsEndpoint,
  getPerformanceLogsEndpoint,
  getElementShotNamesEndpoint,
  getCapturedBuildCapabilityEndpoint,
  getCapturedBuildVarsEndpoint,
  getCapturedGlobalVarsEndpoint,
  getNewIntlComparer,
  getRunnerPreferencesEndpoint,
  getVersionOutputDetailsEndpoint,
  getBuildOutputDetailsEndpoint,
  getCapturedCodeEndpoint,
} from '../common';
import ShotsViewer from './ShotsViewer';
import Application from '../config/application';
import {convertMillisIntoTimeText} from '../buildsCommon';
import BuildStatusIcon from './BuildStatusIcon';
import CodeViewer from './CodeViewer';
import {formatTimestamp} from '../utils';

const Skeleton = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.contrastText,
    margin: theme.spacing(1),
  },
}))(MuiSkeleton);

const Label = withStyles((theme) => ({
  root: {
    fontSize: theme.typography.pxToRem(14),
    color: theme.palette.text.medium,
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

const ViewRow = ({className, children}) => {
  return (
    <Box display="flex" p={1} className={className} data-testid="viewRow">
      {children}
    </Box>
  );
};

ViewRow.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

ViewRow.defaultProps = {
  className: '',
};

const Transition = React.forwardRef(function Transition(props, ref) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Slide direction="down" ref={ref} {...props} />;
});

const useStyles = makeStyles((theme) => ({
  icons: {
    padding: 0,
    borderRadius: 'unset',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  marginR4: {
    marginRight: theme.spacing(0.5),
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
    '&:hover': {
      textDecoration: 'underline',
    },
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
    color: theme.palette.text.medium,
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
    margin: theme.spacing(1, 0),
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
  viewRow: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  textValue: {
    fontSize: theme.typography.pxToRem(14),
    color: theme.palette.text.main,
  },
  testNameSeparator: {
    fontSize: theme.typography.pxToRem(18),
    color: theme.palette.text.light,
    margin: theme.spacing(0, 0.5),
    fontWeight: '800',
  },
}));

const SHOT_LABEL = 'Screenshots & Playback';
const LOG_TYPE = {
  DRIVER: 'DRIVER',
  PERF: 'PERF',
};
const VAR_TYPE = {
  GLOBAL: 'GLOBAL',
  BUILD: 'BUILD',
};

const DlgOpenerType = {
  LOG: 'LOG',
  SCREENSHOT: 'SCREENSHOT',
  ELEMENT_SHOT: 'ELEMENT_SHOT',
  DATA: 'DATA',
  CODE: 'CODE',
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

const CompletedBuildDetails = ({completedBuildDetailsObj: cbd}) => {
  const [dlg, setDlg] = useState(new DialogState());
  const classes = useStyles();

  const getBorderByStatus = (status) => {
    if (status === TestStatus.SUCCESS) {
      return classes.borderSuccess;
    }
    if (status === TestStatus.ERROR) {
      return classes.borderFailure;
    }
    return classes.borderNeutral;
  };

  const getErrorTypeMsg = (msg) => {
    return (
      <>
        <ErrorIcon color="error" className={classes.marginR4} />
        <Typography variant="body1" className={classes.error}>
          {msg}
        </Typography>
      </>
    );
  };

  const getLoader = (key) => {
    return (
      <Box
        display="flex"
        flexDirection="column"
        flex={1}
        key={key ?? ''}
        alignItems="center">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <Skeleton variant="text" width="80%" height={15} key={k} />
        ))}
      </Box>
    );
  };

  const getViewRow = (label, value, labelBases) => {
    return (
      <ViewRow className={classes.viewRow}>
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
        data-testid="viewRow"
        key={label}>
        <Box
          color="text.medium"
          fontSize="body1.fontSize"
          fontWeight={500}
          flexBasis="40%">
          {`${label}:`}
        </Box>
        <Box
          color="text.main"
          fontSize="body1.fontSize"
          fontWeight={500}
          ml={0.5}>
          {isBool ? boolText(value) : value}
        </Box>
      </Box>
    );
  };

  const closeDlg = () => {
    setDlg(() => new DialogState());
  };

  const getDlgTitle = (title, versionId, fileName, testName, versionName) => {
    return (
      <Box display="flex" alignItems="center" color="text.medium">
        {title ? (
          <Typography variant="body1" style={{fontWeight: 600}}>
            {title}
          </Typography>
        ) : null}
        <Typography
          variant="body1"
          className={clsx(
            title && classes.marginL16
          )}>{`# ${cbd.buildId}`}</Typography>
        {versionId ? (
          <Typography variant="body1" className={classes.marginL16}>
            {getVersionNamePath(fileName, testName, versionName)}
          </Typography>
        ) : null}
        <Box flex={1} />
        <IconButton
          aria-label="Close"
          onClick={closeDlg}
          title="Close"
          color="inherit">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const handleBuildShots = () => {
    const content = (
      <ShotsViewer buildId={cbd.buildId} shotBucket={cbd.shotBucket} />
    );
    setDlg(
      () =>
        new DialogState(true, getDlgTitle(), content, DlgOpenerType.SCREENSHOT)
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

    async function getLogs() {
      let endpointFunc;
      switch (logType) {
        case LOG_TYPE.DRIVER:
          endpointFunc = getDriverLogsEndpoint;
          break;
        case LOG_TYPE.PERF:
          endpointFunc = getPerformanceLogsEndpoint;
          break;
        default:
          throw new Error(`Unrecognized log type: ${logType}`);
      }
      try {
        const {data} = await axios(endpointFunc(cbd.buildId));
        if (!data) {
          throw new Error('No logs received despite build being done');
        }
        setDlgState(
          <Box className={classes.outputPanelContent} flex={1}>
            <Box display="flex" flexDirection="column" px={1}>
              <pre className={classes.output}>{data}</pre>
            </Box>
          </Box>
        );
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => setDlgState(errorOnDlg(getErrorTypeMsg(errorMsg))),
          "Couldn't fetch logs"
        );
      }
    }
    getLogs();
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
    const shotUriTemplate = `${Application.STORAGE_HOST}/${Application.ELEM_SHOT_BUCKET}/build-${cbd.buildId}/${SHOT_NAME_TMPL}`;
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
    async function getElementShots() {
      try {
        const {data} = await axios(getElementShotNamesEndpoint(cbd.buildId));
        if (!data) {
          throw new Error('No shots received despite build being done');
        }
        setDlgState(
          <Box display="flex" flexDirection="column">
            {data.map((n) => (
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
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => setDlgState(errorOnDlg(getErrorTypeMsg(errorMsg))),
          "Couldn't fetch element screenshots"
        );
      }
    }
    getElementShots();
    setDlgState(getLoader());
  };

  const getOs = (formatText = true) => {
    const name = getOsDisplayName(cbd.os);
    return (
      <Box display="flex" alignItems="center">
        <img
          src={getOsIcon(cbd.os)}
          alt={cbd.os}
          style={{marginRight: '4px'}}
        />
        {formatText ? <TextValue>{name}</TextValue> : name}
      </Box>
    );
  };

  const getBrowser = (formatText = true) => {
    const name = `${getBrowserDisplayName(cbd.browserName)} ${
      cbd.browserVersion
    }`;
    return (
      <Box display="flex" alignItems="center">
        <img
          src={getBrowserIcon(cbd.browserName)}
          alt={cbd.os}
          style={{marginRight: '4px'}}
        />
        {formatText ? <TextValue>{name}</TextValue> : name}
      </Box>
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
    async function getCapturedBuildCaps() {
      try {
        const {data} = await axios(
          getCapturedBuildCapabilityEndpoint(cbd.buildId)
        );
        setDlgState(
          <Box display="flex" flexDirection="column">
            {getDataRow(BuildCapsLabels.NAME, data[BuildCapsFields.NAME])}
            <Box className={classes.hoverOver}>
              {getDataRow('OS', getOs(false))}
            </Box>
            <Box className={classes.hoverOver}>
              {getDataRow('Browser', getBrowser(false))}
            </Box>
            {getDataRow(BuildCapsLabels.AIC, data[BuildCapsFields.AIC], true)}
            {data[BuildCapsFields.BN] === Browsers.CHROME.VALUE && (
              <>
                {getDataRow(
                  BuildCapsLabels.CVL,
                  data[BuildCapsFields.CVL],
                  true
                )}
                {getDataRow(
                  BuildCapsLabels.CSL,
                  data[BuildCapsFields.CSL],
                  true
                )}
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
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => setDlgState(errorOnDlg(getErrorTypeMsg(errorMsg))),
          "Couldn't fetch build capabilities"
        );
      }
    }
    getCapturedBuildCaps();
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
    async function getVars() {
      let endpointFunc;
      switch (varType) {
        case VAR_TYPE.BUILD:
          endpointFunc = getCapturedBuildVarsEndpoint;
          break;
        case VAR_TYPE.GLOBAL:
          endpointFunc = getCapturedGlobalVarsEndpoint;
          break;
        default:
          throw new Error(`Unrecognized var type: ${varType}`);
      }
      try {
        const {data} = await axios(endpointFunc(cbd.buildId));
        data.sort((a, b) => getNewIntlComparer()(a.key, b.key));
        setDlgState(
          <Box display="flex" flexDirection="column">
            {data.map((v) => getDataRow(v.key, v.value))}
          </Box>
        );
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => setDlgState(errorOnDlg(getErrorTypeMsg(errorMsg))),
          "Couldn't fetch variables"
        );
      }
    }
    getVars();
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
    async function getRunnerPrefs() {
      try {
        const {data} = await axios(getRunnerPreferencesEndpoint(cbd.buildId));
        setDlgState(
          <Box display="flex" flexDirection="column">
            {getDataRow(
              BuildConfigLabels.AOF,
              data[BuildConfigFields.AOF],
              true
            )}
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
            {getDataRow(
              BuildConfigLabels.ART,
              data[BuildConfigFields.ART],
              true
            )}
            {getDataRow(
              BuildConfigLabels.ADAC,
              data[BuildConfigFields.ADAC],
              true
            )}
          </Box>
        );
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => setDlgState(errorOnDlg(getErrorTypeMsg(errorMsg))),
          "Couldn't fetch runner's preferences"
        );
      }
    }
    getRunnerPrefs();
    setDlgState(getLoader());
  };

  const handleVersionShots = (versionId, fileName, testName, versionName) => {
    const content = (
      <ShotsViewer
        buildId={cbd.buildId}
        shotBucket={cbd.shotBucket}
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

  const getOutput = (buildOutputDetailsByVersionList) => {
    const anyOutput = buildOutputDetailsByVersionList.some(
      (bod) => bod.outputsWithLineBreak || bod.error
    );
    return (
      <>
        <Box className={classes.outputPanelContent} flex={1}>
          {buildOutputDetailsByVersionList.map((bod) => (
            <Box
              display="flex"
              flexDirection="column"
              px={1}
              key={bod.versionId}>
              <pre className={classes.output}>
                {bod.outputsWithLineBreak || ''}
              </pre>
              <pre className={clsx(classes.output, classes.outputError)}>
                {bod.error || ''}
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

  const handleOutput = (dlgTitle, versionId = null) => {
    const setDlgState = (output) => {
      setDlg(() => new DialogState(true, dlgTitle, output, DlgOpenerType.LOG));
    };
    const endpoint = versionId
      ? getVersionOutputDetailsEndpoint(cbd.buildId, versionId)
      : getBuildOutputDetailsEndpoint(cbd.buildId);
    axios(endpoint)
      .then(({data}) => {
        setDlgState(getOutput(Array.isArray(data) ? data : [data]));
      })
      .catch((error) => {
        handleApiError(
          error,
          (errorMsg) => setDlgState(errorOnDlg(getErrorTypeMsg(errorMsg))),
          "Couldn't fetch output"
        );
      });
    setDlgState(getLoader());
  };

  const handleBuildOutput = () => {
    handleOutput(getDlgTitle());
  };

  const handleVersionOutput = (testVersionDetails) => {
    const {versionId, fileName, testName, versionName} = testVersionDetails;
    handleOutput(
      getDlgTitle(null, versionId, fileName, testName, versionName),
      versionId
    );
  };

  const formatCode = (code) => {
    return <CodeViewer rawCode={code} />;
  };

  const handleCode = (testVersionDetails) => {
    const {versionId, fileName, testName, versionName} = testVersionDetails;
    const setDlgState = (code) => {
      setDlg(
        () =>
          new DialogState(
            true,
            getDlgTitle(null, versionId, fileName, testName, versionName),
            code,
            DlgOpenerType.CODE
          )
      );
    };
    axios(getCapturedCodeEndpoint(cbd.buildId, versionId))
      .then(({data}) => {
        setDlgState(formatCode(data));
      })
      .catch((error) => {
        handleApiError(
          error,
          (errorMsg) => setDlgState(errorOnDlg(getErrorTypeMsg(errorMsg))),
          "Couldn't fetch output"
        );
      });
    setDlgState(getLoader());
  };

  return (
    <>
      <Box display="flex" flexDirection="column">
        <Box
          display="flex"
          flexDirection="column"
          className={getBorderByStatus(cbd.finalStatus)}
          boxShadow={3}>
          <Box
            display="flex"
            p={1}
            alignItems="center"
            className={classes.borderLightBottom}>
            <BuildStatusIcon
              status={cbd.finalStatus}
              className={classes.marginR4}
            />
            <Typography
              variant="body1"
              className={classes.marginR4}
              style={{fontWeight: 500}}>
              {getTestStatusDisplayName(cbd.finalStatus)}
            </Typography>
            {cbd.finalStatus === TestStatus.ABORTED
              ? getErrorTypeMsg('Build aborted due to an unexpected exception')
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
                'Created On',
                <TextValue>
                  {formatTimestamp(cbd.createDate, 'MMM dd, yyyy HH:mm:ss')}
                </TextValue>
              )}
              {getViewRow(
                'Total Time',
                <TextValue>
                  {convertMillisIntoTimeText(
                    (cbd.allDoneDate - cbd.createDate) * 1000
                  )}
                </TextValue>
              )}
              {getViewRow(
                'Tests Run Time',
                <TextValue>
                  {convertMillisIntoTimeText(cbd.testTimeMillis)}
                </TextValue>
              )}
              {getViewRow('OS', getOs())}
              {getViewRow('Browser', getBrowser())}
              {getViewRow(
                BuildConfigLabels.DR,
                <TextValue>{cbd.resolution}</TextValue>
              )}
              {getViewRow(
                BuildConfigLabels.TZ,
                <TextValue>{cbd.timezone}</TextValue>
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
                  onClick={() => handleBuildOutput()}
                  title="Output"
                  color="inherit"
                  className={classes.icons}>
                  <DescriptionIcon fontSize="small" />
                </IconButton>,
                '90%'
              )}
              {cbd.driverLogsAvailable
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
              {cbd.perfLogsAvailable
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
              {cbd.elemShotsAvailable
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
                <ButtonBase className={classes.link} onClick={handleBuildCaps}>
                  {cbd.buildCapsName}
                </ButtonBase>
              )}
              {getViewRow(
                BuildConfigLabels.SBVIPK,
                <ButtonBase className={classes.link} onClick={handleBuildVars}>
                  View
                </ButtonBase>
              )}
              {getViewRow(
                'Global Variables',
                <ButtonBase className={classes.link} onClick={handleGlobalVars}>
                  View
                </ButtonBase>
              )}
              {getViewRow(
                "Runner's Preferences",
                <ButtonBase
                  className={classes.link}
                  onClick={handleRunnerPrefs}>
                  View
                </ButtonBase>
              )}
            </Box>
          </Box>
        </Box>
        <Box mt={1} display="flex" flexDirection="column" boxShadow={3}>
          <Box
            p={1}
            boxShadow={1}
            display="flex"
            className={clsx(classes.borderNeutral, classes.testsHeading)}
            fontSize="body2.fontSize"
            fontWeight={500}
            color="text.medium">
            <Box flexBasis="5%" />
            <Box flexBasis="70%">Tests</Box>
            <Box flexBasis="18%">Duration</Box>
            <Box display="flex" flexBasis="7%" />
          </Box>
          {cbd.testVersionDetailsList.map((testVersionDetails) => {
            const {
              versionId,
              status,
              timeTakenMillis,
              fileName,
              testName,
              versionName,
            } = testVersionDetails;
            return (
              <Box
                p={1}
                boxShadow={3}
                display="flex"
                key={versionId}
                className={clsx(
                  getBorderByStatus(status),
                  classes.contrastText
                )}>
                <Box flexBasis="5%" display="flex" alignItems="center">
                  <BuildStatusIcon
                    status={status}
                    className={classes.marginR4}
                  />
                </Box>
                <Box flexBasis="70%" display="flex" alignItems="center">
                  <span className={classes.textValue}>{fileName}</span>
                  <span className={classes.testNameSeparator}>&gt;</span>
                  <span className={classes.textValue}>{testName}</span>
                  <span className={classes.testNameSeparator}>&gt;</span>
                  <span className={classes.textValue}>{versionName}</span>
                </Box>
                <Box flexBasis="18%" display="flex" alignItems="center">
                  <TextValue>
                    {convertMillisIntoTimeText(timeTakenMillis)}
                  </TextValue>
                </Box>
                <Box
                  display="flex"
                  flexBasis="7%"
                  justifyContent="space-evenly"
                  alignItems="center">
                  <Tooltip title={SHOT_LABEL}>
                    <IconButton
                      aria-label={SHOT_LABEL}
                      onClick={() =>
                        handleVersionShots(
                          versionId,
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
                      onClick={() => handleVersionOutput(testVersionDetails)}
                      color="inherit"
                      className={classes.icons}
                      disabled={
                        timeTakenMillis === 0 &&
                        (status === TestStatus.STOPPED ||
                          status === TestStatus.ABORTED)
                      }>
                      <DescriptionIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Code">
                    <IconButton
                      aria-label="Code"
                      onClick={() => handleCode(testVersionDetails)}
                      color="inherit"
                      className={classes.icons}>
                      <CodeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
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
            (dlg.openerType === DlgOpenerType.SCREENSHOT ||
              dlg.openerType === DlgOpenerType.CODE) &&
              classes.dlgContentNoPadding
          )}>
          {dlg.content}
        </DialogContent>
      </Dialog>
    </>
  );
};

CompletedBuildDetails.propTypes = {
  completedBuildDetailsObj: PropTypes.instanceOf(CompletedBuildDetailsObj)
    .isRequired,
};

export default CompletedBuildDetails;

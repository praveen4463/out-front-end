import React, {useState} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import Link from '@material-ui/core/Link';
import ButtonBase from '@material-ui/core/ButtonBase';
import DescriptionIcon from '@material-ui/icons/DescriptionOutlined';
import WallpaperIcon from '@material-ui/icons/WallpaperOutlined';
import ViewCarouselIcon from '@material-ui/icons/ViewCarouselOutlined';
import axios from 'axios';
import {CompletedBuildDetailsObj, BuildDialogState} from '../model';
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
  handleApiError,
  getDriverLogsEndpoint,
  getPerformanceLogsEndpoint,
  getElementShotNamesEndpoint,
  getCapturedBuildCapabilityEndpoint,
  getCapturedBuildVarsEndpoint,
  getCapturedGlobalVarsEndpoint,
  getNewIntlComparer,
  getRunnerPreferencesEndpoint,
} from '../common';
import ShotsViewer from './ShotsViewer';
import Application from '../config/application';
import {
  convertMillisIntoTimeText,
  DlgOpenerType,
  SHOT_LABEL,
} from '../buildsCommon';
import BuildStatusIcon from './BuildStatusIcon';
import {formatTimestamp} from '../utils';
import TitleDialog from './TitleDialog';
import BuildPagesDlgTitle from './BuildPagesDlgTitle';
import BuildOutput from './BuildOutput';
import ErrorMessageWithIcon from './ErrorMessageWithIcon';
import Loader from './Loader';
import TestVersionDetailsView from './TestVersionDetailsView';

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
  error: {
    fontSize: '0.8rem',
    color: theme.palette.error.main,
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
  contrastText: {
    color: theme.palette.background.contrastText,
  },
  fadedColor: {
    color: theme.palette.text.hint,
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
}));

const LOG_TYPE = {
  DRIVER: 'DRIVER',
  PERF: 'PERF',
};
const VAR_TYPE = {
  GLOBAL: 'GLOBAL',
  BUILD: 'BUILD',
};

const boolText = (val) => {
  return val ? 'Yes' : 'No';
};

const CompletedBuildDetails = ({completedBuildDetailsObj: cbd}) => {
  const [dlg, setDlg] = useState(new BuildDialogState());
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
    setDlg(() => new BuildDialogState());
  };

  const getDlgTitle = (title, testVersionDetails) => {
    return (
      <BuildPagesDlgTitle
        buildId={cbd.buildId}
        title={title}
        testVersionDetails={testVersionDetails}
        closeDlg={closeDlg}
      />
    );
  };

  const handleBuildShots = () => {
    const content = (
      <ShotsViewer buildId={cbd.buildId} shotBucket={cbd.shotBucket} />
    );
    setDlg(
      () =>
        new BuildDialogState(
          true,
          getDlgTitle(),
          content,
          DlgOpenerType.SCREENSHOT
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

  const handleLogs = (logType) => {
    const setDlgState = (output) => {
      setDlg(
        () =>
          new BuildDialogState(
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
          (errorMsg) => setDlgState(<ErrorMessageWithIcon msg={errorMsg} />),
          "Couldn't fetch logs"
        );
      }
    }
    getLogs();
    setDlgState(<Loader rows={6} />);
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
          new BuildDialogState(
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
          (errorMsg) => setDlgState(<ErrorMessageWithIcon msg={errorMsg} />),
          "Couldn't fetch element screenshots"
        );
      }
    }
    getElementShots();
    setDlgState(<Loader rows={6} />);
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
          new BuildDialogState(
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
          (errorMsg) => setDlgState(<ErrorMessageWithIcon msg={errorMsg} />),
          "Couldn't fetch build capabilities"
        );
      }
    }
    getCapturedBuildCaps();
    setDlgState(<Loader rows={6} />);
  };

  const handleVars = (varType) => {
    const setDlgState = (output) => {
      setDlg(
        () =>
          new BuildDialogState(
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
          (errorMsg) => setDlgState(<ErrorMessageWithIcon msg={errorMsg} />),
          "Couldn't fetch variables"
        );
      }
    }
    getVars();
    setDlgState(<Loader rows={6} />);
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
          new BuildDialogState(
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
          (errorMsg) => setDlgState(<ErrorMessageWithIcon msg={errorMsg} />),
          "Couldn't fetch runner's preferences"
        );
      }
    }
    getRunnerPrefs();
    setDlgState(<Loader rows={6} />);
  };

  const handleBuildOutput = () => {
    setDlg(
      () =>
        new BuildDialogState(
          true,
          getDlgTitle(),
          <BuildOutput buildId={cbd.buildId} />,
          DlgOpenerType.LOG
        )
    );
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
            {cbd.finalStatus === TestStatus.ABORTED ? (
              <ErrorMessageWithIcon msg="Build aborted due to an unexpected exception" />
            ) : null}
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
        <TestVersionDetailsView
          buildId={cbd.buildId}
          shotBucket={cbd.shotBucket}
          testVersionDetailsList={cbd.testVersionDetailsList}
        />
      </Box>
      <TitleDialog
        showDialog={dlg.open}
        closeDialog={closeDlg}
        titleContent={dlg.title}
        dlgContentNoPadding={
          dlg.openerType === DlgOpenerType.SCREENSHOT ||
          dlg.openerType === DlgOpenerType.CODE
        }>
        {dlg.content}
      </TitleDialog>
    </>
  );
};

CompletedBuildDetails.propTypes = {
  completedBuildDetailsObj: PropTypes.instanceOf(CompletedBuildDetailsObj)
    .isRequired,
};

export default CompletedBuildDetails;

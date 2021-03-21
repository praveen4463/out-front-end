import React, {useState} from 'react';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import {makeStyles, useTheme} from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import ViewCarouselIcon from '@material-ui/icons/ViewCarouselOutlined';
import DescriptionIcon from '@material-ui/icons/DescriptionOutlined';
import CodeIcon from '@material-ui/icons/CodeOutlined';
import axios from 'axios';
import {BuildDialogState, TestVersionDetails} from '../model';
import BuildStatusIcon from './BuildStatusIcon';
import {
  convertMillisIntoTimeText,
  DlgOpenerType,
  SHOT_LABEL,
  YET_TO_RUN,
} from '../buildsCommon';
import {TestStatus} from '../Constants';
import Tooltip from '../TooltipCustom';
import TitleDialog from './TitleDialog';
import BuildOutput from './BuildOutput';
import BuildPagesDlgTitle from './BuildPagesDlgTitle';
import CodeViewer from './CodeViewer';
import {getCapturedCodeEndpoint, handleApiError} from '../common';
import ErrorMessageWithIcon from './ErrorMessageWithIcon';
import Loader from './Loader';
import ShotsViewer from './ShotsViewer';

const useStyles = makeStyles((theme) => ({
  borderSuccess: {
    borderLeft: '3px solid #4caf50',
  },
  borderFailure: {
    borderLeft: `3px solid ${theme.palette.error.light}`,
  },
  borderNeutral: {
    borderLeft: '3px solid #868686',
  },
  testsHeading: {
    color: theme.palette.text.medium,
    backgroundColor: theme.palette.background.paperContrast,
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
}));

const TestVersionDetailsView = ({
  buildId,
  shotBucket,
  testVersionDetailsList,
  allTestsDone,
}) => {
  const [dlg, setDlg] = useState(new BuildDialogState());
  const theme = useTheme();
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

  const closeDlg = () => {
    setDlg(() => new BuildDialogState());
  };

  const getVersionStatusIcon = (testVersionDetails) => {
    const {status, currentLine, totalLines} = testVersionDetails;
    if (status === TestStatus.RUNNING && currentLine >= 1) {
      return (
        <CircularProgress
          variant="determinate"
          size={theme.spacing(3)}
          value={Math.round((currentLine / totalLines) * 100)}
          color="secondary"
          className={classes.marginR4}
        />
      );
    }
    return (
      <BuildStatusIcon
        status={status || YET_TO_RUN}
        className={classes.marginR4}
      />
    );
  };

  const handleVersionOutput = (testVersionDetails) => {
    const {versionId} = testVersionDetails;
    setDlg(
      () =>
        new BuildDialogState(
          true,
          (
            <BuildPagesDlgTitle
              buildId={buildId}
              testVersionDetails={testVersionDetails}
              closeDlg={closeDlg}
            />
          ),
          <BuildOutput buildId={buildId} versionId={versionId} />,
          DlgOpenerType.LOG
        )
    );
  };

  const formatCode = (code) => {
    return <CodeViewer rawCode={code} />;
  };

  const handleCode = (testVersionDetails) => {
    const {versionId} = testVersionDetails;
    const setDlgState = (code) => {
      setDlg(
        () =>
          new BuildDialogState(
            true,
            (
              <BuildPagesDlgTitle
                buildId={buildId}
                testVersionDetails={testVersionDetails}
                closeDlg={closeDlg}
              />
            ),
            code,
            DlgOpenerType.CODE
          )
      );
    };
    axios(getCapturedCodeEndpoint(buildId, versionId))
      .then(({data}) => {
        setDlgState(formatCode(data));
      })
      .catch((error) => {
        handleApiError(
          error,
          (errorMsg) => setDlgState(<ErrorMessageWithIcon msg={errorMsg} />),
          "Couldn't fetch output"
        );
      });
    setDlgState(<Loader rows={6} />);
  };

  const handleVersionShots = (testVersionDetails) => {
    const {versionId, fileName, testName, versionName} = testVersionDetails;
    const content = (
      <ShotsViewer
        buildId={buildId}
        shotBucket={shotBucket}
        versionId={versionId}
        fileName={fileName}
        testName={testName}
        versionName={versionName}
      />
    );
    setDlg(
      () =>
        new BuildDialogState(
          true,
          (
            <BuildPagesDlgTitle
              buildId={buildId}
              testVersionDetails={testVersionDetails}
              closeDlg={closeDlg}
            />
          ),
          content,
          DlgOpenerType.SCREENSHOT
        )
    );
  };

  const didVersionNotRun = (testVersionDetails) => {
    const {status, timeTakenMillis} = testVersionDetails;
    return (
      timeTakenMillis === 0 &&
      (status === TestStatus.STOPPED || status === TestStatus.ABORTED)
    );
  };

  return (
    <>
      <Box mt={1} display="flex" flexDirection="column" boxShadow={3} pb={2}>
        <Box
          p={1}
          boxShadow={1}
          display="flex"
          bgcolor="background.paperContrast"
          className={classes.borderNeutral}
          fontSize="body2.fontSize"
          fontWeight={500}
          color="text.medium">
          <Box flexBasis="5%" />
          <Box flexBasis="70%">Tests</Box>
          <Box flexBasis="18%">Duration</Box>
          <Box display="flex" flexBasis="7%" />
        </Box>
        {testVersionDetailsList.map((testVersionDetails) => {
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
              color="text.main"
              className={getBorderByStatus(status)}>
              <Box flexBasis="5%" display="flex" alignItems="center">
                {getVersionStatusIcon(testVersionDetails)}
              </Box>
              <Box flexBasis="70%" display="flex" alignItems="center">
                <span className={classes.textValue}>{fileName}</span>
                <span className={classes.testNameSeparator}>&gt;</span>
                <span className={classes.textValue}>{testName}</span>
                <span className={classes.testNameSeparator}>&gt;</span>
                <span className={classes.textValue}>{versionName}</span>
              </Box>
              <Box
                flexBasis="18%"
                display="flex"
                alignItems="center"
                className={classes.textValue}>
                {convertMillisIntoTimeText(timeTakenMillis)}
              </Box>
              <Box
                display="flex"
                flexBasis="7%"
                justifyContent="space-evenly"
                alignItems="center">
                <Tooltip title={SHOT_LABEL}>
                  <span>
                    {/* enable shots only when tests is done because shots
                    esdb data may not be pushed until all are done. */}
                    <IconButton
                      aria-label={SHOT_LABEL}
                      onClick={() => handleVersionShots(testVersionDetails)}
                      color="inherit"
                      disabled={
                        !status ||
                        status === TestStatus.RUNNING ||
                        !allTestsDone ||
                        didVersionNotRun(testVersionDetails)
                      }
                      className={classes.icons}>
                      <ViewCarouselIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Output">
                  <span>
                    <IconButton
                      aria-label="Output"
                      onClick={() => handleVersionOutput(testVersionDetails)}
                      color="inherit"
                      className={classes.icons}
                      disabled={
                        !status ||
                        status === TestStatus.RUNNING ||
                        didVersionNotRun(testVersionDetails)
                      }>
                      <DescriptionIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Captured code at build time">
                  <IconButton
                    aria-label="Captured code at build time"
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

TestVersionDetailsView.propTypes = {
  buildId: PropTypes.number.isRequired,
  shotBucket: PropTypes.string.isRequired,
  testVersionDetailsList: PropTypes.arrayOf(
    PropTypes.instanceOf(TestVersionDetails)
  ).isRequired,
  allTestsDone: PropTypes.bool,
};

TestVersionDetailsView.defaultProps = {
  allTestsDone: true,
};

export default TestVersionDetailsView;

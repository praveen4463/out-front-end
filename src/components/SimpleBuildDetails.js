import React, {useState} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import Link from '@material-ui/core/Link';
import IconButton from '@material-ui/core/IconButton';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ViewCarouselIcon from '@material-ui/icons/ViewCarouselOutlined';
import {useQuery} from 'react-query';
import clsx from 'clsx';
import {CompletedBuildDetailsObj, BuildDialogState} from '../model';
import {TestStatus, QueryKeys} from '../Constants';
import {
  getTestStatusDisplayName,
  getBrowserDisplayName,
  getBrowserIcon,
} from '../common';
import ShotsViewer from './ShotsViewer';
import {
  convertMillisIntoTimeText,
  DlgOpenerType,
  SHOT_LABEL,
} from '../buildsCommon';
import BuildStatusIcon from './BuildStatusIcon';
import {formatTimestamp} from '../utils';
import TitleDialog from './TitleDialog';
import BuildPagesDlgTitle from './BuildPagesDlgTitle';
import Loader from './Loader';
import {completedVersionStatusFetch} from '../api/fetches';

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

const useSummaryStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(1),
    '&$expanded': {
      backgroundColor: theme.palette.action.focus,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  expanded: {},
  content: {
    alignItems: 'center',
  },
}));

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
  output: {
    fontFamily: "'Fira Mono', 'Courier New', Courier, monospace",
    fontSize: theme.typography.pxToRem(14),
    fontWeight: 'normal',
    lineHeight: 1.5,
    color: theme.palette.background.contrastText,
    margin: theme.spacing(1, 0),
  },
  outputError: {
    color: theme.palette.error.light,
    marginTop: 0,
  },
  hoverOver: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  buildsContainer: {
    overflowY: 'auto',
  },
  viewRow: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
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
}));

const SimpleBuildDetails = ({completedBuildDetailsObj: cbd}) => {
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const {data: currentVersionStatus, error, isLoading} = useQuery(
    [QueryKeys.COMPLETED_VERSION_STATUS, cbd.buildId, currentVersionId],
    completedVersionStatusFetch,
    {
      enabled: !!currentVersionId,
    }
  );
  const [dlg, setDlg] = useState(new BuildDialogState());
  const classes = useStyles();
  const summary = useSummaryStyles();

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

  const closeDlg = () => {
    setDlg(() => new BuildDialogState());
  };

  const getVersionStatusIcon = (testVersionDetails) => {
    const {status} = testVersionDetails;
    return <BuildStatusIcon status={status} className={classes.marginR4} />;
  };

  const handleVersionShots = (testVersionDetails) => {
    const {versionId, fileName, testName, versionName} = testVersionDetails;
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
        new BuildDialogState(
          true,
          (
            <BuildPagesDlgTitle
              buildId={cbd.buildId}
              testVersionDetails={testVersionDetails}
              closeDlg={closeDlg}
            />
          ),
          content,
          DlgOpenerType.SCREENSHOT
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
          </Box>
          <Box display="flex" p={1}>
            <Box flexBasis="25%">
              {getViewRow(
                'Created On',
                <TextValue>
                  {formatTimestamp(cbd.createDate, 'MMM dd, yyyy HH:mm:ss')}
                </TextValue>,
                '30%'
              )}
            </Box>
            <Box px={2} />
            <Box flexBasis="20%">
              {getViewRow('Browser', getBrowser(), '30%')}
            </Box>
          </Box>
        </Box>
        <Box mt={1} display="flex" flexDirection="column" boxShadow={3} pb={2}>
          <Box
            py={1}
            pl={1}
            pr={6}
            boxShadow={1}
            display="flex"
            bgcolor="background.paperContrast"
            className={classes.borderNeutral}
            fontSize="body2.fontSize"
            fontWeight={500}
            color="text.medium">
            <Box flexBasis="5%" />
            <Box flexBasis="83%">Tests</Box>
            <Box flexBasis="12%">Duration</Box>
          </Box>
          {cbd.testVersionDetailsList
            .filter((l) => l.status === TestStatus.ERROR)
            .map((testVersionDetails) => {
              const {
                versionId,
                status,
                timeTakenMillis,
                testName,
                fileName,
              } = testVersionDetails;
              return (
                <Accordion
                  TransitionProps={{unmountOnExit: true}}
                  expanded={currentVersionId === versionId}
                  onChange={(e, isExpanded) =>
                    setCurrentVersionId(isExpanded ? versionId : null)
                  }
                  key={versionId}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`${versionId}-content`}
                    id={`${versionId}-header`}
                    classes={{
                      root: clsx(summary.root, getBorderByStatus(status)),
                      expanded: summary.expanded,
                      content: summary.content,
                    }}>
                    <Box flexBasis="5%" display="flex" alignItems="center">
                      {getVersionStatusIcon(testVersionDetails)}
                    </Box>
                    <Box flexBasis="83%" display="flex" alignItems="center">
                      <span className={classes.textValue}>{testName}</span>
                    </Box>
                    <Box
                      flexBasis="12%"
                      display="flex"
                      alignItems="center"
                      className={classes.textValue}>
                      {convertMillisIntoTimeText(timeTakenMillis)}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {isLoading ? <Loader rows={4} /> : null}
                    {error ? (
                      <Typography variant="body2" color="error">
                        {error}
                      </Typography>
                    ) : null}
                    {currentVersionStatus ? (
                      <Box display="flex" flexDirection="column" flex={1}>
                        {getViewRow(
                          SHOT_LABEL,
                          <IconButton
                            aria-label={SHOT_LABEL}
                            onClick={() =>
                              handleVersionShots(testVersionDetails)
                            }
                            title={SHOT_LABEL}
                            disabled={!cbd.shotsAvailable}
                            color="inherit"
                            className={classes.icons}>
                            <ViewCarouselIcon fontSize="small" />
                          </IconButton>,
                          '15%'
                        )}
                        {getViewRow(
                          'File',
                          <TextValue>{fileName}</TextValue>,
                          '15%'
                        )}
                        {getViewRow(
                          'URL',
                          currentVersionStatus.urlUponError ? (
                            <Link
                              href={`${currentVersionStatus.urlUponError}`}
                              rel="noopener"
                              target="_blank">
                              <TextValue>
                                {currentVersionStatus.urlUponError}
                              </TextValue>
                            </Link>
                          ) : (
                            <TextValue>-</TextValue>
                          ),
                          '15%'
                        )}
                        {getViewRow(
                          'Error',
                          <pre
                            className={clsx(
                              classes.output,
                              classes.outputError
                            )}>
                            <Box
                              style={{
                                wordBreak: 'break-word',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                              }}>
                              {currentVersionStatus.error}
                            </Box>
                          </pre>,
                          '15%'
                        )}
                      </Box>
                    ) : null}
                  </AccordionDetails>
                </Accordion>
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
      </Box>
    </>
  );
};

SimpleBuildDetails.propTypes = {
  completedBuildDetailsObj: PropTypes.instanceOf(CompletedBuildDetailsObj)
    .isRequired,
};

export default SimpleBuildDetails;

import React from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import StopIcon from '@material-ui/icons/Stop';
import BuildIcon from '@material-ui/icons/Build';
import Tooltip from '../../TooltipCustom';

const useStyle = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
  },
  breadcrumb: {
    fontSize: '0.65rem',
    opacity: '0.6',
  },
  accordionDetails: {
    height: theme.spacing(25),
    overflowY: 'scroll',
    borderTop: `1px solid ${theme.palette.border.light}`,
  },
  fontSizeSmall: {
    fontSize: '1rem',
  },
  fontSizeXSmall: {
    fontSize: '0.8rem',
  },
  iconButton: {
    padding: `${theme.spacing(0.25)}px ${theme.spacing(4)}px ${theme.spacing(
      0.25
    )}px ${theme.spacing(4)}px`,
    '&:hover': {
      backgroundColor: 'unset',
    },
  },
}));

const useSummaryStyle = makeStyles((theme) => ({
  root: {
    opacity: theme.textOpacity.highEmphasis,
    alignItems: 'center',
    minHeight: 0,
    '&$expanded': {
      minHeight: 0,
    },
  },
  expanded: {
    minHeight: 0,
  },
  content: {
    minHeight: 0,
    margin: 0,
    '&$expanded': {
      margin: 0,
    },
  },
  expandIcon: {
    padding: 0,
  },
}));

const TabPanel = React.memo(({version, testName, fileName}) => {
  const [expanded, setExpanded] = React.useState(false);
  const classes = useStyle();
  const summary = useSummaryStyle();

  const handleChange = () => (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      flex={1}
      id={`scrollable-auto-tabpanel-${version.id}`}
      aria-labelledby={`scrollable-auto-tab-${version.id}`}
      className={classes.root}>
      <Box boxShadow={3}>
        <Typography
          variant="caption"
          className={classes.breadcrumb}
          data-testid="tab-panel-breadcrumb">
          {`${fileName} > ${testName} > ${version.name}`}
        </Typography>
      </Box>
      <Box flex={1}>
        <Typography variant="body1" data-testid="code-editor-holder">
          {version.code}
        </Typography>
      </Box>
      <Box>
        <Accordion expanded={expanded} onChange={handleChange()} square>
          <AccordionSummary
            expandIcon={<ExpandLessIcon />}
            id={`build-section-tabpanel-${version.id}`}
            classes={{
              root: summary.root,
              expanded: summary.expanded,
              content: summary.content,
              expandIcon: summary.expandIcon,
            }}>
            <Tooltip title="Run Build For This Version">
              <IconButton
                aria-label="Run Build For This Version"
                className={classes.iconButton}
                disableFocusRipple
                disableRipple>
                <PlayArrowIcon
                  fontSize="small"
                  classes={{fontSizeSmall: classes.fontSizeSmall}}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Stop Build">
              <IconButton
                aria-label="Stop Build For This Version"
                className={classes.iconButton}
                disableFocusRipple
                disableRipple>
                <StopIcon
                  color="disabled"
                  fontSize="small"
                  classes={{fontSizeSmall: classes.fontSizeSmall}}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Parse This Version">
              <IconButton
                aria-label="Parse This Version"
                className={classes.iconButton}
                disableFocusRipple
                disableRipple>
                <BuildIcon
                  fontSize="small"
                  classes={{fontSizeSmall: classes.fontSizeXSmall}}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Dry Run This Version">
              <IconButton
                aria-label="Dry Run This Version"
                className={classes.iconButton}
                disableFocusRipple
                disableRipple>
                <CheckCircleIcon
                  fontSize="small"
                  classes={{fontSizeSmall: classes.fontSizeXSmall}}
                />
              </IconButton>
            </Tooltip>
          </AccordionSummary>
          <AccordionDetails classes={{root: classes.accordionDetails}}>
            <Typography variant="caption" />
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
});

TabPanel.propTypes = {
  version: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    testId: PropTypes.number,
    code: PropTypes.string,
    isCurrent: PropTypes.bool,
    hasError: PropTypes.bool,
    errorMsg: PropTypes.string,
  }).isRequired,
  testName: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
};

export default TabPanel;

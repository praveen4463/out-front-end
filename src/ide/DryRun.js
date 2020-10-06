import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import StopIcon from '@material-ui/icons/Stop';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import clsx from 'clsx';
import Tooltip from '../TooltipCustom';

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

const DryRun = ({closeButton}) => {
  const classes = useStyles();

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
              <CheckCircleIcon
                fontSize="small"
                className={classes.rerun}
                classes={{fontSizeSmall: classes.fontSizeSmall}}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Run Failed">
            <IconButton aria-label="Run Failed" className={classes.iconNoHover}>
              <CheckCircleIcon
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
            <Typography variant="caption">Initiating dry run...</Typography>
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
            openUrl with 4 arguments was not found
          </pre>
        </Box>
      </Box>
    </SplitPane>
  );
};

DryRun.propTypes = {
  closeButton: PropTypes.node.isRequired,
};

export default DryRun;

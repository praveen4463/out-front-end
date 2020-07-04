/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useState} from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  nav: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    position: 'fixed',
    right: 0,
    top: 48,
    bottom: 22,
    color: theme.palette.background.contrastText,
    backgroundColor: theme.palette.background.paper,
    zIndex: theme.zIndex.appBar,
    width: 22,
    writingMode: 'vertical-rl',
  },
  wrapper: {
    width: '100%',
  },
  typography: {
    marginTop: 5,
    width: '100%',
  },
  link: {
    cursor: 'pointer',
    padding: '5px 0',
    width: '100%',
    display: 'inline-block',
  },
  linkHover: {
    '&:hover': {
      backgroundColor: theme.palette.linkTab.hoverBackground,
      textDecoration: 'none',
    },
  },
  linkTab: {
    backgroundColor: theme.palette.linkTab.background,
  },
  activeTab: {
    backgroundColor: theme.palette.linkTab.activeBackground,
    color: theme.palette.linkTab.activeBackgroundText,
    '&:hover': {
      textDecoration: 'none',
    },
  },
}));

const BottomNavigation = () => {
  const [completedBuildsOn, setCompletedBuildsOn] = useState(false);
  const [livePreviewOn, setLivePreviewOn] = useState(false);
  const [apiRefOn, setApiRefOn] = useState(false);
  const classes = useStyles();

  const toggleState = (setBoolState) => {
    setBoolState((f) => !f);
  };

  return (
    <Paper
      square
      component="div"
      elevation={4}
      aria-label="Right Navigation"
      className={classes.nav}>
      <Box display="flex" className={classes.wrapper} style={{paddingTop: 8}}>
        <Typography variant="caption" className={classes.typography}>
          <Link
            color="inherit"
            onClick={() => toggleState(setCompletedBuildsOn)}
            classes={{root: classes.link}}
            className={clsx(
              classes.link,
              classes.linkTab,
              completedBuildsOn ? classes.activeTab : classes.linkHover
            )}>
            Completed Builds
          </Link>
        </Typography>
      </Box>
      <Box display="flex" className={classes.wrapper}>
        <Typography variant="caption" className={classes.typography}>
          <Link
            color="inherit"
            onClick={() => toggleState(setLivePreviewOn)}
            classes={{root: classes.link}}
            className={clsx(
              classes.link,
              classes.linkTab,
              livePreviewOn ? classes.activeTab : classes.linkHover
            )}>
            Live Preview
          </Link>
        </Typography>
      </Box>
      <Box display="flex" flex={1} className={classes.wrapper} />
      <Box
        display="flex"
        className={classes.wrapper}
        style={{paddingBottom: 8}}>
        <Typography variant="caption" className={classes.typography}>
          <Link
            color="inherit"
            onClick={() => toggleState(setApiRefOn)}
            classes={{root: classes.link}}
            className={clsx(
              classes.link,
              classes.linkTab,
              apiRefOn ? classes.activeTab : classes.linkHover
            )}>
            API Reference
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default BottomNavigation;

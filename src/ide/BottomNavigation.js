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
    alignItems: 'center',
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    color: theme.palette.background.contrastText,
    backgroundColor: theme.palette.background.paper,
    height: 22,
    zIndex: theme.zIndex.appBar,
    width: '100%',
  },
  wrapper: {
    height: '100%',
  },
  typography: {
    marginLeft: 5,
    height: '100%',
  },
  link: {
    cursor: 'pointer',
    padding: '0 5px',
    height: '100%',
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
  const [outputOn, setOutputOn] = useState(false);
  const classes = useStyles();

  const toggleOutput = () => {
    setOutputOn((f) => !f);
  };

  const goLine = () => {
    // go to the given line
  };

  return (
    <Paper
      square
      component="div"
      elevation={4}
      aria-label="Bottom Navigation"
      className={classes.nav}>
      <Box display="flex" className={classes.wrapper}>
        <Typography
          variant="caption"
          style={{marginLeft: 48}}
          className={classes.typography}>
          <Link
            color="inherit"
            onClick={toggleOutput}
            classes={{root: classes.link}}
            className={clsx(
              classes.link,
              classes.linkTab,
              outputOn ? classes.activeTab : classes.linkHover
            )}>
            Build Status and Output
          </Link>
        </Typography>
      </Box>
      <Box flex={1} className={classes.wrapper} />
      <Box display="flex" className={classes.wrapper} style={{paddingRight: 8}}>
        <Typography variant="caption">
          <Link
            color="inherit"
            onClick={goLine}
            className={clsx(classes.link, classes.linkHover)}>
            Ln 1, Col 10
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default BottomNavigation;

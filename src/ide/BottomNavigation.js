/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useState} from 'react';
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
  link: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.background.hoverBackground,
    },
  },
  activeTab: {
    backgroundColor: theme.palette.background.contrastBackground,
    color: theme.palette.background.contrastBackgroundContrastText,
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
      classes={{root: classes.nav}}>
      <Box display="flex">
        <Typography variant="body2" color="textSecondary">
          <Link
            color="inherit"
            onClick={toggleOutput}
            classes={{root: classes.link}}
            className={outputOn ? classes.activeTab : ''}>
            Build Status and Output
          </Link>
        </Typography>
      </Box>
      <Box flex={1} />
      <Box display="flex">
        <Typography variant="body2" color="textSecondary">
          <Link color="inherit" onClick={goLine} classes={{root: classes.link}}>
            Ln 1, Col 10
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default BottomNavigation;

import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
}));

// take props with current state and functions to send updates to state,
// handlers for starting the build. On re-render, always create using the
// state.
const Explorer = () => {
  const classes = useStyles();

  return (
    <Box p={1} className={classes.root}>
      <span>File explorer appears here</span>
    </Box>
  );
};

export default Explorer;

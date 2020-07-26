import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
}));

const ApiRef = () => {
  const classes = useStyles();

  return (
    <Box p={1} className={classes.root}>
      <span>Api Reference appears here</span>
    </Box>
  );
};

export default ApiRef;

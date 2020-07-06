import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
}));

const BuildOutput = () => {
  const classes = useStyles();

  return (
    <Box m={1} className={classes.root}>
      <span>Build ouput appears here</span>
    </Box>
  );
};

export default BuildOutput;

import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
}));

const BuildStatus = () => {
  const classes = useStyles();

  return (
    <Box p={1} boxShadow={3} className={classes.root}>
      <span>Build status appears here</span>
    </Box>
  );
};

export default BuildStatus;

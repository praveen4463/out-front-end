import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
}));

const LivePreview = () => {
  const classes = useStyles();

  return (
    <Box
      p={1}
      className={classes.root}
      style={{
        backgroundColor: '#fff',
        color: '#000',
      }}>
      {/* TODO: give a full screen and maximize option, maximize should close
      all other panes and maximize the pane, while full screen should start
      a full screen dialog and transfer the live preview there. */}
      <span>Live preview appears here</span>
    </Box>
  );
};

export default LivePreview;

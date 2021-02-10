import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    backgroundColor: '#fff',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: theme.zIndex.modal,
  },
}));

const PageLoadingIndicator = () => {
  const classes = useStyles();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 0;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box className={classes.root}>
      <Box position="absolute" top={0} left={0} width="100%">
        <LinearProgress
          variant="determinate"
          color="secondary"
          value={progress}
        />
      </Box>
    </Box>
  );
};

export default PageLoadingIndicator;

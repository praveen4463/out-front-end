import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import PropTypes from 'prop-types';
import {getZyliticsLogo} from '../common';

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

const PageLoadingIndicator = ({loadingText}) => {
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
      {loadingText ? (
        <Container>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box mt={15} pt={2}>
              {getZyliticsLogo()}
            </Box>
            <Typography variant="body1" color="textSecondary">
              {loadingText}
            </Typography>
          </Box>
        </Container>
      ) : null}
    </Box>
  );
};

PageLoadingIndicator.propTypes = {
  loadingText: PropTypes.string,
};

PageLoadingIndicator.defaultProps = {
  loadingText: null,
};

export default PageLoadingIndicator;

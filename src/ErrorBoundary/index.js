import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import SvgIcon from '@material-ui/core/SvgIcon';
import PropTypes from 'prop-types';
import {captureException} from '@sentry/react';
import {Link as RouterLink, useHistory} from 'react-router-dom';
import {PageUrl} from '../Constants';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > * + *': {
      marginLeft: theme.spacing(2),
    },
    paddingTop: theme.spacing(10),
    color: theme.palette.background.contrastText,
    backgroundColor: theme.palette.background.default,
  },
  contentRoot: {
    width: '100%',
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.border.light}`,
  },
  button: {
    margin: theme.spacing(2),
    opacity: theme.textOpacity.highEmphasis,
  },
  notice: {
    textAlign: 'center',
  },
}));

export const rootErrorHandler = (error) => {
  captureException(error, {
    tags: {
      location: 'ErrorBoundary',
    },
  }); // send to sentry
};

// https://github.com/bvaughn/react-error-boundary#readme
const RootErrorFallback = ({resetErrorBoundary}) => {
  const history = useHistory();
  const classes = useStyles();

  const handleToHome = () => {
    resetErrorBoundary(); // invoke reset is essential otherwise boundary doesn't
    // resets it's error state.
    history.replace(PageUrl.HOME);
  };

  return (
    <div
      className={classes.root}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        display: 'flex',
        flex: '1 1 auto',
        justifyContent: 'center',
      }}>
      <Box
        display="flex"
        flexDirection="column"
        className={classes.contentRoot}>
        <Box position="fixed" top={0} left={0} mx={3}>
          <Link
            component={RouterLink}
            to={PageUrl.HOME}
            aria-label="Home"
            title="Home">
            <SvgIcon fontSize="small">
              {/* TODO: replace with our 24x24 logo */}
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </SvgIcon>
          </Link>
        </Box>
        <Typography variant="body2" className={classes.notice}>
          {`You caught some error, thank you for noticing. We've been
          notified and will be fixing it very soon. For now, you may try
          again and possibly ignore the action that led to this error.`}
        </Typography>
        <Box display="flex" justifyContent="center" paddingTop={1}>
          {resetErrorBoundary ? (
            <Button
              variant="contained"
              onClick={resetErrorBoundary}
              className={classes.button}>
              Retry
            </Button>
          ) : null}
          <Button
            variant="contained"
            onClick={handleToHome}
            className={classes.button}>
            Home
          </Button>
        </Box>
      </Box>
    </div>
  );
};

RootErrorFallback.propTypes = {
  resetErrorBoundary: PropTypes.func,
};

RootErrorFallback.defaultProps = {
  resetErrorBoundary: null,
};

export default RootErrorFallback;

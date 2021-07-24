import React, {useEffect, useRef} from 'react';
import Button from '@material-ui/core/Button';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import googleIcon from '../assets/google.svg';
import {loadScript, removeScript} from '../utils/index';

const useStyles = makeStyles(() => ({
  socialButtons: {
    backgroundColor: '#c1aada',
    textTransform: 'none',
    height: '45px',
  },
}));

const GoogleSignIn = ({
  onGoogleSignIn,
  onGoogleSignInError,
  buttonText,
  isDisabled,
}) => {
  const googleScriptLoadedRef = useRef(false);
  const googleSignInRef = useRef(null);
  const classes = useStyles();

  useEffect(() => {
    if (googleScriptLoadedRef.current || !googleSignInRef.current) {
      return null;
    }
    let unmounted = false;
    const jsSrc = 'https://apis.google.com/js/platform.js';
    loadScript(document, 'script', 'google-login', jsSrc, () => {
      googleScriptLoadedRef.current = true;
      window.gapi.load('auth2', () => {
        if (unmounted) {
          return;
        }
        const auth2 = window.gapi.auth2.init({
          client_id: `${process.env.REACT_APP_GOOGLE_SIGN_IN_CLIENT_ID}`,
          cookiepolicy: 'single_host_origin',
        });
        auth2.attachClickHandler(
          googleSignInRef.current,
          {},
          onGoogleSignIn,
          onGoogleSignInError
        );
      });
    });

    return () => {
      unmounted = true;
      removeScript(document, 'google-login');
    };
  }, [onGoogleSignInError, onGoogleSignIn]);

  return (
    <Button
      variant="contained"
      disabled={isDisabled}
      tabIndex="0"
      className={classes.socialButtons}
      ref={googleSignInRef}>
      <img
        src={googleIcon}
        alt="Google Icon"
        style={{display: 'inline', marginRight: '8px'}}
      />
      {buttonText}
    </Button>
  );
};

GoogleSignIn.propTypes = {
  onGoogleSignIn: PropTypes.func.isRequired,
  onGoogleSignInError: PropTypes.func.isRequired,
  buttonText: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool,
};

GoogleSignIn.defaultProps = {
  isDisabled: false,
};

export default GoogleSignIn;

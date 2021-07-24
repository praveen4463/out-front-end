import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Link from '@material-ui/core/Link';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import {useHistory, useLocation, Link as RouterLink} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import axios from 'axios';
import CssBaseline from '@material-ui/core/CssBaseline';
import {captureException} from '@sentry/react';
import firebase from 'firebase/app';
import 'firebase/auth';
import isEmail from 'validator/lib/isEmail';
import {useAuthContext} from './Auth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {Endpoints, PageUrl, Plan} from './Constants';
import {
  getFromApiAndStoreUser,
  handleApiError,
  handleAuthError,
  composePageTitle,
  signUpWithGoogle,
} from './common';
import Application from './config/application';
import {AppSnackbarContext} from './contexts';
import logo from './assets/logo.svg';
import GoogleSignIn from './components/GoogleSignIn';

const EMAIL = 'Email';
const PWD = 'Password';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1280px',
  },
  signUpText: {
    [theme.breakpoints.up('md')]: {
      display: 'inline',
    },
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  login: {
    backgroundColor: '#FFFFFF',
    [theme.breakpoints.up('lg')]: {
      width: '35%',
      padding: theme.spacing(4, 2),
    },
    [theme.breakpoints.only('md')]: {
      width: '50%',
      padding: theme.spacing(4, 2),
    },
    [theme.breakpoints.only('sm')]: {
      width: '60%',
      padding: theme.spacing(2, 1),
    },
    [theme.breakpoints.only('xs')]: {
      width: '95%',
      padding: theme.spacing(1, 0.5),
    },
  },
  label: {
    fontWeight: 600,
    paddingBottom: theme.spacing(1),
  },
  textField: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: '1rem',
  },
  alert: {
    padding: `0 ${theme.spacing(2)}px`,
  },
}));

const initialInput = {
  [EMAIL]: '',
  [PWD]: '',
};
const initialError = {
  [EMAIL]: null,
  [PWD]: null,
};

const AlertType = {
  ERROR: 'error',
  INFO: 'info',
};

function MessageAlert(type, message) {
  this.type = type;
  this.message = message;
}

const Login = () => {
  const [msgAlert, setMsgAlert] = useState(null);
  const [input, setInput] = useState(initialInput);
  const [error, setError] = useState(initialError);
  const [logging, setLogging] = useState(false);
  const [noEmailPwdUser, setNoEmailPwdUser] = useState(false);
  const [creatingNewUser, setCreatingNewUser] = useState(false);
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();
  const locationInState =
    location.state && location.state.location ? location.state.location : null;
  const userAlreadyLoggedInCheckedRef = useRef(false);
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    AppSnackbarContext
  );

  const classes = useStyles();

  const setAlertErrorMessage = (msg) => {
    setMsgAlert(new MessageAlert(AlertType.ERROR, msg));
  };

  const setAlertInfoMessage = (msg) => {
    setMsgAlert(new MessageAlert(AlertType.INFO, msg));
  };

  const goLocation = useCallback(() => {
    history.replace(locationInState || PageUrl.HOME);
  }, [history, locationInState]);

  const redirectOnLogin = useCallback(() => {
    if (location.state?.discourseSSO) {
      // this is a sign in request from discourse
      const {params} = location.state;
      axios
        .get(Endpoints.DISCOURSE_SSO, {
          params,
        })
        .then((response) => {
          const {data} = response;
          window.location = `${Application.COMMUNITY_ZYLITICS_URL}/session/sso_login?sso=${data.sso}&sig=${data.sig}`;
        })
        .catch((ex) => {
          handleApiError(ex, setSnackbarAlertError);
          // even if this login request came from discourse, redirect to home
          // in case an error occurs during logon and show error.
          goLocation();
        });
    } else {
      // this else block is necessary because we're making api request for discourse
      // check. In absence of this, page would first move to home.
      goLocation();
    }
  }, [location, goLocation, setSnackbarAlertError]);

  useEffect(() => {
    if (userAlreadyLoggedInCheckedRef.current) {
      return;
    }
    if (!auth.authStateLoaded) {
      // console.log('login: auth not loaded');
      return;
    }
    if (auth.user && !auth.user.isAnonymous) {
      // console.log('login: auth user found');
      // redirect to where we were as a user exists
      redirectOnLogin();
    }
    userAlreadyLoggedInCheckedRef.current = true;
  }, [auth.authStateLoaded, auth.user, history, redirectOnLogin]);

  const onLoginSuccess = useCallback(() => {
    // storing logging-in user's data is vital, thus we don't allow login
    // until we've put user's data
    getFromApiAndStoreUser(redirectOnLogin, (ex) => {
      handleApiError(ex, setSnackbarAlertError, "Couldn't finish login");
      auth.signOut();
      setLogging(false);
    });
  }, [auth, redirectOnLogin, setSnackbarAlertError]);

  const onGoogleSignIn = useCallback(
    (googleUser) => {
      setLogging(true);
      // reset
      setSnackbarAlertProps(null);
      setMsgAlert(null);
      // first see whether this email is in system.
      const email = googleUser.getBasicProfile().getEmail();
      // get the first method only as we're not allowing multiples for now
      // Identifiers such as EMAIL_PASSWORD_SIGN_IN_METHOD taken from their respective provider section
      // https://firebase.google.com/docs/reference/js/firebase.auth.EmailAuthProvider?authuser=0#static-email_password_sign_in_method
      auth.getSignInMethodsForEmail(email, (methods) => {
        if (!methods?.length) {
          // email doesn't exist, let's create new user.
          // for now use a hardcoded free plan
          setCreatingNewUser(true); // show a full loader because it takes sometime when creating new
          signUpWithGoogle(
            auth,
            googleUser,
            Plan.FREE,
            null,
            () => {
              // We've created a new user. In this case we follow special flow rather
              // than what we do in sign-in. For now go straight to home,
              // later we could also show a terms and/or choose plan page.
              // ! Special flow means we will not go to discourse SSO etc in this case
              // because we might ask user to choose a plan etc and show our system first.
              history.replace(PageUrl.HOME);
            },
            (ex) => {
              // currently for signUpWithGoogle we're expecting only api errors
              handleApiError(ex, setSnackbarAlertError);
              // reset only when fails, else we're at home
              setLogging(false);
              setCreatingNewUser(false);
            }
          );
        } else if (methods[0] === auth.EMAIL_PASSWORD_SIGN_IN_METHOD) {
          setAlertInfoMessage(
            'Please sign in using your primary sign in method: Email/Password.'
          );
          setLogging(false);
        } else if (methods[0] === auth.GOOGLE_SIGN_IN_METHOD) {
          // use this method with caution because if we use it for accounts that
          // don't exist, it creates new one. We don't want that to happen because
          // we use our own UID.
          const credential = firebase.auth.GoogleAuthProvider.credential(
            googleUser.getAuthResponse().id_token
          );
          auth.signInWithCredential(credential, onLoginSuccess, (ex) => {
            // not expecting auth/account-exists-with-different-credential as we're
            // already checking methods for signing in.
            handleAuthError(ex, setSnackbarAlertError);
            setLogging(false);
          });
        } else {
          throw new Error(`Unrecognized login method for ${email}`);
        }
      });
    },
    [
      auth,
      history,
      onLoginSuccess,
      setSnackbarAlertError,
      setSnackbarAlertProps,
    ]
  );

  const onGoogleSignInError = useCallback((ex) => {
    setAlertErrorMessage(
      'There was an error while signing you in. Please report this as an issue.'
    );
    // console.log('sign in error', ex);
    captureException(ex);
  }, []);

  const getLabel = (label, forId) => {
    return (
      <Box>
        <Typography
          variant="body2"
          component="label"
          htmlFor={forId}
          className={classes.label}>
          {label}
        </Typography>
      </Box>
    );
  };

  const validateOnSubmit = (keysSkipValidate = []) => {
    const errors = {};
    Object.keys(input)
      .filter((k) => !keysSkipValidate.includes(k))
      .forEach((key) => {
        const value = input[key].trim();
        const {length} = value;
        if (!length) {
          errors[key] = `${key} is required`;
        }
      });
    return errors;
  };

  const handleChange = (column) => ({target}) => {
    const {value} = target;
    setInput({
      ...input,
      [column]: value,
    });
    // even if some error is currently shown due to some other cause than the checks
    // in validate(), we will clear that error upon value change in this element.
    if (error[column]) {
      setError({...error, [column]: null});
    }
  };

  const onEmailBlur = () => {
    setNoEmailPwdUser(false);
    setMsgAlert(null);
    const emailNormalized = input[EMAIL].trim();
    if (!emailNormalized.length || !isEmail(emailNormalized)) {
      return;
    }
    auth.getSignInMethodsForEmail(emailNormalized, (methods) => {
      if (!methods?.length) {
        return;
      }
      if (methods[0] === auth.GOOGLE_SIGN_IN_METHOD) {
        setAlertInfoMessage(
          'Please sign in using your primary sign in method: Sign in with Google'
        );
        setNoEmailPwdUser(true);
      }
    });
  };

  const handleLogIn = () => {
    const errors = validateOnSubmit();
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    setLogging(true);
    setSnackbarAlertProps(null); // reset any shown snackbars
    setMsgAlert(null);
    auth.signIn(
      input[EMAIL].trim(),
      input[PWD].trim(),
      onLoginSuccess,
      (ex) => {
        let errorMsg = null;
        const {code} = ex;
        if (code === 'auth/user-disabled') {
          errorMsg = `Your account is disabled, if you think this is an error, write us at ${Application.SUPPORT_EMAIL}`;
        } else if (
          code === 'auth/invalid-email' ||
          code === 'auth/wrong-password'
        ) {
          errorMsg = 'Incorrect email address or password';
        } else if (code === 'auth/user-not-found') {
          errorMsg =
            'No account exists for the given email address. Please consider signing up.';
        } else if (code === 'auth/too-many-requests') {
          errorMsg =
            "Too many failed attempts, consider resetting password if you've forget it";
        }
        if (errorMsg) {
          setAlertErrorMessage(errorMsg);
        } else {
          handleAuthError(ex, setSnackbarAlertError);
        }
        setLogging(false);
      }
    );
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleLogIn();
    }
  };

  const signUp = () => {
    history.replace(PageUrl.SIGNUP);
  };

  if (!auth.authStateLoaded || creatingNewUser) {
    return <PageLoadingIndicator />;
  }

  return (
    <>
      <Helmet title={composePageTitle('Sign in')}>
        <meta name="description" content="Sign in to Zylitics" />
      </Helmet>
      <CssBaseline />
      <Box classes={{root: classes.root}}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          style={{margin: '0 auto'}}>
          <Box display="flex" width="100%" justifyContent="center">
            <img
              src={logo}
              alt="Zylitics Logo"
              style={{
                width: '194px',
                height: '150px',
              }}
            />
            <Box position="absolute" right="1%" top="2%">
              <Typography
                variant="body2"
                className={classes.signUpText}
                style={{marginRight: '8px'}}>
                Don&apos;t have an account?
              </Typography>
              <Button
                color="primary"
                variant="contained"
                onClick={signUp}
                style={{textTransform: 'none'}}
                tabIndex="0">
                Sign up for free
              </Button>
            </Box>
          </Box>
          <Box className={classes.contentBox}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              boxShadow={3}
              className={classes.login}>
              <Box pb={3}>
                <Typography variant="h5" style={{fontWeight: 600}}>
                  Sign in to Zylitics
                </Typography>
              </Box>
              {msgAlert ? (
                <Box pb={2} width="100%">
                  <Alert
                    variant="filled"
                    className={classes.alert}
                    severity={msgAlert.type}>
                    <Typography variant="body1">{msgAlert.message}</Typography>
                  </Alert>
                </Box>
              ) : null}
              <Box display="flex" flexDirection="column" pb={2} width="100%">
                {getLabel('Email', 'email')}
                <TextField
                  name="email"
                  id="email"
                  variant="outlined"
                  margin="none"
                  fullWidth
                  InputProps={{
                    classes: {input: classes.textField},
                    inputProps: {tabIndex: '0'},
                  }}
                  onKeyUp={keyUpHandler}
                  onBlur={onEmailBlur}
                  value={input[EMAIL]}
                  onChange={handleChange(EMAIL)}
                  error={Boolean(error[EMAIL])}
                  helperText={error[EMAIL] ?? ''}
                />
              </Box>
              <Box display="flex" flexDirection="column" pb={2} width="100%">
                {getLabel('Password', 'password')}
                <TextField
                  name="password"
                  id="password"
                  variant="outlined"
                  margin="none"
                  fullWidth
                  InputProps={{
                    classes: {input: classes.textField},
                    inputProps: {tabIndex: '0'},
                  }}
                  onKeyUp={keyUpHandler}
                  value={input[PWD]}
                  onChange={handleChange(PWD)}
                  error={Boolean(error[PWD])}
                  helperText={error[PWD] ?? ''}
                  type="password"
                />
              </Box>
              <Box
                display="flex"
                pb={2}
                justifyContent="flex-end"
                width="100%"
                alignItems="center"
                fontWeight={500}
                fontSize="body2.fontSize">
                <Link
                  component={RouterLink}
                  to={PageUrl.REQUEST_RESET_PWD}
                  disabled={noEmailPwdUser}
                  aria-label="Forgot your password?"
                  title="Forgot your password?">
                  Forgot your password?
                </Link>
              </Box>
              <Box width="100%" pb={2}>
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  onClick={handleLogIn}
                  disabled={logging || noEmailPwdUser}
                  style={{height: '45px'}}
                  tabIndex="0">
                  Sign in
                </Button>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                width="100%"
                pb={2}
                fontSize="body1.fontSize"
                color="text.secondary"
                className={classes.socialLogin}>
                <Box flexGrow={1}>
                  <Divider />
                </Box>
                <Box mx={1}>or</Box>
                <Box flexGrow={1}>
                  <Divider />
                </Box>
              </Box>
              <Box width="100%" pb={2} display="flex" justifyContent="center">
                <GoogleSignIn
                  onGoogleSignIn={onGoogleSignIn}
                  onGoogleSignInError={onGoogleSignInError}
                  buttonText="Sign in with Google"
                  isDisabled={logging}
                />
              </Box>
              {logging && (
                <Box position="absolute" top={0} left={0} width="100%">
                  <LinearProgress color="secondary" />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Login;

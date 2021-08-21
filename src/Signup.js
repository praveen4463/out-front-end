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
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import {useHistory, useLocation} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import CssBaseline from '@material-ui/core/CssBaseline';
import {captureException} from '@sentry/react';
import firebase from 'firebase/app';
import 'firebase/auth';
import isEmail from 'validator/lib/isEmail';
import {useAuthContext} from './Auth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {PageUrl, SignupUserType} from './Constants';
import {
  handleApiError,
  handleAuthError,
  composePageTitle,
  signUpWithGoogle,
  getLocation,
  readPlanFromQS,
} from './common';
import {AppSnackbarContext} from './contexts';
import logo from './assets/logo.svg';
import GoogleSignIn from './components/GoogleSignIn';
import usePricingDialog from './hooks/usePricingDialog';

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

const AlertType = {
  ERROR: 'error',
  INFO: 'info',
};

function MessageAlert(type, message) {
  this.type = type;
  this.message = message;
}

const Signup = () => {
  const [msgAlert, setMsgAlert] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState(null);
  const [signingUp, setSigningUp] = useState(false);
  const [beginSignup, setBeginSignup] = useState(false);
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();
  const selectedPlan = readPlanFromQS(location.search);
  const userAlreadyLoggedInCheckedRef = useRef(false);
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    AppSnackbarContext
  );
  const [setPricingDlg, pricingDialog] = usePricingDialog();

  const classes = useStyles();

  const setAlertErrorMessage = (msg) => {
    setMsgAlert(new MessageAlert(AlertType.ERROR, msg));
  };

  const setAlertInfoMessage = (msg) => {
    setMsgAlert(new MessageAlert(AlertType.INFO, msg));
  };

  useEffect(() => {
    if (userAlreadyLoggedInCheckedRef.current) {
      return;
    }
    if (!auth.authStateLoaded) {
      return;
    }
    if (auth.user && !auth.user.isAnonymous) {
      // if user exist, send them to home
      history.replace(PageUrl.HOME);
    }
    userAlreadyLoggedInCheckedRef.current = true;
  }, [auth.authStateLoaded, auth.user, history]);

  const doGoogleSignup = useCallback(
    (googleUser) => (plan) => {
      setSigningUp(true);
      // email doesn't exist, let's create new user.
      // for now use a hardcoded free plan
      signUpWithGoogle(
        auth,
        googleUser,
        plan,
        null,
        () => {
          history.replace(PageUrl.HOME);
        },
        (ex) => {
          // currently for signUpWithGoogle we're expecting only api errors
          handleApiError(ex, setSnackbarAlertError);
          // reset only when fails, else we're at home
          setSigningUp(false);
          setBeginSignup(false);
        }
      );
    },
    [auth, history, setSnackbarAlertError]
  );

  const onGoogleSignIn = useCallback(
    (googleUser) => {
      // reset
      setSnackbarAlertProps(null);
      setMsgAlert(null);
      setBeginSignup(true);
      // show a full loader because it takes sometime when creating new
      const email = googleUser.getBasicProfile().getEmail();
      // get the first method only as we're not allowing multiples for now
      // Identifiers such as EMAIL_PASSWORD_SIGN_IN_METHOD taken from their respective provider section
      // https://firebase.google.com/docs/reference/js/firebase.auth.EmailAuthProvider?authuser=0#static-email_password_sign_in_method
      auth.getSignInMethodsForEmail(email, (methods) => {
        if (!methods?.length) {
          const signUpCb = doGoogleSignup(googleUser);
          if (selectedPlan) {
            signUpCb(selectedPlan);
          } else {
            setPricingDlg(signUpCb);
          }
        } else if (methods[0] === auth.EMAIL_PASSWORD_SIGN_IN_METHOD) {
          setAlertInfoMessage(
            'Your account already exists. Please sign in using email and password.'
          );
          setBeginSignup(false);
        } else if (methods[0] === auth.GOOGLE_SIGN_IN_METHOD) {
          // if user exists, just log them in.
          const credential = firebase.auth.GoogleAuthProvider.credential(
            googleUser.getAuthResponse().id_token
          );
          auth.signInWithCredential(
            credential,
            () => {
              history.replace(PageUrl.HOME);
            },
            (ex) => {
              // not expecting auth/account-exists-with-different-credential as we're
              // already checking methods for signing in.
              handleAuthError(ex, setSnackbarAlertError);
              setBeginSignup(false);
            }
          );
        } else {
          throw new Error(`Unrecognized login method for ${email}`);
        }
      });
    },
    [
      auth,
      doGoogleSignup,
      history,
      selectedPlan,
      setPricingDlg,
      setSnackbarAlertError,
      setSnackbarAlertProps,
    ]
  );

  const onGoogleSignInError = useCallback((ex) => {
    setAlertErrorMessage(
      'There was an error while signing you up. Please report this as an issue.'
    );
    // console.log('sign up error', ex);
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

  const handleChange = ({target}) => {
    const {value} = target;
    setUserEmail(value);
    if (error) {
      setError(null);
    }
  };

  const handleSignup = () => {
    setSnackbarAlertProps(null);
    setMsgAlert(null);
    const emailNormalized = userEmail.trim();
    if (!emailNormalized.length) {
      setError('Email is required');
      return;
    }
    if (!isEmail(emailNormalized)) {
      setError('Email looks invalid');
      return;
    }
    setBeginSignup(true);
    auth.getSignInMethodsForEmail(emailNormalized, (methods) => {
      if (!methods?.length) {
        history.push(
          getLocation(PageUrl.FINISH_SIGNUP, location.search, {
            userType: SignupUserType.NORMAL,
            email: emailNormalized,
          })
        );
        return;
      }
      setAlertInfoMessage(
        'An account already exists for the given email. Please sign in instead.'
      );
      setBeginSignup(false);
    });
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleSignup();
    }
  };

  const signIn = () => {
    history.replace(PageUrl.LOGIN);
  };

  if (!auth.authStateLoaded || signingUp) {
    return <PageLoadingIndicator />;
  }

  return (
    <>
      <Helmet title={composePageTitle('Sign up for Zylitics')}>
        <meta name="description" content="Sign up for Zylitics" />
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
                Already have an account?
              </Typography>
              <Button
                color="primary"
                variant="contained"
                onClick={signIn}
                style={{textTransform: 'none'}}
                tabIndex="0">
                Sign in
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
                  Create your free Zylitics account
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
                  value={userEmail}
                  onChange={handleChange}
                  error={Boolean(error)}
                  helperText={error ?? ''}
                />
              </Box>
              <Box width="100%" pb={2}>
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  onClick={handleSignup}
                  disabled={beginSignup}
                  style={{height: '45px'}}
                  tabIndex="0">
                  Sign up for free
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
                  buttonText="Sign up with Google"
                  isDisabled={beginSignup}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      {pricingDialog}
    </>
  );
};

export default Signup;

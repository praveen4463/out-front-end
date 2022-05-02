import React, {useContext, useEffect, useState} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Alert from '@material-ui/lab/Alert';
import {captureException} from '@sentry/react';
import {makeStyles} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import {useHistory, useLocation} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import {useAuthContext} from './Auth';
import {
  composePageTitle,
  handleApiError,
  invokeApiWithAnonymousAuth,
  readPlanFromQS,
  signUpWithGoogle,
  storeUserBuiltUsingApiData,
} from './common';
import {
  Endpoints,
  MIN_PWD_LENGTH,
  PageUrl,
  Plan,
  SignupUserType,
} from './Constants';
import Application from './config/application';
import logo from './assets/logo.svg';
import GoogleSignIn from './components/GoogleSignIn';
import {AppSnackbarContext} from './contexts';

const FNAME = 'First name';
const LNAME = 'Last name';
const PWD = 'Password';
const ORG = 'Organization';
const TERMS = 'Terms';

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
  signup: {
    backgroundColor: '#FFFFFF',
    [theme.breakpoints.up('lg')]: {
      width: '60%',
      padding: theme.spacing(4, 2),
    },
    [theme.breakpoints.only('md')]: {
      width: '75%',
      padding: theme.spacing(4, 2),
    },
    [theme.breakpoints.only('sm')]: {
      width: '80%',
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
  [FNAME]: '',
  [LNAME]: '',
  [PWD]: '',
  [ORG]: '',
  [TERMS]: false,
};
const initialError = {
  [FNAME]: null,
  [LNAME]: null,
  [PWD]: null,
  [ORG]: null,
  [TERMS]: null,
};

const AlertType = {
  ERROR: 'error',
  INFO: 'info',
};

function MessageAlert(type, message) {
  this.type = type;
  this.message = message;
}

// Once we add team invite, add functionality to login with google.
const FinishSignup = () => {
  const [msgAlert, setMsgAlert] = useState(null);
  const [input, setInput] = useState(initialInput);
  const [error, setError] = useState(initialError);
  const [saving, setSaving] = useState(false);
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();
  const locState = location.state;
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    AppSnackbarContext
  );
  const {userType} = locState || {};
  const {email} = userType ? locState : {};
  const isTeamInvite = userType === SignupUserType.TEAM_MEMBER;
  const {organizationName, emailVerificationId} = isTeamInvite ? locState : {};
  const selectedPlan = readPlanFromQS(location.search);

  const classes = useStyles();

  const setAlertErrorMessage = (msg) => {
    setMsgAlert(new MessageAlert(AlertType.ERROR, msg));
  };

  // This page requires something in state to create new user, for example
  // it should get either email or team invite data from other parts of app.
  // If some user lands here directly, redirect them to signup. For instance,
  // in case of any residual beta invitee links.
  // !! Keep this effect on top.
  useEffect(() => {
    if (!userType) {
      history.replace(PageUrl.SIGNUP);
    }
  }, [history, userType]);

  const getLabel = (label, forId, required = true) => {
    return (
      <Box display="flex">
        <Typography
          variant="body2"
          component="label"
          htmlFor={forId}
          className={classes.label}>
          {label}
        </Typography>
        {required ? (
          <span style={{color: '#ff3b4e', marginLeft: '2px'}}>*</span>
        ) : null}
      </Box>
    );
  };

  const validateOnSubmit = (keysSkipValidate = []) => {
    const errors = {};
    Object.keys(input)
      .filter((k) => !keysSkipValidate.includes(k))
      .forEach((key) => {
        if (key === TERMS) {
          if (!input[key]) {
            errors[key] = 'You must agree to our terms and privacy policy';
          }
        } else {
          const value = input[key].trim();
          const {length} = value;
          if (!length) {
            errors[key] = `${key} is required`;
          } else if (key === PWD && length < MIN_PWD_LENGTH) {
            errors[
              key
            ] = `${PWD} must contain at least ${MIN_PWD_LENGTH} characters`;
          }
        }
      });
    return errors;
  };

  const handleChange = (column) => ({target}) => {
    const {type} = target;
    let value;
    switch (type) {
      case 'checkbox':
        value = target.checked;
        break;
      default:
        value = target.value;
        break;
    }
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

  const doEmailSignup = (plan) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const utcOffsetInMinutes = new Date().getTimezoneOffset();
    const payload = {
      firstName: input[FNAME].trim(),
      lastName: input[LNAME].trim(),
      email,
      password: input[PWD].trim(),
      timezone,
      utcOffsetInMinutes,
      emailVerificationId: emailVerificationId || null,
      organizationName: isTeamInvite ? null : input[ORG].trim(),
      planName: isTeamInvite ? null : plan,
    };
    invokeApiWithAnonymousAuth(
      auth,
      {
        url: Endpoints.USERS,
        method: 'post',
        data: payload,
      },
      ({data}) => {
        // Store extra user data in local storage. This
        // is done because firebase doesn't allow to store extra details with
        // user object. We can't put it as browser state because if user opens
        // up multiple tabs, we will have to fetch this data multiple times
        // whereas with local storage, we will fetch it on logins only.
        // it will have to be re fetched whenever some of it's data changes from
        // profile page or email change etc.
        storeUserBuiltUsingApiData(data.user);
        // sign in user in firebase
        // don't handle firebase errors on sign in as there is almost no chance
        // of an error. We're just signing in a newly created user and passing
        // on the credentials we had during sign up. Errors should be checked
        // while logging in.
        // https://firebase.google.com/docs/reference/js/firebase.auth.Auth?authuser=0#signinwithemailandpassword
        auth.signIn(email, input[PWD], () => {
          history.replace(PageUrl.HOME);
        });
      },
      (ex) => {
        handleApiError(ex, setSnackbarAlertError);
        setSaving(false);
      }
    );
  };

  const handleSave = () => {
    setSnackbarAlertProps(null);
    setMsgAlert(null);
    const keysSkipValidate = [];
    if (isTeamInvite) {
      keysSkipValidate.push(ORG);
    }
    const errors = validateOnSubmit(keysSkipValidate);
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    setSaving(true);
    if (isTeamInvite || selectedPlan) {
      doEmailSignup(selectedPlan);
      return;
    }
    // email doesn't exist, let's create new user.
    // for now use a hardcoded free plan
    doEmailSignup(Plan.FREE);
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  // google sign in on this page is exclusive for team member
  const onGoogleSignIn = (googleUser) => {
    setSnackbarAlertProps(null);
    setMsgAlert(null);
    setSaving(true);
    const userEmail = googleUser.getBasicProfile().getEmail();
    if (userEmail !== email) {
      setAlertErrorMessage(
        `Only the account of ${email} can be used to sign up`
      );
      return;
    }
    signUpWithGoogle(
      auth,
      googleUser,
      null,
      emailVerificationId,
      () => {
        history.replace(PageUrl.HOME);
      },
      (ex) => {
        // currently for signUpWithGoogle we're expecting only api errors
        handleApiError(ex, setSnackbarAlertError);
        // reset only when fails, else we're at home
        setSaving(false);
      }
    );
  };

  const onGoogleSignInError = (ex) => {
    setAlertErrorMessage(
      'There was an error while signing you up. Please report this as an issue.'
    );
    captureException(ex);
  };

  return (
    <>
      <Helmet title={composePageTitle('Finish sign up')}>
        <meta name="description" content="Finish sign up" />
      </Helmet>
      <CssBaseline />
      <Box classes={{root: classes.root}}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          style={{margin: '0 auto'}}>
          <Box display="flex" width="100%" justifyContent="center" py={5}>
            <img src={logo} alt="Outomated Logo" />
          </Box>
          <Box className={classes.contentBox}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              boxShadow={3}
              className={classes.signup}>
              <Box pb={3} textAlign="center">
                <Typography variant="h5" style={{fontWeight: 600}}>
                  {isTeamInvite
                    ? `You have been invited to ${organizationName}`
                    : 'Finish signing up'}
                </Typography>
              </Box>
              <Box pb={3} textAlign="center">
                <Typography variant="subtitle1" color="textSecondary">
                  Create a Outomated account for {email} to continue.
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
              <Box display="flex" pb={2} width="100%">
                <Box display="flex" flexDirection="column" flex={1} mr={2}>
                  {getLabel('First name', 'firstName')}
                  <TextField
                    name="firstName"
                    id="firstName"
                    variant="outlined"
                    margin="none"
                    fullWidth
                    InputProps={{
                      classes: {input: classes.textField},
                      inputProps: {tabIndex: '0'},
                    }}
                    onKeyUp={keyUpHandler}
                    autoFocus
                    value={input[FNAME]}
                    onChange={handleChange(FNAME)}
                    error={Boolean(error[FNAME])}
                    helperText={error[FNAME] ?? ''}
                  />
                </Box>
                <Box display="flex" flexDirection="column" flex={1}>
                  {getLabel('Last name', 'lastName')}
                  <TextField
                    name="lastName"
                    id="lastName"
                    variant="outlined"
                    margin="none"
                    fullWidth
                    InputProps={{
                      classes: {input: classes.textField},
                      inputProps: {tabIndex: '0'},
                    }}
                    onKeyUp={keyUpHandler}
                    value={input[LNAME]}
                    onChange={handleChange(LNAME)}
                    error={Boolean(error[LNAME])}
                    helperText={error[LNAME] ?? ''}
                  />
                </Box>
              </Box>
              <Box display="flex" pb={2} width="100%">
                <Box display="flex" flexDirection="column" flex={1} mr={2}>
                  {getLabel('Password', 'password')}
                  <TextField
                    name="password"
                    id="password"
                    variant="outlined"
                    margin="none"
                    fullWidth
                    placeholder={`${MIN_PWD_LENGTH}+ characters`}
                    InputProps={{
                      classes: {input: classes.textField},
                      inputProps: {tabIndex: '0'},
                    }}
                    type="password"
                    onKeyUp={keyUpHandler}
                    value={input[PWD]}
                    onChange={handleChange(PWD)}
                    error={Boolean(error[PWD])}
                    helperText={error[PWD] ?? ''}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Password must not start or end with a blank space
                  </Typography>
                </Box>
                {!isTeamInvite ? (
                  <Box display="flex" flexDirection="column" flex={1}>
                    {getLabel('Organization name', 'organization')}
                    <TextField
                      name="organization"
                      id="organization"
                      variant="outlined"
                      margin="none"
                      fullWidth
                      InputProps={{
                        classes: {input: classes.textField},
                        inputProps: {tabIndex: '0'},
                      }}
                      onKeyUp={keyUpHandler}
                      value={input[ORG]}
                      onChange={handleChange(ORG)}
                      error={Boolean(error[ORG])}
                      helperText={error[ORG] ?? ''}
                    />
                  </Box>
                ) : (
                  <Box flex={1} />
                )}
              </Box>
              <Box display="flex" pb={2} alignItems="flex-end">
                <FormControl error={Boolean(error[TERMS])}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        style={{padding: '0px', marginRight: '5px'}}
                        name="terms"
                        id="terms"
                        checked={input[TERMS]}
                        onChange={handleChange(TERMS)}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="label"
                        htmlFor="terms">
                        I agree to the{' '}
                        <Link
                          href={`${Application.ABOUT_ZYLITICS_URL}${Application.TERMS_PAGE}`}
                          rel="noopener"
                          target="_blank">
                          terms of service
                        </Link>{' '}
                        and{' '}
                        <Link
                          href={`${Application.ABOUT_ZYLITICS_URL}${Application.PRIVACY_PAGE}`}
                          rel="noopener"
                          target="_blank">
                          privacy policy
                        </Link>
                      </Typography>
                    }
                  />
                  <FormHelperText>{error[TERMS] ?? ''}</FormHelperText>
                </FormControl>
              </Box>
              <Box display="flex">
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  style={{height: '45px'}}
                  onClick={handleSave}
                  disabled={saving}
                  tabIndex="0">
                  Continue to Outomated
                </Button>
              </Box>
              {userType === SignupUserType.TEAM_MEMBER ? (
                <>
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
                  <Box
                    width="100%"
                    pb={2}
                    display="flex"
                    justifyContent="center">
                    <GoogleSignIn
                      onGoogleSignIn={onGoogleSignIn}
                      onGoogleSignInError={onGoogleSignInError}
                      buttonText="Sign up with Google"
                      isDisabled={saving}
                    />
                  </Box>
                </>
              ) : null}
              {saving && (
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

export default FinishSignup;

import React, {useEffect, useState, useRef} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import {useParams, useHistory} from 'react-router-dom';
import {captureMessage} from '@sentry/react';
import {Helmet} from 'react-helmet-async';
import BlankCentered from './layouts/BlankCentered';
import useSnackbarTypeError from './hooks/useSnackbarTypeError';
import {
  composePageTitle,
  getValidateEmailVerificationEndpoint,
  handleApiError,
  invokeApiWithAnonymousAuth,
  storeUserBuiltUsingApiData,
} from './common';
import {
  EmailVerificationUserType,
  Endpoints,
  MIN_PWD_LENGTH,
  PageUrl,
} from './Constants';
import {useAuthContext} from './Auth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import Application from './config/application';

const FNAME = 'First name';
const LNAME = 'Last name';
const PWD = 'Password';
const ORG = 'Organization';
const TERMS = 'Terms';

const useStyles = makeStyles((theme) => ({
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

const FinishSignup = () => {
  const {code} = useParams();
  const [emailVerificationResponse, setEmailVerificationResponse] = useState(
    null
  );
  const [emailVerificationError, setEmailVerificationError] = useState(null);
  const [input, setInput] = useState(initialInput);
  const [error, setError] = useState(initialError);
  const [saving, setSaving] = useState(false);
  const auth = useAuthContext();
  const history = useHistory();
  const validationCallInitiatedRef = useRef(false);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();

  const classes = useStyles();

  // user has clicked on some email link but they're already logged in and
  // thus can't create a new account on this browser. Redirect to home
  // this runs only before email verification is done, this is applied to
  // prevent this effect run when we sign in user form here after account creation
  useEffect(() => {
    if (!emailVerificationResponse && auth.user && !auth.user.isAnonymous) {
      captureMessage(`User ${auth.user.id} is already logged in and clicked
      on some email with code ${code}, redirecting to home`);
      history.replace(PageUrl.HOME);
    }
  }, [auth.user, code, emailVerificationResponse, history]);

  useEffect(() => {
    if (validationCallInitiatedRef.current) {
      return;
    }
    validationCallInitiatedRef.current = true;
    invokeApiWithAnonymousAuth(
      auth,
      {
        url: getValidateEmailVerificationEndpoint(code),
        method: 'patch',
      },
      ({data}) => setEmailVerificationResponse(data),
      (ex) => handleApiError(ex, setEmailVerificationError)
    );
  }, [auth, code]);

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

  const handleSave = () => {
    const keysSkipValidate = [];
    const inOrganization =
      emailVerificationResponse.emailVerificationUserType ===
      EmailVerificationUserType.IN_ORGANIZATION;
    if (inOrganization) {
      keysSkipValidate.push(ORG);
    }
    const errors = validateOnSubmit(keysSkipValidate);
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    setSaving(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const utcOffsetInMinutes = new Date().getTimezoneOffset();
    const payload = {
      firstName: input[FNAME].trim(),
      lastName: input[LNAME].trim(),
      password: input[PWD].trim(),
      timezone,
      utcOffsetInMinutes,
      emailVerificationId: emailVerificationResponse.emailVerificationId,
      organizationName: inOrganization ? null : input[ORG].trim(),
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
        storeUserBuiltUsingApiData(data);
        // sign in user in firebase
        // don't handle firebase errors on sign in as there is almost no chance
        // of an error. We're just signing in a newly created user and passing
        // on the credentials we had during sign up. Errors should be checked
        // while logging in.
        // https://firebase.google.com/docs/reference/js/firebase.auth.Auth?authuser=0#signinwithemailandpassword
        auth.signIn(emailVerificationResponse.email, input[PWD], () => {
          history.replace(PageUrl.HOME);
        });
      },
      (ex) => {
        handleApiError(ex, setSnackbarErrorMsg);
        setSaving(false);
      }
    );
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!emailVerificationResponse && !emailVerificationError) {
    return <PageLoadingIndicator />;
  }

  return (
    <>
      <BlankCentered width="60%">
        <Helmet title={composePageTitle('Create new account')} />
        {emailVerificationResponse ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            width="100%">
            <Box pb={2}>
              <Typography variant="h5">
                {emailVerificationResponse.emailVerificationUserType ===
                EmailVerificationUserType.IN_ORGANIZATION
                  ? `You have been invited to ${emailVerificationResponse.organizationName}`
                  : 'Automate with Zylitics'}
              </Typography>
            </Box>
            <Box pb={3}>
              <Typography variant="subtitle1" color="textSecondary">
                Create a Zylitics account for {emailVerificationResponse.email}{' '}
                to continue.
              </Typography>
            </Box>
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
              {emailVerificationResponse.emailVerificationUserType !==
              EmailVerificationUserType.IN_ORGANIZATION ? (
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
              ) : null}
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
            <Box display="flex" width="50%" height={40}>
              <Button
                color="primary"
                variant="contained"
                fullWidth
                onClick={handleSave}
                disabled={saving}
                tabIndex="0">
                {saving ? 'Creating your account...' : 'Create Your Account'}
              </Button>
            </Box>
            {saving && (
              <Box position="absolute" top={0} left={0} width="100%">
                <LinearProgress color="secondary" />
              </Box>
            )}
          </Box>
        ) : null}
        {emailVerificationError ? (
          <Box width="100%">
            <Alert variant="filled" className={classes.alert} severity="error">
              <Typography variant="body1">{emailVerificationError}</Typography>
            </Alert>
          </Box>
        ) : null}
      </BlankCentered>
      {snackbarTypeError}
    </>
  );
};

export default FinishSignup;

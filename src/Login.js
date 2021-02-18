import React, {useEffect, useState, useRef, useCallback} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import {useHistory, useLocation, Link as RouterLink} from 'react-router-dom';
import BlankCentered from './layouts/BlankCentered';
import {useAuthContext} from './Auth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {PageUrl} from './Constants';
import {getFromApiAndStoreUser} from './common';

const EMAIL = 'Email';
const PWD = 'Password';

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
  [EMAIL]: '',
  [PWD]: '',
};
const initialError = {
  [EMAIL]: null,
  [PWD]: null,
};

const Login = () => {
  const [logInError, setLogInError] = useState(null);
  const [input, setInput] = useState(initialInput);
  const [error, setError] = useState(initialError);
  const [logging, setLogging] = useState(false);
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();
  const locationInState =
    location.state && location.state.location ? location.state.location : null;
  const userAlreadyLoggedInCheckedRef = useRef(false);

  const classes = useStyles();

  useEffect(() => {
    if (userAlreadyLoggedInCheckedRef.current) {
      return;
    }
    if (!auth.authStateLoaded) {
      console.log('login: auth not loaded');
      return;
    }
    if (auth.user && !auth.user.isAnonymous) {
      console.log('login: auth user found');
      // redirect to where we were as a user exists
      history.replace(locationInState || PageUrl.HOME);
    }
    userAlreadyLoggedInCheckedRef.current = true;
  }, [auth.authStateLoaded, auth.user, history, locationInState]);

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

  const handleLogIn = () => {
    const errors = validateOnSubmit();
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    setLogging(true);
    auth.signIn(
      input[EMAIL].trim(),
      input[PWD].trim(),
      (user) => {
        getFromApiAndStoreUser(user.email);
        history.replace(locationInState || PageUrl.HOME);
      },
      () => {
        setLogInError('Incorrect email address or password');
        setLogging(false);
      }
    );
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleLogIn();
    }
  };

  const focusOnMount = useCallback((field) => {
    if (field !== null) {
      field.focus();
    }
  }, []);

  if (!auth.authStateLoaded) {
    return <PageLoadingIndicator />;
  }

  return (
    <BlankCentered width="35%">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        width="100%">
        <Box pb={3}>
          <Typography variant="h5">Sign in to Zylitics</Typography>
        </Box>
        {logInError ? (
          <Box pb={2} width="100%">
            <Alert variant="filled" className={classes.alert} severity="error">
              <Typography variant="body1">{logInError}</Typography>
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
            inputRef={focusOnMount}
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
          alignItems="center">
          <Link
            component={RouterLink}
            variant="body2"
            to={PageUrl.REQUEST_RESET_PWD}
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
            disabled={logging}
            style={{height: '45px'}}
            tabIndex="0">
            {logging ? 'Signing in...' : 'Sign in'}
          </Button>
        </Box>
        {/* TODO: // enable once we are in paid trials and create signup page.
        <Box pt={2} width="100%">
          <Typography variant="body2">
            New to Zylitics?{' '}
            <Link
              component={RouterLink}
              to={PageUrl.SIGNUP}
              aria-label="Create an account"
              title="Create an account">
              Create an account
            </Link>
          </Typography>
        </Box>
        */}
        {logging && (
          <Box position="absolute" top={0} left={0} width="100%">
            <LinearProgress color="secondary" />
          </Box>
        )}
      </Box>
    </BlankCentered>
  );
};

export default Login;

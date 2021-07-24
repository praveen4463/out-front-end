import React, {useState, useContext, useEffect, useRef} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import axios from 'axios';
import {useHistory} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import {AppSnackbarContext, HomeLinearProgressContext} from '../contexts';
import {useAuthContext} from '../Auth';
import {
  Endpoints,
  MIN_PWD_LENGTH,
  PageUrl,
  SnackbarHorPos,
  SnackbarType,
  SnackbarVerPos,
  Timeouts,
} from '../Constants';
import {
  composePageTitle,
  handleApiError,
  handleAuthError,
  keyUpHandler,
} from '../common';
import {SnackbarAlertProps} from '../model';

const CUR_PWD = 'Current password';
const NEW_PWD = 'New password';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  buttonSave: {
    padding: theme.spacing(1, 4),
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
  [CUR_PWD]: '',
  [NEW_PWD]: '',
};

const initialError = {
  [CUR_PWD]: null,
  [NEW_PWD]: null,
};

function Status(msg = null, isError = false) {
  this.msg = msg;
  this.isError = isError;
}

const Password = () => {
  const [input, setInput] = useState(initialInput);
  const [error, setError] = useState(initialError);
  const [status, setStatus] = useState(new Status());
  const setProgressAtTopBar = useContext(HomeLinearProgressContext);
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    AppSnackbarContext
  );
  const [resetting, setResetting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [usingIdentityProvider, setUsingIdentityProvider] = useState(false);
  const userIdentityCheckedRef = useRef(false);
  const auth = useAuthContext();
  const history = useHistory();
  const classes = useStyles();

  useEffect(() => {
    if (userIdentityCheckedRef.current) {
      return;
    }
    auth.getSignInMethodsForEmail(auth.user.email, (methods) => {
      if (methods[0] === auth.GOOGLE_SIGN_IN_METHOD) {
        setStatus(
          new Status(
            "Your password can't be changed from here because you signed up using Google Sign In.",
            true
          )
        );
        setUsingIdentityProvider(true);
        userIdentityCheckedRef.current = true;
      }
    });
  });

  useEffect(() => {
    setProgressAtTopBar(resetting || updating);
  }, [resetting, updating, setProgressAtTopBar]);

  const sendPasswordReset = () => {
    setResetting(true);
    axios
      .post(
        Endpoints.SEND_PASSWORD_RESET,
        {
          email: auth.user.email,
        },
        {
          timeout: Timeouts.SYNC_EMAIL_SENDER,
        }
      )
      .then(() =>
        setStatus(
          new Status('A password reset link has been sent to your email')
        )
      )
      .catch((ex) => handleApiError(ex, setSnackbarAlertError))
      .finally(() => setResetting(false));
  };

  const validateOnSubmit = () => {
    const errors = {};
    Object.keys(input).forEach((key) => {
      const value = input[key].trim();
      const {length} = value;
      if (!length) {
        errors[key] = `${key} is required`;
      } else if (key === NEW_PWD && length < MIN_PWD_LENGTH) {
        errors[
          key
        ] = `${key} must contain at least ${MIN_PWD_LENGTH} characters`;
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
    if (error[column]) {
      setError({...error, [column]: null});
    }
  };

  const handleUpdate = () => {
    const errors = validateOnSubmit();
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    setUpdating(true);
    auth.updatePassword(
      input[CUR_PWD].trim(),
      input[NEW_PWD].trim(),
      () => {
        auth.signOut(() => {
          setSnackbarAlertProps(
            new SnackbarAlertProps(
              'Your password has been changed, please login with the new password.',
              SnackbarType.SUCCESS,
              SnackbarVerPos.TOP,
              SnackbarHorPos.CENTER,
              30000
            )
          );
          history.replace(PageUrl.LOGIN);
        });
      },
      (ex) => {
        if (ex.code === 'auth/wrong-password') {
          setStatus(
            new Status(
              'Unable to verify your current password. Please try again.',
              true
            )
          );
        } else {
          handleAuthError(ex, setSnackbarAlertError);
        }
      },
      () => setUpdating(false)
    );
  };

  const getLabel = (label, forId) => (
    <Typography
      variant="body2"
      component="label"
      htmlFor={forId}
      className={classes.label}>
      {label}
    </Typography>
  );

  const getText = (name, key, autoFocus, placeholder) => (
    <TextField
      name={name}
      id={name}
      variant="outlined"
      margin="none"
      fullWidth
      InputProps={{
        classes: {input: classes.textField},
        inputProps: {tabIndex: '0'},
      }}
      value={input[key]}
      onChange={handleChange(key)}
      error={Boolean(error[key])}
      helperText={error[key] ?? ''}
      onKeyUp={keyUpHandler(handleUpdate)}
      type="password"
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Helmet title={composePageTitle('Change password')} />
      <Box pb={4}>
        <Typography variant="h4">Change password</Typography>
      </Box>
      {status.msg ? (
        <Box pb={2} width="60%">
          <Alert
            variant="filled"
            className={classes.alert}
            severity={status.isError ? 'error' : 'success'}>
            <Typography variant="body1">{status.msg}</Typography>
          </Alert>
        </Box>
      ) : null}
      <Box
        className={classes.content}
        p={6}
        boxShadow={3}
        width="60%"
        display="flex"
        flexDirection="column">
        <Box display="flex" flexDirection="column">
          {getLabel('Current password', 'current_password')}
          {getText('current_password', CUR_PWD, true)}
        </Box>
        <Box display="flex" justifyContent="flex-end">
          <Button
            color="primary"
            onClick={sendPasswordReset}
            style={{textTransform: 'none', padding: 0}}
            disabled={resetting || usingIdentityProvider}>
            {resetting
              ? 'Emailing password reset link'
              : 'Forgot your password?'}
          </Button>
        </Box>
        <Box pb={2} display="flex" flexDirection="column">
          {getLabel('New password', 'new_password')}
          {getText(
            'new_password',
            NEW_PWD,
            false,
            `${MIN_PWD_LENGTH}+ characters`
          )}
          <Typography variant="caption" color="textSecondary">
            Password must not start or end with a blank space
          </Typography>
        </Box>
      </Box>
      <Box pt={2}>
        <Button
          variant="contained"
          color="secondary"
          disabled={updating || usingIdentityProvider}
          className={classes.buttonSave}
          onClick={handleUpdate}>
          {updating ? 'Changing password...' : 'Change password'}
        </Button>
      </Box>
    </Box>
  );
};

export default Password;

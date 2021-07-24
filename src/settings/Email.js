import React, {useState, useContext, useEffect, useRef} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import axios from 'axios';
import isEmail from 'validator/lib/isEmail';
import {Helmet} from 'react-helmet-async';
import {AppSnackbarContext, HomeLinearProgressContext} from '../contexts';
import {Endpoints, Timeouts} from '../Constants';
import {composePageTitle, handleApiError, keyUpHandler} from '../common';
import {equalIgnoreCase} from '../utils';
import {useAuthContext} from '../Auth';

const NEW_EMAIL = 'New email';

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
  [NEW_EMAIL]: '',
};

const initialError = {
  [NEW_EMAIL]: null,
};

function Status(msg = null, isError = false) {
  this.msg = msg;
  this.isError = isError;
}

const Email = () => {
  const [input, setInput] = useState(initialInput);
  const [error, setError] = useState(initialError);
  const [status, setStatus] = useState(new Status());
  const setProgressAtTopBar = useContext(HomeLinearProgressContext);
  const [, setSnackbarAlertError] = useContext(AppSnackbarContext);
  const [sending, setSending] = useState(false);
  const [usingIdentityProvider, setUsingIdentityProvider] = useState(false);
  const userIdentityCheckedRef = useRef(false);
  const auth = useAuthContext();
  const classes = useStyles();

  useEffect(() => {
    if (userIdentityCheckedRef.current) {
      return;
    }
    auth.getSignInMethodsForEmail(auth.user.email, (methods) => {
      if (methods[0] === auth.GOOGLE_SIGN_IN_METHOD) {
        setStatus(
          new Status(
            "Your email can't be changed from here because you signed up using Google Sign In. Please contact us if you've any questions.",
            true
          )
        );
        setUsingIdentityProvider(true);
        userIdentityCheckedRef.current = true;
      }
    });
  });

  useEffect(() => {
    setProgressAtTopBar(sending);
  }, [sending, setProgressAtTopBar]);

  const validateOnSubmit = () => {
    const errors = {};
    Object.keys(input).forEach((key) => {
      const value = input[key].trim();
      const {length} = value;
      if (!length) {
        errors[key] = `${key} is required`;
      } else if (!isEmail(value)) {
        errors[key] = `This email looks invalid`;
      } else if (equalIgnoreCase(value, auth.user.email)) {
        errors[key] = `New and current emails can't be the same`;
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
    setSending(true);
    axios
      .post(
        Endpoints.SEND_EMAIL_CHANGE,
        {
          newEmail: input[NEW_EMAIL].trim(),
        },
        {
          timeout: Timeouts.SYNC_EMAIL_SENDER,
        }
      )
      .then(() => {
        setInput({
          ...input,
          [NEW_EMAIL]: '',
        });
        setStatus(
          new Status(
            'An email change link has been sent to the new email, verify you own the email by following that link'
          )
        );
      })
      .catch((ex) => handleApiError(ex, setSnackbarAlertError))
      .finally(() => setSending(false));
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

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Helmet title={composePageTitle('Change email')} />
      <Box pb={4}>
        <Typography variant="h4">Change email</Typography>
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
          {getLabel('New email', 'new_email')}
          <TextField
            name="new_email"
            id="new_email"
            variant="outlined"
            margin="none"
            fullWidth
            InputProps={{
              classes: {input: classes.textField},
              inputProps: {tabIndex: '0'},
            }}
            value={input[NEW_EMAIL]}
            onChange={handleChange(NEW_EMAIL)}
            error={Boolean(error[NEW_EMAIL])}
            helperText={error[NEW_EMAIL] ?? ''}
            onKeyUp={keyUpHandler(handleUpdate)}
            autoFocus
          />
        </Box>
      </Box>
      <Box pt={2}>
        <Button
          variant="contained"
          color="secondary"
          disabled={sending || usingIdentityProvider}
          className={classes.buttonSave}
          onClick={handleUpdate}>
          {sending ? 'Sending link...' : 'Change email'}
        </Button>
      </Box>
    </Box>
  );
};

export default Email;

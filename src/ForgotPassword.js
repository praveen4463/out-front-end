import React, {useState} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import {Helmet} from 'react-helmet-async';
import {useAuthContext} from './Auth';
import BlankCentered from './layouts/BlankCentered';
import {Endpoints, Timeouts} from './Constants';
import {
  composePageTitle,
  handleApiError,
  invokeApiWithAnonymousAuth,
} from './common';

const useStyles = makeStyles((theme) => ({
  root: {
    border: `1px solid ${theme.palette.border.light}`,
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

function Status(msg = null, isError = false) {
  this.msg = msg;
  this.isError = isError;
}

const ForgotPassword = () => {
  const [status, setStatus] = useState(new Status());
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const auth = useAuthContext();

  const classes = useStyles();

  const handleChange = ({target}) => {
    setEmail(target.value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = () => {
    const emailNormalized = email.trim();
    if (!emailNormalized.length) {
      setError('Email is required');
      return;
    }
    setSending(true);
    invokeApiWithAnonymousAuth(
      auth,
      {
        url: Endpoints.SEND_PASSWORD_RESET,
        method: 'post',
        data: {
          email: emailNormalized,
        },
        timeout: Timeouts.SYNC_EMAIL_SENDER,
      },
      () =>
        setStatus(
          new Status(
            'A password reset link will be sent if a Zylitics account is found for this email'
          )
        ),
      (ex) =>
        handleApiError(ex, (errorMsg) => setStatus(new Status(errorMsg, true))),
      () => {
        setSending(false);
        setEmail('');
      }
    );
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <BlankCentered>
      <Helmet title={composePageTitle('Forgot password')}>
        <meta
          name="description"
          content="Forgot your password? Don't worry, just tell us your email and we will send you instructions to reset it."
        />
      </Helmet>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        className={classes.root}>
        <Box pb={3}>
          <Typography variant="h5">Reset password</Typography>
        </Box>
        {status.msg ? (
          <Box pb={2} width="100%">
            <Alert
              variant="filled"
              className={classes.alert}
              severity={status.isError ? 'error' : 'success'}>
              <Typography variant="body1">{status.msg}</Typography>
            </Alert>
          </Box>
        ) : null}
        <Box display="flex" flexDirection="column" pb={2} width="100%">
          <Box>
            <Typography
              variant="body2"
              component="label"
              htmlFor="email"
              className={classes.label}>
              Email
            </Typography>
          </Box>
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
            value={email}
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
            onClick={handleSubmit}
            disabled={sending}
            style={{height: '45px'}}
            tabIndex="0">
            {sending ? 'Emailing reset link...' : 'Email me reset link'}
          </Button>
        </Box>
      </Box>
      {sending && (
        <Box position="absolute" top={0} left={0} width="100%">
          <LinearProgress color="secondary" />
        </Box>
      )}
    </BlankCentered>
  );
};

export default ForgotPassword;

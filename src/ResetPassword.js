import React, {useState, useEffect, useRef, useCallback} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import {useParams, useHistory} from 'react-router-dom';
import {useAuth} from './Auth';
import BlankCentered from './layouts/BlankCentered';
import {MIN_PWD_LENGTH, PageUrl} from './Constants';
import {
  getRestPasswordEndpoint,
  getValidatePasswordResetEndpoint,
  handleApiError,
  invokeApiWithAnonymousAuth,
} from './common';
import useSnackbarTypeError from './hooks/useSnackbarTypeError';
import PageLoadingIndicator from './components/PageLoadingIndicator';

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

const ResetPassword = () => {
  const {code} = useParams();
  const [resetValidationResponse, setResetValidationResponse] = useState(null);
  const [resetValidationError, setResetValidationError] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [snackbarTypeError, setSnackbarErrorMsg] = useSnackbarTypeError();
  const validationCallInitiatedRef = useRef(false);
  const auth = useAuth();
  const history = useHistory();

  const classes = useStyles();

  useEffect(() => {
    if (validationCallInitiatedRef.current) {
      return;
    }
    validationCallInitiatedRef.current = true;
    invokeApiWithAnonymousAuth(
      auth,
      {
        url: getValidatePasswordResetEndpoint(code),
        method: 'patch',
      },
      ({data}) => setResetValidationResponse(data),
      (ex) => handleApiError(ex, setResetValidationError)
    );
  }, [auth, code]);

  const handleChange = ({target}) => {
    setPassword(target.value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = () => {
    const pwdNormalized = password.trim();
    if (!pwdNormalized.length) {
      setError('Password is required');
      return;
    }
    if (pwdNormalized.length < MIN_PWD_LENGTH) {
      setError(`Password must contain at least ${MIN_PWD_LENGTH} characters`);
      return;
    }
    setResetting(true);
    invokeApiWithAnonymousAuth(
      auth,
      {
        url: getRestPasswordEndpoint(resetValidationResponse.passwordResetId),
        method: 'patch',
        data: {
          password: pwdNormalized,
        },
      },
      () =>
        auth.signIn(resetValidationResponse.email, pwdNormalized, () => {
          history.replace(PageUrl.HOME);
        }),
      (ex) => {
        handleApiError(ex, setSnackbarErrorMsg);
        setResetting(false);
      }
    );
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const focusOnMount = useCallback((field) => {
    if (field !== null) {
      field.focus();
    }
  }, []);

  if (!resetValidationResponse && !resetValidationError) {
    return <PageLoadingIndicator />;
  }

  return (
    <>
      <BlankCentered width="35%">
        {resetValidationResponse ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            width="100%">
            <Box pb={2}>
              <Typography variant="h5">Reset password</Typography>
            </Box>
            <Box pb={3}>
              <Typography variant="subtitle1" color="textSecondary">
                Set a new password for {resetValidationResponse.email}.
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" pb={2} width="100%">
              <Box>
                <Typography
                  variant="body2"
                  component="label"
                  htmlFor="password"
                  className={classes.label}>
                  Password
                </Typography>
              </Box>
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
                placeholder={`${MIN_PWD_LENGTH}+ characters`}
                inputRef={focusOnMount}
                type="password"
                onKeyUp={keyUpHandler}
                value={password}
                onChange={handleChange}
                error={Boolean(error)}
                helperText={error ?? ''}
              />
              <Typography variant="caption" color="textSecondary">
                Password must not start or end with a blank space
              </Typography>
            </Box>
            <Box width="100%" pb={2}>
              <Button
                color="primary"
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={resetting}
                style={{height: '45px'}}
                tabIndex="0">
                {resetting ? 'Resetting password...' : 'Reset password'}
              </Button>
            </Box>
            {resetting && (
              <Box position="absolute" top={0} left={0} width="100%">
                <LinearProgress color="secondary" />
              </Box>
            )}
          </Box>
        ) : null}
        {resetValidationError ? (
          <Box width="100%">
            <Alert variant="filled" className={classes.alert} severity="error">
              <Typography variant="body1">{resetValidationError}</Typography>
            </Alert>
          </Box>
        ) : null}
      </BlankCentered>
      {snackbarTypeError}
    </>
  );
};

export default ResetPassword;

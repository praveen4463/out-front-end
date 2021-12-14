import React, {useContext, useEffect, useState, useRef} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import {useQuery} from 'react-query';
import Typography from '@material-ui/core/Typography';
import {Helmet} from 'react-helmet-async';
import Alert from '@material-ui/lab/Alert';
import {QueryKeys} from '../Constants';
import {apiKeyFetch} from '../api/fetches';
import {SettingsSnackbarContext} from '../contexts';
import {
  composePageTitle,
  copy,
  getIfPermissionError,
  handleApiError,
} from '../common';
import Loader from '../components/Loader';
import Application from '../config/application';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  textField: {
    width: '100%',
  },
  alert: {
    padding: `0 ${theme.spacing(2)}px`,
  },
  button: {
    textTransform: 'none',
    padding: theme.spacing(1, 2),
    minWidth: theme.spacing(10),
  },
}));

const ApiKey = () => {
  const [copyText, setCopyText] = useState('Copy');
  const [permissionError, setPermissionError] = useState(null);
  const [, setSnackbarAlertError] = useContext(SettingsSnackbarContext);
  const {data: key, error, isLoading: keyLoading} = useQuery(
    QueryKeys.API_KEY,
    apiKeyFetch,
    {
      staleTime: 10 * 60 * 1000,
      retry: (failureCount, ex) => {
        const unauthorizedError = getIfPermissionError(ex);
        if (unauthorizedError) {
          setPermissionError(unauthorizedError);
          return false;
        }
        if (failureCount > 3) {
          return false;
        }
        return true;
      },
    }
  );
  const keyTextField = useRef();
  const classes = useStyles();

  useEffect(() => {
    if (!permissionError && error) {
      handleApiError(error, setSnackbarAlertError, 'Api key failed to load');
    }
  }, [error, setSnackbarAlertError, permissionError]);

  const handleCopy = () => {
    copy(key)
      .then(() => {
        setCopyText('Copied!');
        keyTextField.current?.select();
        setTimeout(() => setCopyText('Copy'), 2000);
      })
      .catch((ex) => {
        throw ex;
      });
  };

  const getText = (value, light = false, variant = 'body1') => (
    <Typography
      variant={variant}
      color={light ? 'textSecondary' : 'textPrimary'}>
      {value}
    </Typography>
  );

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Helmet title={composePageTitle('Api key')} />
      <Box>{getText('Api key', false, 'h4')}</Box>
      <Box pb={4}>{getText('View your api key', true, 'body2')}</Box>
      <Box
        className={classes.content}
        p={6}
        boxShadow={3}
        width="750px"
        display="flex"
        flexDirection="column">
        {keyLoading ? (
          <Box width="100%">
            <Loader rows={4} />
          </Box>
        ) : null}
        {key ? (
          <>
            <Box display="flex" alignItems="center" p={1}>
              <TextField
                inputRef={keyTextField}
                variant="outlined"
                margin="none"
                fullWidth
                value={key}
              />
              <Box p={0.5} />
              <Button
                onClick={handleCopy}
                variant="contained"
                className={classes.button}>
                {copyText}
              </Button>
            </Box>
            <Box py={2} />
            <Typography variant="body2">
              Check out our guide to{' '}
              <b>
                <a
                  href="https://docs.outomated.com/api"
                  target="_blank"
                  rel="noreferrer">
                  using the api.
                </a>
              </b>
            </Typography>
            <Box py={1} />
            <Typography variant="body2">
              If you wish to renew your API key, please write an email to{' '}
              {Application.SUPPORT_EMAIL}.
            </Typography>
          </>
        ) : null}
        {permissionError ? (
          <Box pb={2} width="60%">
            <Alert variant="filled" className={classes.alert} severity="error">
              <Typography variant="body1">{permissionError}</Typography>
            </Alert>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default ApiKey;

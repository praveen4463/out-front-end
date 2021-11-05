import React, {useState} from 'react';
import Box from '@material-ui/core/Box';
import {Switch, Route, useRouteMatch} from 'react-router-dom';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import {Helmet} from 'react-helmet-async';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Alert from '@material-ui/lab/Alert';
import axios from 'axios';
import isURL from 'validator/lib/isURL';
import clsx from 'clsx';
import {Endpoints} from '../Constants';
import {composePageTitle, handleApiError} from '../common';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  buttonSave: {
    padding: `8px ${theme.spacing(6)}px`,
  },
  textField: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: '1rem',
  },
  label: {
    fontWeight: 600,
    paddingBottom: theme.spacing(1),
  },
  alert: {
    padding: theme.spacing(0, 2),
  },
  lightText: {
    color: `rgba(0, 0, 0, 0.6)`,
  },
}));

function Status(msg = null, isError = false) {
  this.msg = msg;
  this.isError = isError;
}

const Default = () => {
  const [status, setStatus] = useState(new Status());
  const [url, setURL] = useState('');
  const [desc, setDesc] = useState('');
  const [sending, setSending] = useState(false);
  const classes = useStyles();

  const resetOnChange = () => {
    setStatus(new Status());
  };

  const handleURLChange = ({target}) => {
    setURL(target.value);
    resetOnChange();
  };

  const handleDescChange = ({target}) => {
    setDesc(target.value);
    resetOnChange();
  };

  const handleSubmit = async () => {
    const urlNormalized = url.trim();
    const descNormalized = desc.trim();
    if (!urlNormalized.length) {
      setStatus(new Status('Url is required', true));
      return;
    }
    if (!isURL(urlNormalized)) {
      setStatus(new Status('Url is looking invalid', true));
      return;
    }
    if (!descNormalized.length) {
      setStatus(new Status('Description is required', true));
      return;
    }
    setSending(true);
    try {
      await axios.post(Endpoints.INVITATION_REQ, {
        email: `${urlNormalized}\n${descNormalized}`,
      });
      setStatus(
        new Status(
          'Thanks for submitting a task. An engineer will be assigned shortly to work on this.'
        )
      );
    } catch (ex) {
      setSending(false);
      handleApiError(ex, (errorMsg) => setStatus(new Status(errorMsg, true)));
    } finally {
      setSending(false);
      setURL('');
      setDesc('');
    }
  };

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Helmet title={composePageTitle('Tasks')} />
      <Box pb={1}>
        <Typography variant="h5">QA Tasks</Typography>
      </Box>
      <Box pb={4}>
        <Typography variant="body1" color="textSecondary">
          Submit a request for a functionality in your app that you would like
          to have tested.
        </Typography>
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
        <Typography
          variant="body2"
          component="label"
          htmlFor="url"
          className={classes.label}>
          URL
        </Typography>
        <Typography
          variant="caption"
          className={clsx(classes.label, classes.lightText)}>
          URL of the page where the functionality resides in your app
        </Typography>
        <TextField
          value={url}
          name="url"
          id="url"
          variant="outlined"
          fullWidth
          InputProps={{
            classes: {input: classes.textField},
            inputProps: {tabIndex: '0'},
          }}
          onChange={handleURLChange}
          margin="none"
          autoFocus
        />
        <Box py={2} />
        <Typography
          variant="body2"
          component="label"
          htmlFor="desc"
          className={classes.label}>
          Description
        </Typography>
        <Typography
          variant="caption"
          className={clsx(classes.label, classes.lightText)}>
          Explain any details about what you&apos;d like to have tested
        </Typography>
        <TextField
          value={desc}
          multiline
          rows={4}
          name="desc"
          id="desc"
          variant="outlined"
          fullWidth
          InputProps={{
            classes: {input: classes.textField},
            inputProps: {tabIndex: '0'},
          }}
          onChange={handleDescChange}
          margin="none"
        />
      </Box>
      <Box pt={2}>
        <Button
          variant="contained"
          color="secondary"
          disabled={sending}
          className={classes.buttonSave}
          onClick={handleSubmit}>
          {sending ? 'Submitting...' : 'Submit'}
        </Button>
      </Box>
    </Box>
  );
};

const ManageTasks = () => {
  const {path} = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}>
        <Default />
      </Route>
    </Switch>
  );
};

export default ManageTasks;

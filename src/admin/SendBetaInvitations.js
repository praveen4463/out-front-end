/* eslint-disable react/no-array-index-key */
import React, {useState} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import LinearProgress from '@material-ui/core/LinearProgress';
import axios from 'axios';
import {EmailVerificationUserType, Endpoints, Timeouts} from '../Constants';
import {handleApiError} from '../common';
import useRequiredAdmin from '../hooks/useRequiredAdmin';
import PageLoadingIndicator from '../components/PageLoadingIndicator';
import BlankCentered from '../layouts/BlankCentered';

const useStyles = makeStyles((theme) => ({
  alert: {
    padding: `0 ${theme.spacing(2)}px`,
  },
}));

const StatusType = {
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
};

function Status(msg = '', type = StatusType.INFO) {
  this.msg = msg;
  this.type = type;
}

const SendBetaInvitations = () => {
  const auth = useRequiredAdmin();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(new Status());
  const [working, setWorking] = useState(false);
  const [emails, setEmails] = useState('');
  const [stop, setStop] = useState(false);
  const [results, setResults] = useState(null);
  const classes = useStyles();

  const handleChange = ({target}) => {
    setEmails(target.value);
  };

  const toStatus = (msg, type) => {
    setStatus(new Status(msg, type));
  };

  const handleSubmit = () => {
    const processed = [];
    const failed = [];
    if (!emails.trim().length) {
      toStatus('Nothing to send', StatusType.ERROR);
      return;
    }
    const emailSet = new Set(emails.split('\n'));
    const total = emailSet.size;
    setWorking(true);
    toStatus(
      `Going to send invitations to total ${total} emails`,
      StatusType.INFO
    );
    // not using for-of as lint guide doesn't allow it
    const emailIterator = emailSet.values();
    let at = 0;
    const send = () => {
      const entry = emailIterator.next();
      at += 1;
      const email = entry.value;
      if (entry.done || stop) {
        const result = {};
        if (stop) {
          result.stoppedMsg = `Stop requested, current email is ${email} at position ${at}\n`;
          setStop(false);
        }
        const emailArray = [...emailSet];
        const unProcessed = emailArray.filter(
          (e) => !processed.includes(e) && !failed.includes(e)
        );
        result.processed = processed;
        result.failed = failed;
        result.unProcessed = unProcessed;
        setResults(result);
        toStatus('', Status.INFO);
        setProgress(0);
        setWorking(false);
        return;
      }
      if (!email.trim().length) {
        toStatus(`Skipping a blank entry at position ${at}`, StatusType.ERROR);
        setProgress(Math.ceil((at * 100) / total));
        send();
        return;
      }
      toStatus(`Sending email to ${email}...`, StatusType.INFO);
      const payload = {
        email,
        emailVerificationUserType: EmailVerificationUserType.BETA_INVITEE,
      };
      axios
        .post(Endpoints.EMAIL_VERIFICATION, payload, {
          timeout: Timeouts.SYNC_EMAIL_SENDER,
        })
        .then(() => {
          toStatus(`Sent email to ${email}`, StatusType.SUCCESS);
          processed.push(email);
        })
        .catch((error) => {
          handleApiError(
            error,
            (errorMsg) => toStatus(errorMsg, StatusType.ERROR),
            `Failure sending email to ${email}`
          );
          failed.push(email);
        })
        .finally(() => {
          setProgress(Math.ceil((at * 100) / total));
          send();
        });
    };
    send();
  };

  const handleStop = () => {
    setStop(true);
  };

  if (!auth.authStateLoaded) {
    return <PageLoadingIndicator />;
  }

  return (
    <BlankCentered width="40%">
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center">
        <Box pb={2}>
          <Typography variant="h6">Send Beta Invitations</Typography>
        </Box>
        {results && !working ? (
          <Box
            p={2}
            mb={1}
            width="100%"
            style={{backgroundColor: '#2196f3', color: '#fff'}}>
            <Box display="flex" flexDirection="column">
              {results.stoppedMsg ? (
                <>
                  <Typography variant="body1">{results.stoppedMsg}</Typography>
                  <hr width="100%" />
                </>
              ) : null}
              <Typography variant="body1">Processed:</Typography>
              {results.processed.map((p, i) => (
                <Typography variant="body1" key={i}>
                  {p}
                </Typography>
              ))}
              <hr width="100%" />
              <Typography variant="body1">Failed:</Typography>
              {results.failed.map((p, i) => (
                <Typography variant="body1" key={i}>
                  {p}
                </Typography>
              ))}
              <hr width="100%" />
              <Typography variant="body1">Unprocessed:</Typography>
              {results.unProcessed.map((p, i) => (
                <Typography variant="body1" key={i}>
                  {p}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : null}
        {status.msg ? (
          <Box pb={2} width="100%">
            <Alert
              variant="filled"
              className={classes.alert}
              severity={status.type}>
              <Typography variant="body1">{status.msg}</Typography>
            </Alert>
          </Box>
        ) : null}
        <Box pb={2} width="100%">
          <TextField
            name="emails"
            id="emails"
            label="Enter emails separated by new line"
            variant="outlined"
            margin="none"
            fullWidth
            InputProps={{
              inputProps: {tabIndex: '0'},
            }}
            multiline
            rows={20}
            onChange={handleChange}
            value={emails}
          />
        </Box>
        <Box pb={2} display="flex" flex={1} width="100%">
          <Button
            color="primary"
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={working}
            style={{height: '45px', marginRight: '10px'}}
            tabIndex="0">
            {working ? 'Sending Invitations...' : 'Send Invitations'}
          </Button>
          {working ? (
            <Button
              color="secondary"
              variant="contained"
              fullWidth
              onClick={handleStop}
              disabled={stop}
              style={{height: '45px'}}
              tabIndex="0">
              {stop ? 'Stopping...' : 'Stop'}
            </Button>
          ) : null}
        </Box>
        {progress ? (
          <Box position="absolute" top={0} left={0} width="100%">
            <LinearProgress
              color="secondary"
              variant="determinate"
              value={progress}
            />
          </Box>
        ) : null}
      </Box>
    </BlankCentered>
  );
};

export default SendBetaInvitations;

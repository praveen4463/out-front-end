import React, {useState, useCallback, useRef} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import axios from 'axios';
import FileUpload from './FileUpload';
import {Endpoints} from '../Constants';
import {handleApiError} from '../common';

const useStyles = makeStyles((theme) => ({
  alert: {
    color: theme.palette.error.contrastText,
    padding: `0 ${theme.spacing(2)}px`,
  },
  root: {
    width: '100%',
    color: theme.palette.background.contrastText,
  },
  label: {
    paddingBottom: theme.spacing(1),
    fontWeight: 500,
  },
  textField: {
    width: '80%',
  },
}));

function Status(msg, isSuccess = false) {
  this.msg = msg;
  this.isSuccess = isSuccess;
}

const Issue = () => {
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const uploadedFileNameRef = useRef(null);
  const fileUploadSetStatusRef = useRef(null);
  const classes = useStyles();

  const setFileUploadSetStatus = useCallback((fileUploadSetStatus) => {
    fileUploadSetStatusRef.current = fileUploadSetStatus;
  }, []);

  const focusOnMount = useCallback((input) => {
    if (input !== null) {
      input.focus();
    }
  }, []);

  const handleDescChange = (e) => {
    setDescription(e.target.value);
    if (descriptionError) {
      setDescriptionError(null);
    }
  };

  const handleSend = async () => {
    const desc = description.trim();
    if (!desc.length) {
      setDescriptionError('Description is required');
      return;
    }
    setSaving(true);
    const body = {desc};
    if (uploadedFileNameRef.current) {
      body.fileName = uploadedFileNameRef.current;
    }
    try {
      await axios.post(Endpoints.ISSUE, body);
      setStatus(new Status('Thanks for your feedback.', true));
      // reset when report sent so that another could be sent
      setDescription('');
      uploadedFileNameRef.current = null;
      fileUploadSetStatusRef.current(null); // invoking function of file upload
    } catch (error) {
      handleApiError(
        error,
        (msg) => setStatus(new Status(msg)),
        'An error occurred while sending'
      );
      // when error occurs sending, don't clear file and attach status so that
      // user know their file is up (if successful attach) and they just need to
      // retry.
    } finally {
      setSaving(false);
    }
  };

  const onUploadStart = () => {
    setUploading(true);
  };

  const onUploadDone = (file, fileName) => {
    if (fileName) {
      uploadedFileNameRef.current = fileName;
    }
    setUploading(false);
  };

  return (
    <div className={classes.root}>
      <Box display="flex" flexDirection="column">
        <Box pb={2}>
          <Collapse in={Boolean(status)}>
            <Alert
              variant="filled"
              className={classes.alert}
              severity={status && status.isSuccess ? 'success' : 'error'}
              onClose={() => setStatus(null)}>
              <Typography variant="body1">{status && status.msg}</Typography>
            </Alert>
          </Collapse>
        </Box>
        <Box display="flex" flexDirection="column" pb={2}>
          <Typography
            variant="body2"
            component="label"
            htmlFor="description"
            className={classes.label}>
            Description
          </Typography>
          <TextField
            multiline
            rows={16}
            variant="outlined"
            value={description}
            name="description"
            id="description"
            onChange={handleDescChange}
            error={Boolean(descriptionError)}
            helperText={descriptionError}
            margin="none"
            inputProps={{tabIndex: '0'}}
            inputRef={focusOnMount}
            className={classes.textField}
          />
        </Box>
        <Box>
          <FileUpload
            isReady={!saving}
            uploadButtonText="Attach a file"
            endpoint={Endpoints.ISSUE}
            onStart={onUploadStart}
            onComplete={onUploadDone}
            getSuccessMsg={(fileName) => `${fileName} attached`}
            getErrorMsg={(fileName) => `Couldn't attach ${fileName}`}
            setSetStatus={setFileUploadSetStatus}
          />
        </Box>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            disabled={saving || uploading}
            onClick={handleSend}>
            {saving ? 'Sending...' : 'Send'}
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default Issue;

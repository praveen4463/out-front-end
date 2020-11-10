import React, {useState, useCallback, useRef} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import FileUpload from './FileUpload';
import {ApiStatuses} from '../Constants';
import {invokeOnApiCompletion} from '../common';

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
    color: theme.palette.text.secondary,
    paddingBottom: theme.spacing(1),
  },
  textField: {
    width: '80%',
  },
}));

// api will put these uploads in user-data bucket under 'uploads' dir (we need to change code
// to put test files in separate directory) and append a timestamp with the name.
const UPLOAD_ENDPOINT = '/userUploads';

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
  const uploadedFileRef = useRef(null);
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

  const handleSend = () => {
    const desc = description.trim();
    if (!desc.length) {
      setDescriptionError('Description is required');
      return;
    }
    const file = uploadedFileRef.current;
    const onSuccess = () => {
      if (file) {
        console.log(`issue sent with file: ${file.name}`);
      }
      setStatus(
        new Status(
          "Thank you for taking the time to write this. We've received it and will be getting back very soon.",
          true
        )
      );
      // reset when report sent so that another could be sent
      setDescription('');
      uploadedFileRef.current = null;
      fileUploadSetStatusRef.current(null);
    };
    const onError = (response) => {
      setStatus(
        new Status(`An error occurred while sending, ${response.error.reason}`)
      );
      // when error occurs sending, don't clear file and attach status so that
      // user know their file is up (if successful attach) and they just need to
      // retry.
    };
    // When issue is submitted, api checks if any filename is given, if so it finds
    // the file in bucket with matching name. If file found, it is attached to an email
    // that will then be sent to issue tracker system which creates an issue, assigns
    // reporter to the user.
    setTimeout(() => {
      setSaving(false);
      const response = {
        status: ApiStatuses.SUCCESS,
      };
      // const response = getApiError('Network error');
      invokeOnApiCompletion(response, onSuccess, onError);
    }, 1000);
    setSaving(true);
  };

  const onUploadStart = () => {
    setUploading(true);
  };

  const onUploadDone = (file) => {
    // if uploaded, file is there.
    if (file) {
      uploadedFileRef.current = file;
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
            endpoint={UPLOAD_ENDPOINT}
            onStart={onUploadStart}
            onComplete={onUploadDone}
            getSuccessMsg={(fileName) => `${fileName} attached`}
            getErrorMsg={(fileName, error) =>
              `Couldn't attach ${fileName}, ${error}`
            }
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

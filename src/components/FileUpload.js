import React, {useState, useRef} from 'react';
import Button from '@material-ui/core/Button';
import {makeStyles} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import PropTypes from 'prop-types';
// eslint-disable-next-line no-unused-vars
import axios from 'axios';
import useConfirmationDialog from '../hooks/useConfirmationDialog';
import {
  MaxLengths,
  MB_BYTES,
  GCP_OBJECT_NAME_REGEX,
  GCP_OBJECT_NAME_ILLEGAL_CHARS_STRING,
} from '../Constants';
import normalizeString from '../utils';

const useStyles = makeStyles((theme) => ({
  alert: {
    color: theme.palette.error.contrastText,
    padding: `0 ${theme.spacing(2)}px`,
  },
  progress: {
    height: '15px',
  },
}));

function Status(msg, isSuccess = false) {
  this.msg = msg;
  this.isSuccess = isSuccess;
}

const FileUpload = ({
  isReady,
  uploadButtonText,
  maxUploadMegaBytes,
  // eslint-disable-next-line no-unused-vars
  endpoint,
  uniqueFileTypeSpecifiers,
  wrongTypeMsg,
  isDuplicateFile,
  onStart,
  onComplete,
}) => {
  const [uploadProgress, setUploadProgress] = useState(null);
  const [status, setStatus] = useState(null);
  const selectedFileRef = useRef(null);
  const fileInputRef = useRef(null);
  const classes = useStyles();

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
  const isValidFileType = (type) => {
    if (!uniqueFileTypeSpecifiers.length) {
      return true;
    }
    if (uniqueFileTypeSpecifiers.indexOf(type) >= 0) {
      return true;
    }
    return uniqueFileTypeSpecifiers.some((u) => {
      let value = u;
      if (u.endsWith('*')) {
        value = u.substring(0, u.length - 1);
      }
      return type.startsWith(value);
    });
  };

  const isValidSize = (sizeBytes) => {
    return sizeBytes <= maxUploadMegaBytes * MB_BYTES;
  };

  const upload = () => {
    // I am assuming PUT will replace file when we upload same named file, otherwise
    // a new one will be created. That's why this function is called from replace dialog too.
    // Following code should work when we've api setup to upload multipart form data,
    // refer to spring docs for setting up that api and verify tat progress is working
    // correctly. We will first send file to our api, api will upload the stream to
    // gcs so that browser to gcs upload complexities are not there (like getting
    // signed urls for gcs and then upload directly there). I prefer to proxy the
    // upload through our api.
    // Reference axios: https://github.com/axios/axios/blob/master/examples/upload/
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Monitoring_progress
    // For now I am going to mock everything.
    const file = selectedFileRef.current;
    setUploadProgress(0);
    setStatus(null);
    onStart();
    /* const data = new FormData();
    data.append('file', file);
    const config = {
      onUploadProgress(progressEvent) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      },
    };
    axios
      .put(endpoint, data, config)
      .then(() => {
        setUploadProgress(null);
        setStatus(new Status(`${file.name} uploaded!`, true));
        onComplete(file);
      })
      .catch((err) => {
        setUploadProgress(null);
        const errMsg = `Couldn't upload, ${err.message}`;
        setStatus(new Status(errMsg));
        onComplete(null, errMsg);
      }); */
    const success = () => {
      setUploadProgress(null);
      setStatus(new Status(`${file.name} uploaded!`, true));
      onComplete(file);
    };
    /* const error = (err) => {
      setUploadProgress(null);
      const errMsg = `Couldn't upload, ${err.message}`;
      setStatus(new Status(errMsg));
      onComplete(null, errMsg);
    }; */
    let progress = 0;
    const start = Date.now();
    const send = () => {
      setTimeout(() => {
        progress += 10;
        setUploadProgress(progress);
        if (Date.now() - start < 4500) {
          // break when 90% progress is done.
          send();
        } else {
          success();
          // error({message: 'Network error'});
        }
      }, 500);
    };
    send();
  };

  const [setShowReplaceDialog, replaceDialog] = useConfirmationDialog(
    upload,
    'Replace',
    `${
      selectedFileRef.current ? selectedFileRef.current.name : ''
    } already exist, would you like to replace it?`,
    'replace-alert-dialog-description'
  );

  const validateName = (name) => {
    const normalized = normalizeString(name);
    if (normalized.length > MaxLengths.GCP_OBJECT_NAME) {
      return `File name is too long, max allowed is ${MaxLengths.GCP_OBJECT_NAME} characters`;
    }
    if (GCP_OBJECT_NAME_REGEX.test(name)) {
      return `File name has invalid characters. These characters are disallowed: ${GCP_OBJECT_NAME_ILLEGAL_CHARS_STRING}`;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const {files} = e.target;
    const file = files[0];
    selectedFileRef.current = file;
    const {name, size, type} = file;
    fileInputRef.current.value = ''; // reset file input here so that change event fires every time
    // a file is selected, even if it's the same file.
    if (!isValidFileType(type)) {
      setStatus(new Status(wrongTypeMsg));
      return;
    }
    if (!isValidSize(size)) {
      setStatus(
        new Status(
          `Uploading that big file is currently not supported, maximum allowed size is ${MaxLengths.UPLOAD_SIZE_MB}MB`
        )
      );
      return;
    }
    const nameError = validateName(name);
    if (nameError) {
      setStatus(new Status(nameError));
      return;
    }
    if (isDuplicateFile(name)) {
      setShowReplaceDialog(true);
      return;
    }
    upload();
  };

  return (
    <>
      <Box mb={2} display="flex" alignItems="center">
        <Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUploadClick}
            disabled={
              uploadProgress !== null || !isReady || !fileInputRef.current
            }>
            {uploadButtonText}
          </Button>
        </Box>
        <Box flex={1} ml={2}>
          <Collapse in={Boolean(status)}>
            <Alert
              variant="filled"
              className={classes.alert}
              severity={status && status.isSuccess ? 'success' : 'error'}
              onClose={() => setStatus(null)}>
              <Typography variant="body1">{status && status.msg}</Typography>
            </Alert>
          </Collapse>
          {uploadProgress !== null ? (
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              className={classes.progress}
            />
          ) : null}
        </Box>
      </Box>
      {replaceDialog}
      <input
        type="file"
        id="file"
        name="file"
        accept={uniqueFileTypeSpecifiers.join(',')}
        style={{opacity: 0}}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </>
  );
};

FileUpload.propTypes = {
  isReady: PropTypes.bool,
  uploadButtonText: PropTypes.string,
  maxUploadMegaBytes: PropTypes.number,
  endpoint: PropTypes.string.isRequired,
  uniqueFileTypeSpecifiers: PropTypes.arrayOf(PropTypes.string),
  wrongTypeMsg: PropTypes.string,
  isDuplicateFile: PropTypes.func,
  onStart: PropTypes.func,
  onComplete: PropTypes.func,
};

FileUpload.defaultProps = {
  isReady: true,
  uploadButtonText: 'Upload File',
  maxUploadMegaBytes: MaxLengths.UPLOAD_SIZE_MB,
  uniqueFileTypeSpecifiers: [],
  wrongTypeMsg: null,
  isDuplicateFile: () => false,
  onStart: () => null,
  onComplete: () => null,
};

export default FileUpload;

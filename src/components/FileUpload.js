import React, {useState, useRef, useEffect} from 'react';
import Button from '@material-ui/core/Button';
import {makeStyles} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import PropTypes from 'prop-types';
import axios from 'axios';
import useConfirmationDialog from '../hooks/useConfirmationDialog';
import {
  MaxLengths,
  MB_BYTES,
  GCP_OBJECT_NAME_REGEX,
  GCP_OBJECT_NAME_ILLEGAL_CHARS_STRING,
  Timeouts,
} from '../Constants';
import normalizeString from '../utils';
import {handleApiError} from '../common';

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
  endpoint,
  uniqueFileTypeSpecifiers,
  wrongTypeMsg,
  isDuplicateFile,
  onStart,
  onComplete,
  getSuccessMsg,
  getErrorMsg,
  setSetStatus,
}) => {
  const [uploadProgress, setUploadProgress] = useState(null);
  const [status, setStatus] = useState(null);
  const selectedFileRef = useRef(null);
  // after normalizing name, we should store file name separately because we can't
  // change name in file object. Make sure to use this rather than file.name
  const selectedFileNameRef = useRef(null);
  const fileInputRef = useRef(null);
  const classes = useStyles();

  useEffect(() => {
    setSetStatus(setStatus);
  }, [setSetStatus]);

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

  const upload = async () => {
    // PUT will replace file when we upload same named file, otherwise
    // a new one will be created. That's why this function is called from replace dialog too.
    // We will first send file to our api, api will upload the stream to
    // gcs so that browser to gcs upload complexities are not there (like getting
    // signed urls for gcs and then upload directly there). I prefer to proxy the
    // upload through our api.
    // Reference axios: https://github.com/axios/axios/blob/master/examples/upload/
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Monitoring_progress
    const file = selectedFileRef.current;
    const fileName = selectedFileNameRef.current;
    setUploadProgress(0);
    setStatus(null);
    onStart();
    const data = new FormData();
    data.append('file', file);
    data.append('fileName', fileName); // fileName could be different than file.name after normalizing,
    // api should use it rather than file.name
    const config = {
      onUploadProgress(progressEvent) {
        console.log('progressEvent fired', progressEvent);
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        /*
        !NOTE:
        Currently the progress indication is not working correctly. Progress events
        can just track whether the file data is fully sent with the request but since
        we are proxy the transfer via our api, it can just track client -> api upload
        and not api -> GCS. It will mark the file completed as it's pushed to api.
        To fix it, there are complicated things to implement. First, the file should go
        to GCS in chunks and api should give us a transferId. Then from here make HEAD
        req to api with transferId to know how many chunks have been pushed. See
        https://pqina.nl/filepond/docs/patterns/api/server/#process-chunks to learn more
        about the potential process.
        Since uploading is used at fewer places I am leaving it as is, just stop the progress
        bar in the middle somewhere so that user doesn't think transfer is completed whereas
        it's taking more time. Later if needed I can fix things.
        */
        if (percentCompleted > 70) {
          return;
        }
        setUploadProgress(percentCompleted);
      },
      timeout: Timeouts.API_TIMEOUT_LONG,
    };
    try {
      await axios.put(endpoint, data, config);
      setUploadProgress(null);
      setStatus(new Status(getSuccessMsg(fileName), true));
      onComplete(file, fileName);
    } catch (error) {
      setUploadProgress(null);
      handleApiError(
        error,
        (errMsg) => {
          setStatus(new Status(errMsg));
          onComplete(null, null, errMsg);
        },
        getErrorMsg(fileName)
      );
    }
  };

  const [setShowReplaceDialog, replaceDialog] = useConfirmationDialog(
    upload,
    'Replace',
    `${
      selectedFileNameRef.current ? selectedFileNameRef.current : ''
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

  // normalize name so that most common bugs in file name are handled, like spaces.
  const normalizeFileName = (name) => {
    return name.replaceAll(' ', '_');
  };

  const handleFileChange = (e) => {
    const {files} = e.target;
    const file = files[0];
    const name = normalizeFileName(file.name);
    selectedFileRef.current = file;
    selectedFileNameRef.current = name;
    const {size, type} = file;
    fileInputRef.current.value = ''; // reset file input here so that change event fires every time
    // a file is selected, even if it's the same file.
    if (size === 0) {
      setStatus(new Status('Selected file is empty'));
      return;
    }
    if (!isValidFileType(type)) {
      setStatus(new Status(wrongTypeMsg));
      return;
    }
    if (!isValidSize(size)) {
      setStatus(
        new Status(
          `Files that big are not currently supported, maximum allowed size is ${MaxLengths.UPLOAD_SIZE_MB}MB`
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
            disabled={uploadProgress !== null || !isReady}>
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
        style={{display: 'none'}}
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
  getSuccessMsg: PropTypes.func,
  getErrorMsg: PropTypes.func,
  setSetStatus: PropTypes.func,
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
  getSuccessMsg: (fileName) => `${fileName} uploaded`,
  getErrorMsg: (fileName) => `Couldn't upload ${fileName}`,
  setSetStatus: () => null,
};

export default FileUpload;

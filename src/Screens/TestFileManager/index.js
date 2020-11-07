import React, {useState, useEffect} from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Link from '@material-ui/core/Link';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import MuiSkeleton from '@material-ui/lab/Skeleton';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {pull} from 'lodash-es';
import {
  invokeOnApiCompletion,
  getShortCurrentMonthName,
  getFileSizeInUnit,
} from '../../common';
import {ApiStatuses} from '../../Constants';
import useConfirmationDialog from '../../hooks/useConfirmationDialog';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import TooltipCustom from '../../TooltipCustom';
import FileUpload from '../../components/FileUpload';

const TextValue = withStyles((theme) => ({
  root: {
    fontSize: theme.typography.pxToRem(14),
    color: theme.palette.background.contrastText,
  },
}))(Typography);

const Skeleton = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.contrastText,
    margin: theme.spacing(1),
  },
}))(MuiSkeleton);

function File(name, size, created) {
  this.name = name;
  this.size = size;
  this.created = created;
}

const useStyles = makeStyles((theme) => ({
  status: {
    marginLeft: theme.spacing(2),
  },
  textOverflowHide: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  header: {
    color: theme.palette.text.hint,
    backgroundColor: theme.palette.background.paperContrast,
  },
  contrastText: {
    color: theme.palette.background.contrastText,
  },
  icon: {
    padding: 0,
    borderRadius: 'unset',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  downloadLink: {
    background: 'none',
    height: '20px',
  },
}));

const getSortedFiles = (files) => {
  return files.sort((a, b) => a.name.localeCompare(b.name));
};

const ENDPOINT = '/api/testFiles';

const Actions = ({file, onDelete, deleteDisabled}) => {
  const {name} = file;
  const classes = useStyles();
  const deleteAcceptHandler = () => {
    onDelete(file);
  };
  const [setShowDeleteDialog, deleteDialog] = useConfirmationDialog(
    deleteAcceptHandler,
    'delete',
    `Are you sure you want to delete file ${name}?`,
    'delete-alert-dialog-description'
  );

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <TooltipCustom title="Download File">
        <Link
          href={`${ENDPOINT}/${name}`} // get to endpoint downloads file, i.e content-disposition and content
          aria-label="Download File"
          color="inherit"
          className={clsx(classes.icon, classes.downloadLink)}>
          <GetAppIcon fontSize="small" />
        </Link>
      </TooltipCustom>
      <TooltipCustom title="Delete File">
        <span>
          <IconButton
            aria-label="Delete File"
            onClick={handleDelete}
            disabled={deleteDisabled}
            className={classes.icon}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </TooltipCustom>
      {deleteDialog}
    </>
  );
};

Actions.propTypes = {
  file: PropTypes.instanceOf(File).isRequired,
  onDelete: PropTypes.func.isRequired,
  deleteDisabled: PropTypes.bool.isRequired,
};

const TestFileManager = () => {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const classes = useStyles();

  useEffect(() => {
    const onSuccess = (response) => {
      setFiles(response.data.files);
    };
    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't fetch files, ${response.error.reason}`);
    };
    setTimeout(() => {
      // send GET request to ENDPOINT and expect list of files in order of name
      // when no file, an empty array is returned.
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          files: [
            new File('shot.svg', '1.5MB', 'Oct 29, 2020'), // just show day no time as these are test files
            // it helps us in adding file locally rather than fetching again.
            new File('movie.mov', '40MB', 'Oct 21, 2020'),
            new File('plan.pdf', '0.5MB', 'Oct 22, 2020'),
          ],
        },
      };
      // const response = getApiError('Network error');
      invokeOnApiCompletion(response, onSuccess, onError);
      setLoading(false);
    }, 1000);
    setLoading(true);
  }, [setSnackbarErrorMsg]);

  const getCurrentDate = () => {
    const d = new Date();
    return `${getShortCurrentMonthName()} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const isDuplicateFile = (fileName) => {
    return files.some((f) => f.name === fileName);
  };

  const addNewRawFile = (rawFile) => {
    const file = new File(
      rawFile.name,
      getFileSizeInUnit(rawFile.size),
      getCurrentDate()
    );
    const clonedFiles = [...files];
    const index = files.findIndex((f) => f.name === file.name);
    if (index >= 0) {
      // if this upload is a duplicate named file, replace the existing.
      clonedFiles.splice(index, 1, file);
      setFiles(clonedFiles);
      return;
    }
    clonedFiles.push(file);
    setFiles(getSortedFiles(clonedFiles));
  };

  const handleDelete = (file) => {
    setFiles((fls) => {
      const clone = [...fls];
      pull(clone, file);
      return [...clone];
    });

    const onError = (response) => {
      setSnackbarErrorMsg(
        `Couldn't delete file ${file.name}, ${response.error.reason}`
      );
      // on error, revert the deleted file
      setFiles((fls) => getSortedFiles([...fls, file]));
    };
    setTimeout(() => {
      // send DELETE request to endpoint with file name and expect success
      const response = {
        status: ApiStatuses.SUCCESS,
      };
      /* const response = getApiError('Network error'); */
      invokeOnApiCompletion(response, () => null, onError);
    }, 1000);
  };

  const onUploadStart = () => {
    setUploading(true);
  };

  const onUploadDone = (file) => {
    // if uploaded, file is there.
    if (file) {
      addNewRawFile(file);
    }
    setUploading(false);
  };

  return (
    <>
      <Box display="flex" flexDirection="column">
        <FileUpload
          isReady={Boolean(files)}
          endpoint={ENDPOINT}
          isDuplicateFile={isDuplicateFile}
          onStart={onUploadStart}
          onComplete={onUploadDone}
        />
        {!loading && files ? (
          <>
            <Box display="flex" className={classes.header} p={1} boxShadow={1}>
              <Box flexBasis="7%" />
              <Box flexBasis="68%">
                <Typography variant="caption">NAME</Typography>
              </Box>
              <Box flexBasis="10%">
                <Typography variant="caption">SIZE</Typography>
              </Box>
              <Box flexBasis="15%">
                <Typography variant="caption">CREATED ON</Typography>
              </Box>
            </Box>
            {files.length ? (
              files.map((f) => (
                <Box
                  p={1}
                  boxShadow={3}
                  display="flex"
                  key={f.name}
                  className={classes.contrastText}>
                  <Box
                    flexBasis="7%"
                    display="flex"
                    alignItems="center"
                    justifyContent="space-evenly">
                    <Actions
                      file={f}
                      onDelete={handleDelete}
                      deleteDisabled={uploading}
                    />
                  </Box>
                  <Box flexBasis="68%" className={classes.textOverflowHide}>
                    <TooltipCustom title={f.name}>
                      <TextValue>{f.name}</TextValue>
                    </TooltipCustom>
                  </Box>
                  <Box flexBasis="10%">
                    <TextValue>{f.size}</TextValue>
                  </Box>
                  <Box flexBasis="15%">
                    <TextValue>{f.created}</TextValue>
                  </Box>
                </Box>
              ))
            ) : (
              <Box
                p={1}
                boxShadow={3}
                display="flex"
                className={classes.contrastText}>
                <TextValue>No files yet.</TextValue>
              </Box>
            )}
          </>
        ) : null}
        {loading ? (
          <Box display="flex" flexDirection="column" flex={1}>
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <Skeleton variant="text" width="80%" height={15} key={k} />
            ))}
          </Box>
        ) : null}
      </Box>
      {snackbarTypeError}
    </>
  );
};

export default TestFileManager;

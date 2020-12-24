import React, {useState, useEffect, useCallback} from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import {makeStyles, withStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import MuiSkeleton from '@material-ui/lab/Skeleton';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {pull} from 'lodash-es';
import axios from 'axios';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {
  getShortCurrentMonthName,
  getFileSizeInUnit,
  getNewIntlComparer,
  handleApiError,
} from '../../common';
import {Endpoints, QueryKeys, Timeouts} from '../../Constants';
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

function File(name, size, createDate) {
  this.name = name;
  this.size = size;
  this.createDate = createDate;
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
  neutral: {
    color: '#868686',
  },
}));

const getSortedFiles = (files) => {
  return files.sort((a, b) => getNewIntlComparer()(a.name, b.name));
};

const Actions = ({file, onDelete, onDownload, deleteDisabled, downloading}) => {
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

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(file);
  };

  return (
    <>
      <TooltipCustom title="Download File">
        {!downloading ? (
          <IconButton
            aria-label="Download File"
            onClick={handleDownload}
            className={clsx(classes.icon, classes.downloadLink)}>
            <GetAppIcon fontSize="small" />
          </IconButton>
        ) : (
          <CircularProgress size={20} className={classes.neutral} />
        )}
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
  onDownload: PropTypes.func.isRequired,
  deleteDisabled: PropTypes.bool.isRequired,
  downloading: PropTypes.bool.isRequired,
};

const TestFileManager = () => {
  const [downloadingFileNames, setDownloadingFileNames] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const queryClient = useQueryClient();
  const classes = useStyles();

  const testFileQuery = useQuery(QueryKeys.TEST_FILES, async () => {
    const {data} = await axios(Endpoints.TEST_FILES);
    const files = data.map((f) => new File(f.name, f.size, f.createDate));
    return getSortedFiles(files);
  });

  const showError = useCallback(
    (msg) => {
      setSnackbarErrorMsg(msg);
    },
    [setSnackbarErrorMsg]
  );

  useEffect(() => {
    if (testFileQuery.isError) {
      handleApiError(testFileQuery.error, showError, 'Files failed to load');
    }
  }, [testFileQuery.error, testFileQuery.isError, showError]);

  const files = testFileQuery.data;

  const getCurrentDate = () => {
    const d = new Date();
    return `${getShortCurrentMonthName()} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const isDuplicateFile = (fileName) => {
    return files.some((f) => f.name === fileName);
  };

  const addNewRawFile = (rawFile, fileName) => {
    const file = new File(
      fileName,
      getFileSizeInUnit(rawFile.size),
      getCurrentDate()
    );
    queryClient.setQueryData(QueryKeys.TEST_FILES, (old) => {
      const clonedFiles = [...old];
      const index = files.findIndex((f) => f.name === file.name);
      if (index >= 0) {
        // if this upload is a duplicate named file, replace the existing.
        clonedFiles.splice(index, 1, file);
        return clonedFiles;
      }
      clonedFiles.push(file);
      return getSortedFiles(clonedFiles);
    });
  };

  const deleteFileMutation = useMutation(
    async (file) => {
      await axios.delete(`${Endpoints.TEST_FILES}/${file.name}`);
    },
    {
      onMutate: (file) => {
        queryClient.setQueryData(QueryKeys.TEST_FILES, (old) =>
          pull([...old], file)
        );
      },
      onError: (err, file) => {
        handleApiError(err, showError, `Couldn't delete file`);
        queryClient.setQueryData(QueryKeys.TEST_FILES, (old) =>
          getSortedFiles([...old, file])
        );
      },
    }
  );

  const onDownloadFile = async (file) => {
    const {name} = file;
    try {
      setDownloadingFileNames((fns) =>
        !fns.includes(name) ? [...fns, name] : fns
      );
      const {data} = await axios.get(`${Endpoints.TEST_FILES}/${name}`, {
        responseType: 'blob',
        timeout: Timeouts.API_TIMEOUT_LONG,
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      handleApiError(error, showError, `Couldn't download file`);
    } finally {
      setDownloadingFileNames((fns) => pull([...fns], name));
    }
  };

  const onUploadStart = () => {
    setUploading(true);
  };

  const onUploadDone = (file, fileName) => {
    // if uploaded, file is there.
    if (file && fileName) {
      addNewRawFile(file, fileName);
    }
    setUploading(false);
  };

  return (
    <>
      <Box display="flex" flexDirection="column">
        <FileUpload
          isReady={Boolean(files)}
          maxUploadMegaBytes={200}
          endpoint={Endpoints.TEST_FILES}
          isDuplicateFile={isDuplicateFile}
          onStart={onUploadStart}
          onComplete={onUploadDone}
        />
        {!testFileQuery.isLoading && files ? (
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
                      onDelete={deleteFileMutation.mutate}
                      onDownload={onDownloadFile}
                      deleteDisabled={uploading}
                      downloading={downloadingFileNames.includes(f.name)}
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
                    <TextValue>{f.createDate}</TextValue>
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
        {testFileQuery.isLoading ? (
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

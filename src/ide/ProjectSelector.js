import React, {
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Box from '@material-ui/core/Box';
import Alert from '@material-ui/lab/Alert';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import axios from 'axios';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import Tooltip from '../TooltipCustom';
import {RESET_STATE, SET_PROJECT} from './actionTypes';
import batchActions from './actionCreators';
import {IdeDispatchContext, IdeProjectIdContext} from './Contexts';
import useSnackbarTypeError from '../hooks/useSnackbarTypeError';
import {MaxLengths, QueryKeys, Endpoints} from '../Constants';
import {getNewIntlComparer, handleApiError} from '../common';
import {equalIgnoreCase} from '../utils';

const useStyles = makeStyles((theme) => ({
  formControl: {
    minWidth: '25%',
  },
  alert: {
    color: theme.palette.error.contrastText,
    padding: `0 ${theme.spacing(2)}px`,
  },
  addIcon: {
    paddingBottom: 0,
    borderRadius: 'unset',
  },
  addIconFont: {
    fontSize: '0.9rem',
  },
  input: {
    fontSize: '0.9rem',
    opacity: theme.textOpacity.highEmphasis,
  },
  list: {
    minHeight: theme.spacing(8),
  },
  root: {
    backgroundColor: theme.palette.background.paperOnDefault,
    color: theme.palette.background.contrastText,
    marginBottom: '40%',
  },
  dlgTitle: {
    margin: 0,
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.border.light}`,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  buttonCancel: {
    marginLeft: theme.spacing(1),
  },
  buttonSave: {
    padding: `0px ${theme.spacing(6)}px`,
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Slide direction="down" ref={ref} {...props} />;
});

const ProjectSelector = React.memo(() => {
  const dispatch = useContext(IdeDispatchContext);
  const projectId = useContext(IdeProjectIdContext);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const queryClient = useQueryClient();
  const classes = useStyles();

  // result on useQuery doesn't change on re renders, thus can be used in memo or callbacks.
  const projQuery = useQuery(
    QueryKeys.PROJECTS,
    async () => {
      const response = await axios(Endpoints.PROJECTS);
      const p = response.data;
      p.sort((a, b) => getNewIntlComparer()(a.name, b.name));
      return p;
    },
    {
      staleTime: 1000 * 60 * 5, // keep fetched caps in cache for atleast 5mins before refetching
      // occurs on remount or win focus.
    }
  );

  const showError = useCallback(
    (msg) => {
      setSnackbarErrorMsg(msg);
    },
    [setSnackbarErrorMsg]
  );

  useEffect(() => {
    if (projQuery.isError) {
      handleApiError(projQuery.error, showError, 'Projects failed to load');
    }
  }, [projQuery.error, projQuery.isError, showError]);

  const projects = projQuery.data;

  // when a project is changed, we first clear entire state to be on safe side
  // with any issue while resetting files before changing project which will
  // set files/vars again.
  const changeProject = (pId) => {
    dispatch(
      batchActions([
        {
          type: RESET_STATE,
        },
        {
          type: SET_PROJECT,
          payload: {projectId: pId},
        },
      ])
    );
  };

  const closeDlg = () => {
    setName('');
    setNameError(null);
    setDlgOpen(false);
  };

  const newProjectMutation = useMutation(
    async (projectName) => {
      const {data} = await axios.post(Endpoints.PROJECTS, {name: projectName});
      return data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(QueryKeys.PROJECTS, (old) =>
          [...old, data].sort((a, b) => getNewIntlComparer()(a.name, b.name))
        );
        changeProject(data.id);
        closeDlg();
      },
      onError: (err) => {
        handleApiError(
          err,
          showError,
          'An error occurred while saving project'
        );
      },
    }
  );

  const handleChange = (event) => {
    changeProject(event.target.value);
  };

  const projectIdExists = useMemo(() => {
    return projects && projectId && projects.some((p) => p.id === projectId);
  }, [projectId, projects]);

  const getLabel = () => {
    if (!projects) {
      return 'Loading...';
    }
    if (!projects.length) {
      return 'No projects yet';
    }
    return projectIdExists ? '' : 'Select a project';
  };

  const focusOnMount = useCallback((input) => {
    if (input !== null) {
      input.focus();
    }
  }, []);

  const openDlg = () => {
    setDlgOpen(true);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  };

  const handleSave = () => {
    const projectName = name.trim();
    if (!projectName.length) {
      setNameError('A name is required');
      return;
    }
    if (projectName.length > MaxLengths.PROJECT_NAME) {
      setNameError(
        `Project name is too long, max allowed is ${MaxLengths.PROJECT_NAME} characters`
      );
      return;
    }
    if (projects.some((p) => equalIgnoreCase(p.name, projectName))) {
      setNameError('A project with the same name already exists');
      return;
    }
    newProjectMutation.mutate(projectName);
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleCancel = () => {
    closeDlg();
  };

  return (
    <>
      <FormControl
        className={classes.formControl}
        error={projects && !projectIdExists}>
        <InputLabel id="projectSelectLabel">{getLabel()}</InputLabel>
        <Select
          labelId="projectSelectLabel"
          id="projectSelect"
          value={!projectIdExists ? '' : projectId}
          className={classes.input}
          MenuProps={{classes: {list: classes.list}}}
          onChange={handleChange}>
          {projects
            ? projects.map((p) => (
                <MenuItem value={p.id} key={p.id}>
                  {p.name}
                </MenuItem>
              ))
            : null}
        </Select>
      </FormControl>
      <Tooltip title="Create & Switch to New Project">
        <IconButton
          aria-label="Create & Switch to New Project"
          onClick={openDlg}
          className={classes.addIcon}>
          <AddCircleIcon
            color="secondary"
            classes={{root: classes.addIconFont}}
          />
        </IconButton>
      </Tooltip>
      <Box position="absolute" display="flex" justifyContent="center" top={52}>
        {/* show alert only when projects load is done and either there is no projectId,
        no projects, invalid projectId */}
        <Collapse in={projects && !projectIdExists}>
          <Alert variant="filled" className={classes.alert} severity="error">
            <Typography variant="body1">
              Please select an existing project or create new
            </Typography>
          </Alert>
        </Collapse>
      </Box>
      <Dialog
        TransitionComponent={Transition}
        onClose={closeDlg}
        fullWidth
        maxWidth="sm"
        open={dlgOpen}
        classes={{paper: classes.root}}>
        <DialogTitle
          onClose={closeDlg}
          disableTypography
          className={classes.dlgTitle}>
          <Typography variant="h6">New project</Typography>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={closeDlg}>
            <CloseIcon titleAccess="Close" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column">
            <Box display="flex" flexDirection="column" pb={2}>
              <Typography
                variant="body2"
                component="label"
                htmlFor="name"
                className={classes.label}>
                Name
              </Typography>
              <TextField
                value={name}
                name="description"
                id="description"
                onChange={handleNameChange}
                onKeyUp={keyUpHandler}
                error={Boolean(nameError)}
                helperText={nameError}
                margin="none"
                inputProps={{tabIndex: '0'}}
                inputRef={focusOnMount}
                className={classes.textField}
              />
            </Box>
            <Box display="flex">
              <Button
                variant="contained"
                color="secondary"
                disabled={newProjectMutation.isLoading}
                className={classes.buttonSave}
                onClick={handleSave}>
                {newProjectMutation.isLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="contained"
                className={classes.buttonCancel}
                disabled={newProjectMutation.isLoading}
                onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      {snackbarTypeError}
    </>
  );
});

export default ProjectSelector;

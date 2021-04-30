import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import axios from 'axios';
import {useHistory, useLocation, useParams} from 'react-router-dom';
import {useQuery, useMutation} from 'react-query';
import {equalIgnoreCase} from '../utils';
import {
  Endpoints,
  MaxLengths,
  PageUrl,
  QueryKeys,
  SearchKeys,
  SnackbarType,
} from '../Constants';
import {projectsFetch} from '../api/fetches';
import {
  getLocation,
  getRenameProjectEndpoint,
  handleApiError,
  updateInSearchQuery,
} from '../common';
import {SnackbarAlertProps} from '../model';
import {
  HomeLinearProgressContext,
  ManagementSnackbarContext,
} from '../contexts';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  buttonCancel: {
    marginLeft: theme.spacing(1),
  },
  buttonSave: {
    padding: `0px ${theme.spacing(6)}px`,
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
}));

const CreateProject = () => {
  const existProjectId = useParams().id;
  // query disabled when we're editing as we want cached, immediately available data
  const {data: projects, error, refetch} = useQuery(
    QueryKeys.PROJECTS,
    projectsFetch,
    {
      enabled: !existProjectId,
    }
  );
  const existProject = useMemo(() => {
    if (existProjectId && projects) {
      return projects.find((p) => p.id === Number(existProjectId));
    }
    return null;
  }, [existProjectId, projects]);
  const [name, setName] = useState(existProject ? existProject.name : '');
  const [nameError, setNameError] = useState(null);
  const history = useHistory();
  const location = useLocation();
  const setProgressAtTopBar = useContext(HomeLinearProgressContext);
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    ManagementSnackbarContext
  );
  const locationInState =
    location.state && location.state.location ? location.state.location : null;
  const classes = useStyles();

  const goInitiator = useCallback(() => {
    history.push(
      locationInState || getLocation(PageUrl.MANAGE_PROJECTS, location.search)
    );
  }, [history, location.search, locationInState]);

  useEffect(() => {
    if (error) {
      handleApiError(error, setSnackbarAlertError, 'Projects failed to load');
    }
  }, [error, setSnackbarAlertError]);

  // when we're in editing mode, expect projects to be loaded from cache, if
  // they ain't available, redirect, also redirect if given project wasn't found.
  useEffect(() => {
    if (existProjectId && !existProject) {
      goInitiator();
    }
  });

  const postSave = (id) => {
    setSnackbarAlertProps(
      new SnackbarAlertProps(
        `Project ${name} successfully created!`,
        SnackbarType.SUCCESS
      )
    );
    if (projects.length === 0 && locationInState) {
      // issue a refetch before redirecting to location with new project
      // otherwise the projectSelector doesn't refetch immediately on render
      // and again redirect to 'selectAProject' finding the new project no-existent.
      // don't wait for refetch to completed and immediately send to location otherwise
      // if projectSelector re-renders upon fetch success, it finds no projectId and
      // redirects to 'selectAProject'
      refetch({throwOnError: true});
      // when this is the first project created, we should append projectId in
      // location search and redirect to what is in state.
      updateInSearchQuery(locationInState, history, SearchKeys.PROJECT_QS, id);
      return;
    }
    goInitiator();
  };

  const postEdit = () => {
    setSnackbarAlertProps(
      new SnackbarAlertProps(
        `Project ${name} successfully edited!`,
        SnackbarType.SUCCESS
      )
    );
    goInitiator();
  };

  const newProjectMutation = useMutation(
    async (projectName) => {
      const {data} = await axios.post(Endpoints.PROJECTS, {
        name: projectName,
      });
      return data;
    },
    {
      onSuccess: (data) => {
        postSave(data.id);
      },
      onError: (err) => {
        handleApiError(
          err,
          setSnackbarAlertError,
          'An error occurred while creating project'
        );
      },
    }
  );

  const renameProjectMutation = useMutation(
    async (projectName) => {
      await axios.patch(getRenameProjectEndpoint(existProjectId), {
        name: projectName,
      });
    },
    {
      onSuccess: () => {
        postEdit();
      },
      onError: (err) => {
        handleApiError(
          err,
          setSnackbarAlertError,
          'An error occurred while editing project'
        );
      },
    }
  );

  const mutationLoading =
    newProjectMutation.isLoading || renameProjectMutation.isLoading;

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  };

  const handleCancel = () => {
    goInitiator();
  };

  const handleSave = () => {
    const projectName = name.trim();
    if (!projectName.length) {
      setNameError('A name is required');
      return;
    }
    if (projectName.length > MaxLengths.PROJECT_NAME) {
      setNameError(
        `Project names can't be larger than ${MaxLengths.PROJECT_NAME} characters`
      );
      return;
    }
    // if this is an edit and user submits with the same data, just cancel edit
    if (existProject && equalIgnoreCase(existProject.name, projectName)) {
      handleCancel();
      return;
    }
    if (projects.some((p) => equalIgnoreCase(p.name, projectName))) {
      setNameError('A project with the same name already exists');
      return;
    }
    const mutation = existProjectId
      ? renameProjectMutation
      : newProjectMutation;
    mutation.mutate(projectName);
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  // using an effect so that we don't invoke it too often.
  useEffect(() => {
    setProgressAtTopBar(mutationLoading);
    return () => setProgressAtTopBar(false);
  }, [mutationLoading, setProgressAtTopBar]);

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Box pb={4}>
        <Typography variant="h5">
          {existProjectId ? 'Edit project' : 'Create a project'}
        </Typography>
      </Box>
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
          htmlFor="name"
          className={classes.label}>
          Name
        </Typography>
        <TextField
          value={name}
          name="name"
          id="name"
          variant="outlined"
          fullWidth
          InputProps={{
            classes: {input: classes.textField},
            inputProps: {tabIndex: '0'},
          }}
          onChange={handleNameChange}
          onKeyUp={keyUpHandler}
          error={Boolean(nameError)}
          helperText={nameError}
          margin="none"
          autoFocus
        />
      </Box>
      <Box display="flex" pt={2}>
        <Button
          variant="contained"
          color="secondary"
          disabled={mutationLoading}
          className={classes.buttonSave}
          onClick={handleSave}>
          {mutationLoading
            ? `${existProjectId ? 'Updating' : 'Creating'} project...`
            : `${existProjectId ? 'Update' : 'Create'} project`}
        </Button>
        <Button
          variant="contained"
          className={classes.buttonCancel}
          disabled={mutationLoading}
          onClick={handleCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default CreateProject;

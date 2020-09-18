import React, {useState, useEffect, useContext, useMemo} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Tooltip from '../TooltipCustom';
import {SET_PROJECT} from './actionTypes';
import {IdeDispatchContext, IdeStateContext} from './Contexts';

const useStyles = makeStyles((theme) => ({
  formControl: {
    minWidth: '25%',
  },
  addIcon: {
    paddingBottom: 0,
    '&:hover': {
      background: 'none',
    },
  },
  addIconFont: {
    fontSize: '0.9rem',
    '&:hover': {
      color: '#07fae1',
    },
  },
  input: {
    fontSize: '0.9rem',
    opacity: theme.textOpacity.highEmphasis,
  },
  list: {
    minHeight: theme.spacing(8),
  },
}));

const ProjectSelector = () => {
  const dispatch = useContext(IdeDispatchContext);
  const {projectId} = useContext(IdeStateContext);
  const [projects, setProjects] = useState(null);
  const classes = useStyles();
  useEffect(() => {
    setTimeout(
      () =>
        setProjects([
          {value: 4, text: 'Zylitics Docs Site'},
          {value: 2, text: 'Zylitics Front End'},
          {value: 1, text: 'Zylitics IDE'},
          {value: 3, text: 'Zylitics Marketing Site'},
        ]),
      2000
    );
    // !! Sample data, load projects from db for the current user, sorted.
  }, []);

  // We're using root context, to make sure this component doesn't render when
  // state other than projectId changes, memoize the return value and only
  // compute when project is changed.
  // https://github.com/facebook/react/issues/15156#issuecomment-474590693
  return useMemo(() => {
    const newProjectHandler = () => {
      /*
      // open dialog, create new project and keep generated id and project name.
      const newProject = {id: 10, name: 'Zylitics Front End Api'};
      const {id} = newProject;
      setProjects((p) => {
        p.push(newProject);
        // !! sort p
        return p;
      });
      // invoke dispatch
      */
    };

    const handleChange = (event) => {
      // fetch files for the new project and send through payload so that
      // reducer can set to state. If there is any other side effect need to
      // run first do that. We could show some progress bar while we fetch
      // new data for new project like build related things, files etc. Think
      // about it later.
      dispatch({
        type: SET_PROJECT,
        payload: {projectId: event.target.value},
      });
    };

    return (
      <>
        <FormControl className={classes.formControl}>
          <InputLabel id="projectSelectLabel">
            {projectId ? '' : 'Select a project'}
          </InputLabel>
          <Select
            labelId="projectSelectLabel"
            id="projectSelect"
            value={projectId ?? ''}
            className={classes.input}
            MenuProps={{classes: {list: classes.list}}}
            onChange={handleChange}>
            {projects ? (
              projects.map((p) => (
                <MenuItem value={p.value} key={p.value}>
                  {p.text}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">Loading...</MenuItem>
            )}
          </Select>
        </FormControl>
        <Tooltip title="Create & Switch to New Project">
          <IconButton
            aria-label="Create & Switch to New Project"
            onClick={newProjectHandler}
            className={classes.addIcon}>
            <AddCircleIcon
              color="secondary"
              classes={{root: classes.addIconFont}}
            />
          </IconButton>
        </Tooltip>
      </>
    );
  }, [projectId, classes, dispatch, projects]); // only projectId changes among these
};

export default ProjectSelector;

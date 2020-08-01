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
  addIconFont: {
    fontSize: '0.9rem',
  },
  input: {
    fontSize: '0.9rem',
    opacity: theme.textOpacity.highEmphasis,
  },
}));

const ProjectSelector = () => {
  const dispatch = useContext(IdeDispatchContext);
  const {projectId} = useContext(IdeStateContext);
  const [projects, setProjects] = useState(null);
  const classes = useStyles();
  useEffect(() => {
    // !! Sample data, load projects from db for the current user, sorted.
    setProjects([
      {value: 4, text: 'Zylitics Docs Site'},
      {value: 2, text: 'Zylitics Front End'},
      {value: 1, text: 'Zylitics IDE'},
      {value: 3, text: 'Zylitics Marketing Site'},
    ]);
  }, []); // run this effect just once on mounting.

  // We're using root context, to make sure this component doesn't render when
  // state other than projectId changes, memoize the return value and only
  // compute when project is changed.
  // https://github.com/facebook/react/issues/15156#issuecomment-474590693
  return useMemo(() => {
    console.log('project selector loaded');
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

    if (projects === null) {
      return <span>Loading...</span>;
    }

    return (
      <>
        <FormControl className={classes.formControl}>
          <InputLabel id="projectSelectLabel">Project</InputLabel>
          <Select
            labelId="projectSelectLabel"
            id="projectSelect"
            value={projectId ?? ''}
            className={classes.input}
            onChange={handleChange}>
            {projects.map((p) => (
              <MenuItem value={p.value} key={p.value}>
                {p.text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Create & Switch to New Project">
          <IconButton
            aria-label="Create & Switch to New Project"
            onClick={newProjectHandler}>
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

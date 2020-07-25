import React, {useState, useEffect, useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Tooltip from '../TooltipCustom';
import {SET_PROJECT} from './actionTypes';
import {RootDispatchContext, RootStateContext} from './Contexts';

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
  const dispatch = useContext(RootDispatchContext);
  const {projectId} = useContext(RootStateContext);
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
          onChange={(event) =>
            dispatch([SET_PROJECT, {projectId: event.target.value}])
          }>
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
};

export default ProjectSelector;

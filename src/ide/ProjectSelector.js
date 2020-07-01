import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Tooltip from '../TooltipCustom';

const useStyles = makeStyles(() => ({
  formControl: {
    minWidth: '25%',
  },
  addIconFont: {
    fontSize: '0.9rem',
  },
  input: {
    fontSize: '0.9rem',
  },
}));

const ProjectSelector = (props) => {
  const {selectedProject, changeProjectHandler} = props;
  const classes = useStyles();
  const [projects, setProjects] = useState(null);
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
    // !! invoke changeProjectHandler with id
    changeProjectHandler(id); */
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
          value={selectedProject}
          className={classes.input}
          onChange={(event) => changeProjectHandler(event.target.value)}>
          {projects.map((project) => (
            <MenuItem value={project.value} key={project.value}>
              {project.text}
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

ProjectSelector.propTypes = {
  selectedProject: PropTypes.number.isRequired,
  changeProjectHandler: PropTypes.func.isRequired,
};

export default ProjectSelector;

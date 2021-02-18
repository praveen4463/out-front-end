import React, {useEffect, useMemo} from 'react';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import {Link as RouterLink, useLocation, useHistory} from 'react-router-dom';
import {useQuery} from 'react-query';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import {
  getLocation,
  getNumberParamFromUrl,
  handleApiError,
  updateInSearchQuery,
} from '../common';
import {PageUrl, QueryKeys, SearchKeys} from '../Constants';
import {projectsFetch} from '../api/fetches';
import useSnackbarAlert from '../hooks/useSnackbarAlert';

const useStyles = makeStyles((theme) => ({
  button: {
    color: theme.palette.background.contrastText,
    textTransform: 'none',
    fontWeight: 500,
    padding: theme.spacing(1.5),
  },
  manageLink: {
    color: theme.palette.primary.main,
    textDecorationLine: 'underline',
    fontWeight: 700,
  },
}));

// Remember react query default setting is 'fetch on window refocus'
const ProjectSelector = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();
  const history = useHistory();
  const [, snackbarAlert, setSnackbarAlertError] = useSnackbarAlert();
  const {data: projects, error, isFetching} = useQuery(
    QueryKeys.PROJECTS,
    projectsFetch
  );
  const classes = useStyles();
  const projectId = getNumberParamFromUrl(
    SearchKeys.PROJECT_QS,
    location.search
  );

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (error) {
      handleApiError(error, setSnackbarAlertError, 'Projects failed to load');
    }
  }, [error, setSnackbarAlertError]);

  const handleSelect = ({target}) => {
    updateInSearchQuery(location, history, SearchKeys.PROJECT_QS, target.value);
    handleClose();
  };

  const [projectIdExists, selectedProject] = useMemo(() => {
    const exists =
      projects && projectId && projects.some((p) => p.id === projectId);
    let selected = null;
    if (exists) {
      selected = projects.find((p) => p.id === projectId);
    }
    return [exists, selected];
  }, [projectId, projects]);
  // console.log('projectIdExists, projectId', projectIdExists, projectId);

  useEffect(() => {
    if (
      projectId &&
      (isFetching ||
        projectIdExists ||
        location.pathname.startsWith(PageUrl.MANAGE_PROJECTS))
    ) {
      return;
    }
    history.push(
      getLocation(PageUrl.SELECT_PROJECT, location.search, {location})
    );
  }, [history, projects, isFetching, location, projectIdExists, projectId]);

  if (!projectIdExists) {
    return null;
  }

  return (
    <>
      <Button
        color="default"
        endIcon={<ArrowDropDownIcon />}
        className={classes.button}
        onClick={handleClick}>
        {selectedProject.name}
      </Button>
      <Menu
        id="projects"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        {projects.map((p) => (
          <MenuItem onClick={handleSelect} value={p.id} key={p.id}>
            {p.name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          component={RouterLink}
          to={getLocation(PageUrl.MANAGE_PROJECTS, location.search)}
          onClick={handleClose}
          aria-label="Manage Projects">
          <span className={classes.manageLink}>Manage Projects</span>
        </MenuItem>
      </Menu>
      {snackbarAlert}
    </>
  );
};

export default ProjectSelector;

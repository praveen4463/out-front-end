import React, {useEffect, useMemo, useRef, useCallback} from 'react';
import Box from '@material-ui/core/Box';
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
    padding: theme.spacing(0.5),
  },
  manageLink: {
    color: theme.palette.primary.main,
    textDecorationLine: 'underline',
    fontWeight: 700,
  },
  endIcon: {
    marginLeft: 0,
  },
}));

// Remember react query default setting is 'fetch on window refocus'
const ProjectSelector = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const location = useLocation();
  const history = useHistory();
  const buttonBoxRef = useRef(null);
  const [, snackbarAlert, setSnackbarAlertError] = useSnackbarAlert();
  const {data: projects, error, isFetching} = useQuery(
    QueryKeys.PROJECTS,
    projectsFetch,
    {staleTime: 5 * 60 * 1000}
  );
  const classes = useStyles();
  const projectId = getNumberParamFromUrl(
    SearchKeys.PROJECT_QS,
    location.search
  );

  const handleClick = () => {
    setAnchorEl(buttonBoxRef.current);
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

  const goSelectProject = useCallback(() => {
    history.push(
      getLocation(PageUrl.SELECT_PROJECT, location.search, {location})
    );
  }, [history, location]);

  // decide whether to send user to select a project page
  useEffect(() => {
    // if we're fetching, wait as we can't decide anything
    // if we've a projectId that exists in user's project, return
    if (isFetching || projectIdExists) {
      return;
    }
    // either user supplied no projectId in query, or it's invalid or they've no project
    // check whether user has projects, if so, we should send them back to select one
    // of the project
    if (projects?.length) {
      goSelectProject();
    }
    // user has no projects, check whether they're at manage project page, if so
    // let them stay here as they may be adding new one or creating/deleting something.
    // in this case, this component won't render
    if (location.pathname.startsWith(PageUrl.MANAGE_PROJECTS)) {
      return;
    }
    // send back in all other cases.
    goSelectProject();
  }, [goSelectProject, isFetching, location, projectIdExists, projects]);

  if (!projectIdExists) {
    return null;
  }

  return (
    <>
      <Box p={1} ref={buttonBoxRef}>
        <Button
          color="default"
          endIcon={<ArrowDropDownIcon />}
          className={classes.button}
          classes={{endIcon: classes.endIcon}}
          onClick={handleClick}>
          {selectedProject.name}
        </Button>
      </Box>
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

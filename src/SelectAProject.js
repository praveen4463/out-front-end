import React, {useEffect} from 'react';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/styles/makeStyles';
import Grid from '@material-ui/core/Grid';
import ButtonBase from '@material-ui/core/ButtonBase';
import Link from '@material-ui/core/Link';
import {useHistory, useLocation, Link as RouterLink} from 'react-router-dom';
import {useQuery} from 'react-query';
import {PageUrl, QueryKeys, SearchKeys} from './Constants';
import {projectsFetch} from './api/fetches';
import {
  getLocation,
  getZyliticsLogo,
  handleApiError,
  updateInSearchQuery,
} from './common';
import Loader from './components/Loader';
import useRequiredAuth from './hooks/useRequiredAuth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import useSnackbarAlert from './hooks/useSnackbarAlert';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    position: 'fixed',
    overflow: 'auto',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    zIndex: 1000,
    padding: theme.spacing(2),
  },
  gridRoot: {
    flexGrow: 1,
  },
  gridItem: {
    display: 'flex',
    justifyContent: 'center',
  },
  paper: {
    height: 200,
    width: 240,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1),
  },
  link: {
    fontWeight: 600,
  },
  button: {
    textTransform: 'none',
    '&:hover, &$focusVisible': {
      textDecoration: 'underline',
    },
  },
  focusVisible: {},
}));

const SelectAProject = () => {
  const auth = useRequiredAuth();
  const location = useLocation();
  const history = useHistory();
  const [, snackbarAlert, setSnackbarAlertError] = useSnackbarAlert();
  const {data: projects, error, isLoading} = useQuery(
    QueryKeys.PROJECTS,
    projectsFetch,
    {
      enabled: !!auth.user,
    }
  );
  const locationInState =
    location.state && location.state.location ? location.state.location : null;
  const classes = useStyles();

  const handleClick = (value) => {
    const toLocation = locationInState || getLocation(PageUrl.HOME);
    updateInSearchQuery(toLocation, history, SearchKeys.PROJECT_QS, value);
  };

  useEffect(() => {
    if (error) {
      handleApiError(error, setSnackbarAlertError, 'Projects failed to load');
    }
  }, [error, setSnackbarAlertError]);

  if (!auth.user) {
    return <PageLoadingIndicator />;
  }

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        className={classes.root}>
        <Box pt={5} pb={3}>
          {getZyliticsLogo()}
        </Box>
        {isLoading ? (
          <Box width="100%">
            <Loader rows={4} />
          </Box>
        ) : null}
        {projects ? (
          <>
            <Box pb={4}>
              <Typography variant="h4">
                {projects.length
                  ? 'Select a project'
                  : 'Create a project to continue'}
              </Typography>
            </Box>
            <Grid container className={classes.gridRoot} spacing={2}>
              {projects.length ? (
                <Grid item xs={12}>
                  <Grid container justify="center" spacing={2}>
                    {projects.map((p) => (
                      <Grid item xs={3} key={p.id} className={classes.gridItem}>
                        <ButtonBase
                          onClick={() => handleClick(p.id)}
                          className={classes.button}
                          focusVisibleClassName={classes.focusVisible}>
                          <Paper className={classes.paper}>
                            <Typography
                              variant="body1"
                              className={classes.link}>
                              {p.name}
                            </Typography>
                          </Paper>
                        </ButtonBase>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Grid container justify="center" spacing={2}>
                    <Grid item xs={3} className={classes.gridItem}>
                      <Link
                        component={RouterLink}
                        to={getLocation(
                          `${PageUrl.MANAGE_PROJECTS}${PageUrl.CREATE}`,
                          location.search,
                          {location: locationInState}
                        )}
                        aria-label="Create project">
                        <Paper className={classes.paper}>
                          <Typography variant="body1" className={classes.link}>
                            Create project
                          </Typography>
                        </Paper>
                      </Link>
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </Grid>
          </>
        ) : null}
      </Box>
      {snackbarAlert}
    </>
  );
};

export default SelectAProject;

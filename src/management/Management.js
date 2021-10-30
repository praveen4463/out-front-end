import React, {useMemo} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import {
  Switch,
  Route,
  useRouteMatch,
  useLocation,
  Link as RouterLink,
} from 'react-router-dom';
import {Helmet} from 'react-helmet-async';
import {filterSearchQuery, getLocation} from '../common';
import {PageUrl, SearchKeys} from '../Constants';
import ManageProjects from './ManageProjects';
import useSnackbarAlert from '../hooks/useSnackbarAlert';
import {ManagementSnackbarContext} from '../contexts';
import NotFound from '../NotFound';

const useStyles = makeStyles((theme) => ({
  linkText: {
    color: theme.palette.text.medium,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  linksContainer: {
    width: 200,
  },
  defaultRoot: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.border.light}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  divider: {
    width: '100%',
    margin: theme.spacing(2, 0),
  },
}));

function ListItemLink(props) {
  return (
    <ListItem
      button
      component={RouterLink}
      style={{padding: '0 0 0 4px'}}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

const Default = () => {
  const classes = useStyles();

  return (
    <Box className={classes.defaultRoot}>
      <Helmet title="Manage projects, capabilities, variables, and more." />
      <Typography variant="h4">Outomated management</Typography>
      <Typography variant="body1">
        Manage projects, capabilities, variables, and more.
      </Typography>
      <Divider variant="fullWidth" className={classes.divider} />
      <Typography variant="body2" color="textSecondary">
        Left menu shows the list of available options, rest of the management is
        available via IDE only (for now).
      </Typography>
    </Box>
  );
};

const Management = () => {
  const location = useLocation();
  const {path, url} = useRouteMatch();
  const getSearchLocation = useMemo(
    () => filterSearchQuery(location.search, [SearchKeys.PROJECT_QS]),
    [location.search]
  );
  const [
    setSnackbarAlertProps,
    snackbarAlert,
    setSnackbarAlertError,
  ] = useSnackbarAlert();
  const classes = useStyles();

  const getLink = (page, name) => (
    <ListItemLink
      to={getLocation(`${url}${page}`, getSearchLocation)}
      aria-label={name}>
      <ListItemText
        primary={name}
        classes={{
          primary: classes.linkText,
        }}
      />
    </ListItemLink>
  );

  return (
    <>
      <Box display="flex" alignItems="flex-start">
        <Box
          pr={2}
          overflow="auto"
          className={classes.linksContainer}
          component="nav">
          <List style={{padding: 0}}>
            {getLink(PageUrl.PROJECTS, 'Projects')}
          </List>
        </Box>
        <Box flex={1} display="flex" justifyContent="center">
          <ManagementSnackbarContext.Provider
            value={[setSnackbarAlertProps, setSnackbarAlertError]}>
            <Switch>
              <Route exact path={path}>
                <Default />
              </Route>
              <Route path={`${path}${PageUrl.PROJECTS}`}>
                <ManageProjects />
              </Route>
              <Route path="*">
                {/* Keep this in the end of switch */}
                <NotFound />
              </Route>
            </Switch>
          </ManagementSnackbarContext.Provider>
        </Box>
      </Box>
      {snackbarAlert}
    </>
  );
};

export default Management;

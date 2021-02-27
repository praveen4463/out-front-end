import React, {useMemo} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import {
  Switch,
  Route,
  useRouteMatch,
  useLocation,
  Link as RouterLink,
} from 'react-router-dom';
import {filterSearchQuery, getLocation} from '../common';
import {PageUrl, SearchKeys} from '../Constants';
import useSnackbarAlert from '../hooks/useSnackbarAlert';
import {BuildsSnackbarContext} from '../contexts';

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
      <Typography variant="h4">Finished Builds</Typography>
      <Typography variant="body1">
        Here we will have all builds listed with various search options
      </Typography>
    </Box>
  );
};

const Builds = () => {
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

  const getLink = (pageUrl, name) => (
    <ListItemLink
      to={getLocation(pageUrl, getSearchLocation)}
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
            {getLink(PageUrl.BUILDS, 'Finished Builds')}
            {getLink(`${url}${PageUrl.RUNNING_BUILDS}`, 'Running builds')}
            {getLink(`${url}${PageUrl.CREATE}`, 'New build')}
          </List>
        </Box>
        <Box flex={1} display="flex" justifyContent="center">
          <BuildsSnackbarContext.Provider
            value={[setSnackbarAlertProps, setSnackbarAlertError]}>
            <Switch>
              <Route exact path={path}>
                <Default />
              </Route>
              <Route path={`${path}${PageUrl.RUNNING_BUILDS}`}>
                <h1>Currently running builds...</h1>
              </Route>
              <Route path={`${path}${PageUrl.CREATE}`}>
                <h1>New Build</h1>
              </Route>
            </Switch>
          </BuildsSnackbarContext.Provider>
        </Box>
      </Box>
      {snackbarAlert}
    </>
  );
};

export default Builds;

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
import {composePageTitle, filterSearchQuery, getLocation} from '../common';
import {PageUrl, SearchKeys} from '../Constants';
import Profile from './Profile';
import useSnackbarAlert from '../hooks/useSnackbarAlert';
import {SettingsSnackbarContext} from '../contexts';
import Password from './Password';
import Email from './Email';
import Usage from './Usage';
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
      <Helmet title={composePageTitle('Settings')} />
      <Typography variant="h4">Zylitics settings</Typography>
      <Typography variant="body1">
        Edit your profile, view or change billing, usage quotas, and more.
      </Typography>
      <Divider variant="fullWidth" className={classes.divider} />
      <Typography variant="body2" color="textSecondary">
        Left menu shows the list of available options
      </Typography>
    </Box>
  );
};

const Settings = () => {
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
            {getLink(PageUrl.PROFILE, 'Profile')}
            {/* Billing is currently hidden as there wouldn't be much to show
            until we're into paid plans. Make sure only admins can access this link
            Billing may show current plan, upgrade options, previous invoice etc */}
            {/* getLink(PageUrl.BILLING, 'Billing') */}
            {getLink(PageUrl.EMAIL, 'Email')}
            {getLink(PageUrl.PASSWORD, 'Password')}
            {getLink(PageUrl.USAGE_QUOTA, 'Usage Quotas')}
            {/* Add members screen once we're in trials, can invite members,
            see members in org, change their role and disable/delete members. TODO: add
            members link then. Remember only admins can manage team members.
            Once a member is disabled, we will disable it in firebase and db. For
            now our queries don't have a check for user disable but firebase will
            log out user once their authStateChange listener is run. We could also
            user token revoke in near future to immediately log user out and they
            won't be able to login and make requests then. When delete we will
            delete form firebase and db both. */}
          </List>
        </Box>
        <Box flex={1} display="flex" justifyContent="center">
          <SettingsSnackbarContext.Provider
            value={[setSnackbarAlertProps, setSnackbarAlertError]}>
            <Switch>
              <Route exact path={path}>
                <Default />
              </Route>
              <Route path={`${path}${PageUrl.PROFILE}`}>
                <Profile />
              </Route>
              <Route path={`${path}${PageUrl.PASSWORD}`}>
                <Password />
              </Route>
              <Route path={`${path}${PageUrl.EMAIL}`}>
                <Email />
              </Route>
              <Route path={`${path}${PageUrl.USAGE_QUOTA}`}>
                <Usage />
              </Route>
              <Route path="*">
                {/* Keep this in the end of switch */}
                <NotFound />
              </Route>
            </Switch>
          </SettingsSnackbarContext.Provider>
        </Box>
      </Box>
      {snackbarAlert}
    </>
  );
};

export default Settings;

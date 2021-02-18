import React, {useMemo} from 'react';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import {
  Switch,
  Route,
  useRouteMatch,
  useLocation,
  Link as RouterLink,
} from 'react-router-dom';
import {filterSearchQuery, getLocation} from '../common';
import {PageUrl, SearchKeys} from '../Constants';
import ManageProjects from './ManageProjects';
import useSnackbarAlert from '../hooks/useSnackbarAlert';
import {ManagementSnackbarContext} from '../contexts';

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

  const getManagement = () => {
    return (
      <Box display="flex" flexDirection="column">
        <h2>Zylitics management</h2>
        <h5>Manage projects, build capabilities, variables, and more.</h5>
      </Box>
    );
  };

  return (
    <>
      <Box display="flex" flex={1}>
        <Box width="20%" pl={2} pr={2}>
          <ul style={{listStyleType: 'none', padding: 0, marginTop: 0}}>
            <li>
              <Link
                component={RouterLink}
                to={getLocation(`${url}${PageUrl.PROJECTS}`, getSearchLocation)}
                aria-label="Projects">
                Projects
              </Link>
            </li>
          </ul>
        </Box>
        <Box pr={2} flex={1}>
          <ManagementSnackbarContext.Provider
            value={[setSnackbarAlertProps, setSnackbarAlertError]}>
            <Switch>
              <Route exact path={path}>
                {getManagement()}
              </Route>
              <Route path={`${path}${PageUrl.PROJECTS}`}>
                <ManageProjects />
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

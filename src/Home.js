import React, {useState, useMemo} from 'react';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import {Switch, Route, useLocation, Link as RouterLink} from 'react-router-dom';
import {LinearProgress, makeStyles} from '@material-ui/core';
import useRequiredAuth from './hooks/useRequiredAuth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {PageUrl, SearchKeys} from './Constants';
import TopBar from './layouts/TopBar';
import {filterSearchQuery, getLocation} from './common';
import Management from './management/Management';
import {HomeLinearProgressContext} from './contexts/index';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    position: 'absolute',
    top: 48,
    bottom: 0,
    right: 0,
    left: 0,
  },
}));

const Home = () => {
  const [progress, setProgress] = useState(false);
  const auth = useRequiredAuth();
  const location = useLocation();
  const getSearchLocation = useMemo(
    () => filterSearchQuery(location.search, [SearchKeys.PROJECT_QS]),
    [location.search]
  );
  const classes = useStyles();

  if (!auth.user) {
    return <PageLoadingIndicator />;
  }

  const handleMenuClick = () => {
    console.log('clicked');
  };

  const getHome = () => {
    return (
      <Box display="flex" flexDirection="column">
        <h2>Welcome to Zylitics</h2>
        <h5>Please choose from one of the options from side navigations</h5>
      </Box>
    );
  };

  return (
    <>
      <TopBar onMenuClick={handleMenuClick} />
      <Box display="flex" className={classes.root}>
        <Box width="20%" p={2}>
          <ul style={{listStyleType: 'none', padding: 0}}>
            <li>
              <Link
                component={RouterLink}
                to={getLocation(PageUrl.HOME, getSearchLocation)}
                aria-label="Home">
                Home
              </Link>
            </li>
            <li>
              <Link
                component={RouterLink}
                to={getLocation(PageUrl.IDE, getSearchLocation)}
                aria-label="Home">
                IDE
              </Link>
            </li>
            <li>
              <Link
                component={RouterLink}
                to={getLocation(PageUrl.MANAGEMENT, getSearchLocation)}
                aria-label="Home">
                Management
              </Link>
            </li>
          </ul>
        </Box>
        <Box p={2} display="flex" flex={1}>
          <HomeLinearProgressContext.Provider value={setProgress}>
            <Switch>
              <Route exact path={PageUrl.HOME}>
                {getHome()}
              </Route>
              <Route path={PageUrl.MANAGEMENT}>
                <Management />
              </Route>
            </Switch>
          </HomeLinearProgressContext.Provider>
        </Box>
      </Box>
      {progress ? (
        <Box position="absolute" top={48} left={0} width="100%">
          <LinearProgress color="secondary" />
        </Box>
      ) : null}
    </>
  );
};

export default Home;

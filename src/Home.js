import React, {useState, useMemo, useEffect, useRef} from 'react';
import Box from '@material-ui/core/Box';
import Drawer from '@material-ui/core/Drawer';
import clsx from 'clsx';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import {
  Switch,
  Route,
  useLocation,
  useHistory,
  Link as RouterLink,
} from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import DashboardIcon from '@material-ui/icons/DashboardOutlined';
import BuildIcon from '@material-ui/icons/BuildOutlined';
import SettingsIcon from '@material-ui/icons/SettingsOutlined';
import ManageIcon from '@material-ui/icons/EventNoteOutlined';
import IdeIcon from '@material-ui/icons/CodeOutlined';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import {makeStyles} from '@material-ui/core/styles';
import {Helmet} from 'react-helmet-async';
import useRequiredAuth from './hooks/useRequiredAuth';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {PageUrl, SearchKeys} from './Constants';
import TopBar from './layouts/TopBar';
import {
  anyUserExistInLocalStorage,
  composePageTitle,
  filterSearchQuery,
  getLocation,
} from './common';
import Management from './management/Management';
import Settings from './settings/Settings';
import {HomeLinearProgressContext} from './contexts/index';
import Builds from './builds/Builds';
import NotFound from './NotFound';
import Application from './config/application';

function ListItemLink(props) {
  return (
    <ListItem
      button
      component={RouterLink}
      style={{padding: '12px 0', justifyContent: 'center'}}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    color: theme.palette.text.medium,
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1,
    },
  },
  drawerContainer: {
    overflow: 'auto',
  },
  content: {
    padding: theme.spacing(2, 3),
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.palette.background.default,
  },
  contentWhenPermanent: {
    left: drawerWidth,
  },
  contentWhenTemporary: {
    left: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      left: theme.spacing(9) + 1,
    },
  },
  icon: {
    color: theme.palette.text.medium,
    minWidth: 0,
  },
  iconWhenOpen: {
    margin: `0 ${theme.spacing(2)}px`,
  },
  linkText: {
    color: theme.palette.text.medium,
    fontWeight: 600,
  },
  linkTextRoot: {
    margin: 0,
  },
  hide: {
    display: 'none',
  },
  firstLink: {
    paddingTop: 0,
  },
  defaultRoot: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.border.light}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(4),
    maxWidth: '1200px',
    margin: '0 auto', // margin: auto center align content when width is given
  },
  divider: {
    width: '100%',
    margin: theme.spacing(2, 0),
  },
}));

// TODO: after sometime build something like this
// https://dashboard.cypress.io/projects/245obj/analytics/most-common-errors
// in dashboard to see summary of builds on dashboard
// similar page will also need to be built in builds section.
const Default = () => {
  const classes = useStyles();

  return (
    <Box className={classes.defaultRoot}>
      <Helmet title={composePageTitle('Dashboard')} />
      <Typography variant="h3">Welcome to Outomated!</Typography>
      <Typography variant="body1">
        Write, run, debug and watch your end to end tests using our easy to use
        platform.
      </Typography>
      <Divider variant="fullWidth" className={classes.divider} />
      <Typography variant="body2" color="textSecondary">
        Use sidebar and navigate to IDE for writing, running and debugging
        tests. For viewing previously completed builds or running new, head over
        to Builds.
      </Typography>
    </Box>
  );
};

const Home = () => {
  const [keepSidebarOpen, setKeepSidebarOpen] = React.useState(true);
  const [open, setOpen] = React.useState(true);
  const [progress, setProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const progressTimerRef = useRef(null);
  const history = useHistory();
  const location = useLocation();
  const auth = useRequiredAuth(() => {
    // when a user lands on root domain and they never had an account with us,
    // redirect them to about page otherwise login page.
    // when an existing user is logged out, or try logging in using root domain,
    // we will show login page rather than about.
    // This part runs only when user is not currently logged in.
    anyUserExistInLocalStorage().then((exists) => {
      if (!exists && location.pathname === PageUrl.HOME) {
        window.location = Application.ABOUT_ZYLITICS_URL;
      } else {
        history.push(getLocation(PageUrl.LOGIN, location.search, {location}));
      }
    });
  });
  const getSearchLocation = useMemo(
    () => filterSearchQuery(location.search, [SearchKeys.PROJECT_QS]),
    [location.search]
  );
  const classes = useStyles();

  useEffect(() => {
    if (!progress) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
      return undefined;
    }
    const timer = setInterval(() => {
      setProgressValue((oldProgress) => {
        if (oldProgress === 100) {
          return 0;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 500);
    progressTimerRef.current = timer;

    return () => {
      clearInterval(timer);
    };
  }, [progress]);

  if (!auth.user) {
    return <PageLoadingIndicator />;
  }

  const toggleSidebar = () => {
    setOpen(!keepSidebarOpen);
    setKeepSidebarOpen((v) => !v);
  };

  const onHovering = () => {
    if (keepSidebarOpen) {
      return;
    }
    setOpen(true);
  };

  const onHoveringCancel = () => {
    if (keepSidebarOpen) {
      return;
    }
    setOpen(false);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <TopBar
        onMenuClick={toggleSidebar}
        menuTooltip={keepSidebarOpen ? 'Collapse sidebar' : 'Keep sidebar open'}
      />
      <Drawer
        variant="permanent"
        onMouseEnter={onHovering}
        onMouseLeave={onHoveringCancel}
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open,
          }),
        }}>
        <Toolbar variant="dense" />
        <div className={classes.drawerContainer}>
          <List>
            <ListItemLink
              to={getLocation(PageUrl.HOME, getSearchLocation)}
              aria-label="Dashboard">
              <ListItemIcon
                className={clsx(classes.icon, classes.firstIcon, {
                  [classes.iconWhenOpen]: open,
                })}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText
                primary="Dashboard"
                classes={{
                  primary: classes.linkText,
                  root: classes.linkTextRoot,
                }}
                className={clsx(!open && classes.hide)}
              />
            </ListItemLink>
            <ListItemLink
              to={getLocation(PageUrl.BUILDS, getSearchLocation)}
              aria-label="Builds">
              <ListItemIcon
                className={clsx(classes.icon, {
                  [classes.iconWhenOpen]: open,
                })}>
                <BuildIcon />
              </ListItemIcon>
              <ListItemText
                primary="Builds"
                classes={{
                  primary: classes.linkText,
                  root: classes.linkTextRoot,
                }}
                className={clsx(!open && classes.hide)}
              />
            </ListItemLink>
            <ListItemLink
              to={getLocation(PageUrl.IDE, getSearchLocation)}
              aria-label="IDE">
              <ListItemIcon
                className={clsx(classes.icon, {
                  [classes.iconWhenOpen]: open,
                })}>
                <IdeIcon />
              </ListItemIcon>
              <ListItemText
                primary="IDE"
                classes={{
                  primary: classes.linkText,
                  root: classes.linkTextRoot,
                }}
                className={clsx(!open && classes.hide)}
              />
            </ListItemLink>
            <ListItemLink
              to={getLocation(PageUrl.MANAGEMENT, getSearchLocation)}
              aria-label="Management">
              <ListItemIcon
                className={clsx(classes.icon, {
                  [classes.iconWhenOpen]: open,
                })}>
                <ManageIcon />
              </ListItemIcon>
              <ListItemText
                primary="Management"
                classes={{
                  primary: classes.linkText,
                  root: classes.linkTextRoot,
                }}
                className={clsx(!open && classes.hide)}
              />
            </ListItemLink>
            <ListItemLink
              to={getLocation(PageUrl.SETTINGS, getSearchLocation)}
              aria-label="Settings">
              <ListItemIcon
                className={clsx(classes.icon, {
                  [classes.iconWhenOpen]: open,
                })}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                classes={{
                  primary: classes.linkText,
                  root: classes.linkTextRoot,
                }}
                className={clsx(!open && classes.hide)}
              />
            </ListItemLink>
          </List>
        </div>
      </Drawer>
      <main
        className={clsx(classes.content, {
          [classes.contentWhenPermanent]: keepSidebarOpen,
          [classes.contentWhenTemporary]: !keepSidebarOpen,
        })}>
        <Toolbar variant="dense" />
        <HomeLinearProgressContext.Provider value={setProgress}>
          <Switch>
            <Route exact path={PageUrl.HOME}>
              <Default />
            </Route>
            <Route path={PageUrl.MANAGEMENT}>
              <Management />
            </Route>
            <Route path={PageUrl.SETTINGS}>
              <Settings />
            </Route>
            <Route path={PageUrl.BUILDS}>
              <Builds />
            </Route>
            <Route path="*">
              {/* Keep this in the end of switch */}
              <NotFound />
            </Route>
          </Switch>
        </HomeLinearProgressContext.Provider>
      </main>
      {progress ? (
        <Box position="absolute" top={0} left={0} width="100%">
          <Toolbar variant="dense" />
          <LinearProgress
            variant="determinate"
            color="secondary"
            value={progressValue}
          />
        </Box>
      ) : null}
    </div>
  );
};

export default Home;

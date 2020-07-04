import React, {useState} from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';
import Tooltip from '../TooltipCustom';

const useStyles = makeStyles((theme) => ({
  nav: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 48,
    bottom: 22,
    backgroundColor: theme.palette.background.paper,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    zIndex: theme.zIndex.appBar,
    maxWidth: 36,
  },
  iconButton: {
    padding: theme.spacing(1),
  },
  icons: {
    opacity: theme.textOpacity.mediumEmphasis,
  },
  activeIcon: {
    opacity: theme.textOpacity.highEmphasis,
  },
}));

const NAV_ELEMENTS = {
  EXPLORER: 1,
};

// this navigation element will be default active on mount, this should change
// when we store UI state for page refresh and render page back using it where
// this will come from the state instead. This will be used, for instance,
// during updates to the app where a refresh is needed.
const DEFAULT_ACTIVE_NAV = NAV_ELEMENTS.EXPLORER;

const LeftNavigation = () => {
  const [activeNav, setActiveNav] = useState(DEFAULT_ACTIVE_NAV);
  const classes = useStyles();

  const navClick = (navElement) => {
    if (activeNav === navElement) {
      setActiveNav(null);
      return;
    }
    setActiveNav(navElement);
  };

  /* const closePanel = () => {
    setActiveNav(null);
  }; */

  return (
    <Paper
      square
      component="nav"
      elevation={4}
      direction="vertical"
      aria-label="Left Navigation"
      className={classes.nav}>
      <Box display="flex">
        <Tooltip title="Files" placement="right">
          <IconButton
            aria-label="Files"
            onClick={navClick}
            className={classes.iconButton}>
            <FileIcon
              fontSize="small"
              className={clsx(classes.icons, true && classes.activeIcon)}
            />
          </IconButton>
        </Tooltip>
      </Box>
      <Box flex={1} />
      <Box display="flex" justifyContent="center">
        <Link href="/dashboard">
          <SvgIcon fontSize="small">
            {/* TODO: replace with our 24x24 logo */}
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </SvgIcon>
        </Link>
      </Box>
    </Paper>
  );
};

export default LeftNavigation;

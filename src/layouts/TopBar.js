import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import ToolBar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import MenuIcon from '@material-ui/icons/Menu';
import {makeStyles} from '@material-ui/styles';
import PropTypes from 'prop-types';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import Link from '@material-ui/core/Link';
import clsx from 'clsx';
import Tooltip from '../TooltipCustom';
import {getLocation, getZyliticsLogo} from '../common';
import {PageUrl} from '../Constants';
import UserAvatar from '../UserAvatar';
import HelpMenu from '../HelpMenu';
import ProjectSelector from '../components/ProjectSelector';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBarRoot: {
    backgroundColor: theme.palette.background.navigations,
  },
  icons: {
    color: theme.palette.background.contrastText,
    opacity: theme.textOpacity.highEmphasis,
  },
  content: {
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    padding: `${theme.spacing(1)} 0`,
  },
  elementMargin: {
    marginRight: theme.spacing(2),
  },
}));

const TopBar = ({onMenuClick}) => {
  const location = useLocation();
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static" classes={{root: classes.appBarRoot}}>
        <ToolBar variant="dense">
          <Tooltip title="Keep sidebar open">
            <IconButton
              edge="start"
              className={clsx(classes.elementMargin, classes.icons)}
              color="inherit"
              aria-label="menu"
              onClick={onMenuClick}>
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <Link
            component={RouterLink}
            to={getLocation(PageUrl.HOME, location.search)}
            aria-label="Home"
            title="Home"
            className={classes.elementMargin}>
            {getZyliticsLogo()}
          </Link>
          <ProjectSelector />
          <Box flexGrow={1} />
          <div className={classes.icons}>
            <HelpMenu />
          </div>
          <UserAvatar />
        </ToolBar>
      </AppBar>
    </div>
  );
};

TopBar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default TopBar;

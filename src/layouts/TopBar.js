import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import ToolBar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Box from '@material-ui/core/Box';
import MenuIcon from '@material-ui/icons/Menu';
import {makeStyles} from '@material-ui/core/styles';
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
  appBarRoot: {
    backgroundColor: theme.palette.background.navigations,
    zIndex: theme.zIndex.drawer + 1,
  },
  icons: {
    color: theme.palette.background.contrastText,
    opacity: theme.textOpacity.highEmphasis,
  },
  elementMargin: {
    marginRight: theme.spacing(2),
  },
}));

const TopBar = ({onMenuClick, menuTooltip}) => {
  const location = useLocation();
  const classes = useStyles();

  return (
    <AppBar position="fixed" classes={{root: classes.appBarRoot}}>
      <ToolBar variant="dense">
        <Tooltip title={menuTooltip}>
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
  );
};

TopBar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  menuTooltip: PropTypes.string.isRequired,
};

export default TopBar;

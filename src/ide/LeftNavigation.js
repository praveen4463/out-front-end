import React from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import Link from '@material-ui/core/Link';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';
import PropTypes from 'prop-types';
import Tooltip from '../TooltipCustom';
import {LeftNavs} from './Constants';
import {getLocation} from '../common';
import {PageUrl} from '../Constants';

const useStyles = makeStyles((theme) => ({
  nav: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 48,
    bottom: 22,
    backgroundColor: theme.palette.background.navigations,
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

const LeftNavigation = (props) => {
  const {clickHandler, active} = props;
  const location = useLocation();
  const classes = useStyles();

  const onFileClick = () => {
    clickHandler(LeftNavs.EXPLORER);
  };

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
            onClick={onFileClick}
            className={classes.iconButton}>
            <FileIcon
              fontSize="small"
              className={clsx(
                classes.icons,
                active === LeftNavs.EXPLORER && classes.activeIcon
              )}
            />
          </IconButton>
        </Tooltip>
      </Box>
      <Box flex={1} />
      <Box display="flex" justifyContent="center">
        <Link
          component={RouterLink}
          to={getLocation(PageUrl.HOME, location.search)}
          aria-label="Home"
          title="Home">
          <SvgIcon fontSize="small">
            {/* TODO: replace with our 24x24 logo */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none">
              <circle cx="4" cy="4" r="3.5" stroke="white" />
              <circle cx="20" cy="4" r="3.5" stroke="white" />
              <circle cx="12" cy="4" r="3.5" stroke="white" />
              <circle cx="4" cy="20" r="3.5" stroke="white" />
              <circle cx="20" cy="20" r="3.5" stroke="white" />
              <circle cx="12" cy="20" r="3.5" stroke="white" />
              <path
                d="M7 17.1744L12.529 15.5119L8.32469 11.5549L7 17.1744ZM16.8317 6.72819L11.3028 8.39071L15.507 12.3477L16.8317 6.72819ZM10.4482 14.2402L14.1117 10.3478L13.3835 9.66241L9.72004 13.5548L10.4482 14.2402Z"
                fill="white"
              />
            </svg>
          </SvgIcon>
        </Link>
      </Box>
    </Paper>
  );
};

LeftNavigation.propTypes = {
  clickHandler: PropTypes.func.isRequired,
  active: PropTypes.string.isRequired,
};

export default LeftNavigation;

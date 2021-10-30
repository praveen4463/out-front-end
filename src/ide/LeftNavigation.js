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
            <svg
              x="0px"
              y="0px"
              width="24"
              height="24"
              viewBox="0 0 30.566 20.641"
              enableBackground="new 0 0 30.566 20.641"
              xmlSpace="preserve">
              <path
                fill="#FFFFFF"
                d="M21.797,0.069H8.765c-4.75,0-8.616,3.867-8.616,8.618v3.267c0,4.752,3.866,8.619,8.616,8.619h13.032
	c4.752,0,8.619-3.867,8.619-8.619V8.687C30.417,3.936,26.55,0.069,21.797,0.069z M4.431,8.687c0-2.39,1.945-4.335,4.334-4.335
	h13.032c2.391,0,4.335,1.945,4.335,4.335v3.267c0,2.393-1.945,4.336-4.335,4.336H8.765c-2.389,0-4.334-1.943-4.334-4.336V8.687z
	 M9.292,7.935c-1.184,0-2.147,0.963-2.147,2.148c0,1.183,0.963,2.146,2.147,2.146c1.183,0,2.146-0.963,2.146-2.146
	C11.437,8.898,10.475,7.935,9.292,7.935z M21.273,7.935c-1.183,0-2.147,0.963-2.147,2.148c0,1.183,0.963,2.146,2.147,2.146
	c1.183,0,2.146-0.963,2.146-2.146C23.419,8.898,22.456,7.935,21.273,7.935z"
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

import React from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import IconButton from '@material-ui/core/IconButton';
import SvgIcon from '@material-ui/core/SvgIcon';
import PropTypes from 'prop-types';
import Tooltip from '../TooltipCustom';
import {LeftNavs} from './Constants';

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
  const classes = useStyles();

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
            onClick={() => clickHandler(LeftNavs.EXPLORER)}
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

LeftNavigation.propTypes = {
  clickHandler: PropTypes.func.isRequired,
  active: PropTypes.number.isRequired,
};

export default LeftNavigation;

import React, {useState} from 'react';
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
    // color: theme.palette.common.white,
    backgroundColor: theme.palette.background.paper,
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    // borderRight: `1px solid ${theme.palette.background.paperBorder}`,
    zIndex: theme.zIndex.appBar,
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

const LeftNavigation = () => {
  const [fileOn, setFileOn] = useState(true);
  const classes = useStyles();

  const toggleFiles = () => {
    setFileOn((f) => !f);
  };

  return (
    <Paper
      square
      component="nav"
      elevation={4}
      direction="vertical"
      aria-label="Left Navigation"
      classes={{root: classes.nav}}>
      <Box display="flex">
        <Tooltip title="Files" placement="right">
          <IconButton
            aria-label="Files"
            onClick={toggleFiles}
            classes={{root: classes.iconButton}}>
            <FileIcon
              fontSize="small"
              classes={{root: classes.icons}}
              className={fileOn ? classes.activeIcon : ''}
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

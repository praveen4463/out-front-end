import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import {makeStyles} from '@material-ui/core/styles';
import Tooltip from '../TooltipCustom';

const useStyles = makeStyles((theme) => ({
  menuIcon: {
    opacity: theme.textOpacity.highEmphasis,
    height: '100%',
  },
}));

const MainMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Tooltip title="Menu M">
        <IconButton
          classes={{root: classes.menuIcon}}
          aria-controls="mainMenu"
          aria-haspopup="true"
          aria-label="main menu"
          onClick={handleClick}>
          {/* Set some opacity on the menu icon */}
          <MenuIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        id="mainMenu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        <MenuItem onClick={handleClose}>New Test</MenuItem>
        <MenuItem onClick={handleClose}>Open Test</MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClose}>Switch Another Version</MenuItem>
        <MenuItem onClick={handleClose}>Compare Versions</MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClose}>Switch Project</MenuItem>
        <MenuItem onClick={handleClose}>Preferences</MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClose}>Exit IDE</MenuItem>
      </Menu>
    </>
  );
};

export default MainMenu;

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import HelpOutlineOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import Tooltip from '../TooltipCustom';

const useStyles = makeStyles((theme) => ({
  helpIcon: {
    opacity: theme.textOpacity.highEmphasis,
  },
}));

const HelpMenu = () => {
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
      <Tooltip title="Help & Resources H">
        <IconButton
          classes={{root: classes.helpIcon}}
          aria-controls="helpMenu"
          aria-haspopup="true"
          aria-label="help menu"
          onClick={handleClick}>
          <HelpOutlineOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="helpMenu"
        anchorEl={anchorEl}
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
        <MenuItem onClick={handleClose}>Submit Bug(s)</MenuItem>
        <MenuItem onClick={handleClose}>Feature Request</MenuItem>
        <MenuItem onClick={handleClose}>Keyboard Shortcuts</MenuItem>
      </Menu>
    </>
  );
};

export default HelpMenu;

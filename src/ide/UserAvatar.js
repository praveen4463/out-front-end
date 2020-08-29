import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import Tooltip from '../TooltipCustom';

const useStyles = makeStyles((theme) => ({
  avatar: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    width: theme.spacing(3),
    height: theme.spacing(3),
    fontSize: '1rem',
  },
}));

const UserAvatar = () => {
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
      {/* Remember to get it from prop dynamically */}
      <Tooltip title="Praveen Tiwari (You)">
        <IconButton
          aria-controls="userAvatar"
          aria-haspopup="true"
          aria-label="user avatar"
          edge="end"
          onClick={handleClick}>
          {/* Remember to get it from prop dynamically */}
          <Avatar className={classes.avatar}>P</Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="userAvatar"
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
        <MenuItem onClick={handleClose}>View Account Profile</MenuItem>
      </Menu>
    </>
  );
};

export default UserAvatar;

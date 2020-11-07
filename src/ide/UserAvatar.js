import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Avatar from '@material-ui/core/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import Cookies from 'js-cookie';
import Tooltip from '../TooltipCustom';
import Application from '../config/application';

const useStyles = makeStyles((theme) => ({
  avatar: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    width: theme.spacing(3),
    height: theme.spacing(3),
    fontSize: '1rem',
  },
  link: {
    color: theme.palette.background.contrastText,
  },
}));

const UserAvatar = React.memo(() => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getUserName = () => {
    const name = Cookies.get(Application.USER_NAME_COOKIE);
    return name ?? 'Not Logged In';
  };

  const getFirstLetter = () => {
    const name = Cookies.get(Application.USER_NAME_COOKIE);
    if (name) {
      return name.substring(0, 1).toUpperCase();
    }
    return 'U'; // user
  };

  return (
    <>
      <Tooltip title={`${getUserName()} (You)`}>
        <IconButton
          aria-controls="userAvatar"
          aria-haspopup="true"
          aria-label="user avatar"
          edge="end"
          onClick={handleClick}>
          <Avatar className={classes.avatar}>{getFirstLetter()}</Avatar>
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
        <MenuItem>
          <Link
            href="/profile"
            aria-label="View Account Profile"
            className={classes.link}>
            View Account Profile
          </Link>
        </MenuItem>
      </Menu>
    </>
  );
});

export default UserAvatar;

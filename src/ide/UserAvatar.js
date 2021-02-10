import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import Tooltip from '../TooltipCustom';
import {getLocation} from '../common';
import {useAuth} from '../Auth';
import {PageUrl} from '../Constants';

const useStyles = makeStyles((theme) => ({
  avatar: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    width: theme.spacing(3),
    height: theme.spacing(3),
    fontSize: '1rem',
  },
  linkMenu: {
    padding: 0,
  },
  link: {
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: 400,
    width: '100%',
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(12),
    justifyContent: 'flex-start',
  },
}));

const UserAvatar = React.memo(() => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const auth = useAuth();
  const location = useLocation();
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getUserName = () => {
    const name = auth.user.displayName;
    return name ?? 'Not Logged In';
  };

  const getFirstLetter = () => {
    const name = auth.user.displayName;
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
        <MenuItem className={classes.linkMenu}>
          <Button
            component={RouterLink}
            to={getLocation(PageUrl.PROFILE, location.search)}
            rel="noopener"
            target="_blank"
            aria-label="Profile"
            className={classes.link}>
            Profile
          </Button>
        </MenuItem>
      </Menu>
    </>
  );
});

export default UserAvatar;

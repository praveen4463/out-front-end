import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import {Link as RouterLink, useLocation, useHistory} from 'react-router-dom';
import Tooltip from './TooltipCustom';
import {getLocation} from './common';
import {useAuthContext} from './Auth';
import {PageUrl} from './Constants';

const useStyles = makeStyles((theme) => ({
  avatar: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.main,
    width: theme.spacing(4),
    height: theme.spacing(4),
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  avatarButton: {
    padding: `${theme.spacing(1)}px ${theme.spacing(1.5)}px`,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
}));

const UserAvatar = React.memo(() => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const auth = useAuthContext();
  const location = useLocation();
  const history = useHistory();
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getIdentifier = () => {
    const [firstName, lastName] = auth.user.displayName.split(' ');
    return `${firstName.substring(0, 1).toUpperCase()}${lastName
      .substring(0, 1)
      .toUpperCase()}`;
  };

  const signOut = () => {
    auth.signOut(() =>
      history.push(getLocation(PageUrl.LOGIN, location.search, {location}))
    );
  };

  return (
    <>
      <Tooltip title={`${auth.user.displayName} (You)`}>
        <IconButton
          aria-controls="userAvatar"
          aria-haspopup="true"
          aria-label="user avatar"
          edge="end"
          onClick={handleClick}
          className={classes.avatarButton}>
          <Avatar className={classes.avatar}>{getIdentifier()}</Avatar>
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
        <MenuItem
          component={RouterLink}
          to={getLocation(PageUrl.PROFILE, location.search)}
          aria-label="Edit profile">
          <Box display="flex" flexDirection="column">
            <span>{auth.user.displayName}</span>
            <span>{auth.user.email}</span>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          component={RouterLink}
          to={getLocation(PageUrl.SETTINGS, location.search)}
          aria-label="Settings">
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={signOut}>Sign out</MenuItem>
      </Menu>
    </>
  );
});

export default UserAvatar;

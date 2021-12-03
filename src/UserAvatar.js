import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import {Link as RouterLink, useLocation, useHistory} from 'react-router-dom';
import {useQuery} from 'react-query';
import Tooltip from './TooltipCustom';
import {getLocation, getUserDisplayName} from './common';
import {useAuthContext} from './Auth';
import {PageUrl, QueryKeys} from './Constants';
import {userInStorageFetch} from './api/fetches';

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
  const {data} = useQuery(QueryKeys.USER_IN_STORAGE, userInStorageFetch);
  const displayName = data
    ? getUserDisplayName(data.firstName, data.lastName)
    : null;
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getIdentifier = () => {
    const {firstName, lastName} = data;
    return `${firstName.substring(0, 1).toUpperCase()}${lastName
      .substring(0, 1)
      .toUpperCase()}`;
  };

  const signOut = () => {
    // TODO: later set a message to let user know they are logged out, using some query
    // so that auth listeners on pages know it's a logout and don't overwrite the
    // message with something like 'you need to be logged in to continue'
    // Don't wait for sign out and redirect user to login immediately
    // so that the hooks on pages don't run before this. We want to send to
    // login without anything in state for now so that user is always sent to
    // home upon re-login and don't keep any query string like project.
    auth.signOut();
    history.push(PageUrl.LOGIN);
  };

  if (!data) {
    return null;
  }

  return (
    <>
      <Tooltip title={displayName}>
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
          onClick={handleClose}
          to={getLocation(
            `${PageUrl.SETTINGS}${PageUrl.PROFILE}`,
            location.search
          )}
          aria-label="Edit profile">
          <Box display="flex" flexDirection="column">
            <span>{displayName}</span>
            <span>{data.email}</span>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          component={RouterLink}
          onClick={handleClose}
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

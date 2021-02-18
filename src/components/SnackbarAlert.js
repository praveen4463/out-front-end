import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import PropTypes from 'prop-types';
import {makeStyles, useTheme} from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import ErrorIcon from '@material-ui/icons/Error';
import SuccessIcon from '@material-ui/icons/Check';
import WarningIcon from '@material-ui/icons/Warning';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import {SnackbarHorPos, SnackbarType, SnackbarVerPos} from '../Constants';

const useStyle = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
    borderTop: (props) => `2px solid ${props.borderColor}`,
    borderBottom: `1px solid ${theme.palette.border.light}`,
  },
  icon: {
    paddingRight: '8px',
    color: (props) => props.iconColor,
  },
}));

const SnackbarAlert = ({message, open, onClose, type, verPos, horPos}) => {
  const theme = useTheme();

  const getBorderColor = () => {
    switch (type) {
      case SnackbarType.ERROR:
        return theme.palette.error.dark;
      case SnackbarType.WARNING:
        return theme.palette.warning.dark;
      case SnackbarType.SUCCESS:
        return theme.palette.success.dark;
      case SnackbarType.INFO:
        return theme.palette.info.dark;
      default:
        return theme.palette.primary.dark;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case SnackbarType.ERROR:
        return theme.palette.error.main;
      case SnackbarType.WARNING:
        return theme.palette.warning.main;
      case SnackbarType.SUCCESS:
        return theme.palette.success.main;
      case SnackbarType.INFO:
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const classes = useStyle({
    iconColor: getIconColor(),
    borderColor: getBorderColor(),
  });

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  const getAutoHideDuration = () => {
    switch (type) {
      case SnackbarType.ERROR:
        return 30000;
      case SnackbarType.WARNING:
        return 15000;
      case SnackbarType.INFO:
        return 10000;
      default:
        return 5000;
    }
  };

  const getIcon = () => {
    switch (type) {
      case SnackbarType.ERROR:
        return <ErrorIcon fontSize="small" className={classes.icon} />;
      case SnackbarType.WARNING:
        return <WarningIcon fontSize="small" className={classes.icon} />;
      case SnackbarType.SUCCESS:
        return <SuccessIcon fontSize="small" className={classes.icon} />;
      default:
        return <InfoIcon fontSize="small" className={classes.icon} />;
    }
  };

  return (
    <div>
      <Snackbar
        anchorOrigin={{
          vertical: verPos,
          horizontal: horPos,
        }}
        open={open}
        autoHideDuration={getAutoHideDuration()}
        onClose={handleClose}>
        <SnackbarContent
          message={
            <>
              <Box display="flex">
                {getIcon()}
                <Typography variant="body2">{message}</Typography>
              </Box>
            </>
          }
          classes={{root: classes.root}}
          action={
            <>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          }
        />
      </Snackbar>
    </div>
  );
};

SnackbarAlert.propTypes = {
  message: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(Object.values(SnackbarType)),
  verPos: PropTypes.oneOf(Object.values(SnackbarVerPos)).isRequired,
  horPos: PropTypes.oneOf(Object.values(SnackbarHorPos)).isRequired,
};

SnackbarAlert.defaultProps = {
  message: null,
  type: null,
};

export default SnackbarAlert;

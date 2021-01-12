import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const useStyle = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
    border: `1px solid ${theme.palette.border.light}`,
  },
}));

const SnackbarTypeInfo = ({message, open, onClose}) => {
  const classes = useStyle();

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  return (
    <div>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={open}
        autoHideDuration={15000}
        onClose={handleClose}>
        <SnackbarContent
          message={
            <>
              <Box display="flex">
                <InfoIcon
                  fontSize="small"
                  color="error"
                  style={{paddingRight: '8px'}}
                />
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

SnackbarTypeInfo.propTypes = {
  message: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

SnackbarTypeInfo.defaultProps = {
  message: null,
};

export default SnackbarTypeInfo;

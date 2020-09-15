import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import ErrorIcon from '@material-ui/icons/Error';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const useStyle = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
    border: `1px solid ${theme.palette.border.light}`,
  },
}));

const SnackbarTypeError = ({error, errorOn, setErrorClose}) => {
  const classes = useStyle();

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorClose();
  };

  return (
    <div>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={errorOn}
        autoHideDuration={10000}
        onClose={handleClose}>
        <SnackbarContent
          message={
            <>
              <Box display="flex">
                <ErrorIcon
                  fontSize="small"
                  color="error"
                  style={{paddingRight: '8px'}}
                />
                <Typography variant="body2">{error}</Typography>
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

SnackbarTypeError.propTypes = {
  error: PropTypes.string,
  errorOn: PropTypes.bool.isRequired,
  setErrorClose: PropTypes.func.isRequired,
};

SnackbarTypeError.defaultProps = {
  error: null,
};

export default SnackbarTypeError;
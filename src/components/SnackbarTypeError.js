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
    borderTop: `4px solid ${theme.palette.error.dark}`,
    borderBottom: `1px solid ${theme.palette.border.light}`,
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
        autoHideDuration={30000}
        onClose={handleClose}>
        <SnackbarContent
          message={
            <>
              <Box display="flex" alignItems="center">
                <ErrorIcon
                  fontSize="large"
                  color="error"
                  style={{paddingRight: '8px'}}
                />
                <Typography variant="body1">{error}</Typography>
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

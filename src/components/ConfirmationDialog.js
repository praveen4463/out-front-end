import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';

const useStyle = makeStyles((theme) => ({
  text: {
    fontSize: '0.9125rem',
    color: theme.palette.background.contrastText,
  },
  paper: {
    marginBottom: '20%',
  },
  confirmButton: {
    backgroundColor: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  },
}));

const ConfirmationDialog = ({
  showDlg,
  setShowDlg,
  cancelHandler,
  onAccept,
  acceptText,
  dlgContent,
  ariaDesc,
}) => {
  const classes = useStyle();

  const acceptHandler = (e) => {
    e.stopPropagation();
    setShowDlg(false);
    onAccept();
  };

  return (
    <Dialog
      open={showDlg}
      onClose={cancelHandler}
      classes={{paper: classes.paper}}
      aria-describedby={ariaDesc}>
      <DialogContent>
        <DialogContentText id={ariaDesc} className={classes.text}>
          {dlgContent}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelHandler} size="small" aria-label="cancel">
          Cancel
        </Button>
        <Button
          onClick={acceptHandler}
          variant="contained"
          size="small"
          aria-label={acceptText}
          className={classes.confirmButton}>
          {acceptText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmationDialog.propTypes = {
  showDlg: PropTypes.bool.isRequired,
  setShowDlg: PropTypes.func.isRequired,
  cancelHandler: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  acceptText: PropTypes.string.isRequired,
  dlgContent: PropTypes.string.isRequired,
  ariaDesc: PropTypes.string.isRequired,
};

export default ConfirmationDialog;

import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  menuIcon: {
    opacity: theme.textOpacity.highEmphasis,
    height: '100%',
  },
  root: {
    backgroundColor: theme.palette.background.paperOnDefault,
    height: '90%',
    color: theme.palette.background.contrastText,
  },
  dlgTitle: {
    margin: 0,
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.border.light}`,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  link: {
    color: theme.palette.background.contrastText,
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Slide direction="down" ref={ref} {...props} />;
});

const TitleDialog = ({
  showDialog,
  setShowDialog,
  title,
  maxWidth,
  children,
}) => {
  const classes = useStyles();

  const closeDlg = () => {
    setShowDialog(false);
  };
  return (
    <Dialog
      TransitionComponent={Transition}
      onClose={closeDlg}
      fullWidth
      maxWidth={maxWidth}
      open={showDialog}
      classes={{paper: classes.root}}>
      <DialogTitle
        onClose={closeDlg}
        disableTypography
        className={classes.dlgTitle}>
        <Typography variant="h6">{title}</Typography>
        <IconButton
          aria-label="close"
          className={classes.closeButton}
          onClick={closeDlg}>
          <CloseIcon titleAccess="Close" />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};

TitleDialog.propTypes = {
  showDialog: PropTypes.bool.isRequired,
  setShowDialog: PropTypes.func.isRequired,
  maxWidth: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

TitleDialog.defaultProps = {
  maxWidth: 'lg',
};

export default TitleDialog;

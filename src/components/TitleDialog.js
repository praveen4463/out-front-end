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
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paperOnDefault,
    height: '90%',
    color: theme.palette.background.contrastText,
  },
  dlgTitle: {
    margin: 0,
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.border.light}`,
    backgroundColor: theme.palette.background.navigations,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  dlgContentNoPadding: {
    padding: 0,
  },
}));

const Transition = React.forwardRef((props, ref) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <Slide direction="down" ref={ref} {...props} />
));

const TitleDialog = ({
  showDialog,
  closeDialog,
  title,
  titleContent,
  dlgContentNoPadding,
  maxWidth,
  children,
}) => {
  const classes = useStyles();
  return (
    <Dialog
      TransitionComponent={Transition}
      onClose={closeDialog}
      fullWidth
      maxWidth={maxWidth}
      open={showDialog}
      classes={{paper: classes.root}}>
      <DialogTitle
        onClose={closeDialog}
        disableTypography
        className={classes.dlgTitle}>
        {title ? (
          <>
            <Typography variant="h6">{title}</Typography>
            <IconButton
              aria-label="close"
              className={classes.closeButton}
              onClick={closeDialog}>
              <CloseIcon titleAccess="Close" />
            </IconButton>
          </>
        ) : (
          titleContent || null
        )}
      </DialogTitle>
      <DialogContent
        className={clsx(dlgContentNoPadding && classes.dlgContentNoPadding)}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

TitleDialog.propTypes = {
  showDialog: PropTypes.bool.isRequired,
  closeDialog: PropTypes.func.isRequired,
  title: PropTypes.string,
  titleContent: PropTypes.node,
  dlgContentNoPadding: PropTypes.bool,
  maxWidth: PropTypes.string,
  children: PropTypes.node,
};

TitleDialog.defaultProps = {
  title: null,
  titleContent: null,
  dlgContentNoPadding: false,
  maxWidth: 'lg',
  children: null,
};

export default TitleDialog;

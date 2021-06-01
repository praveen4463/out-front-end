import React, {useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import clsx from 'clsx';

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
  button: {
    padding: theme.spacing(1),
  },
  textField: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: '1rem',
  },
  action: {
    paddingRight: theme.spacing(3),
    paddingLeft: theme.spacing(3),
    paddingBottom: theme.spacing(4),
  },
  title: {
    paddingTop: theme.spacing(4),
  },
}));

const ProjectDeleteConfirmation = ({show, setShow, onAccept, projectName}) => {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);
  const classes = useStyle();

  const hide = (e) => {
    e.stopPropagation();
    setShow(false);
  };

  const acceptHandler = (e) => {
    const givenName = name.trim();
    if (projectName !== givenName) {
      setNameError("Doesn't match, write the exact name of project to delete");
      return;
    }
    hide(e);
    onAccept();
  };

  const cancelHandler = (e) => {
    hide(e);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  };

  return (
    <Dialog
      open={show}
      onClose={cancelHandler}
      classes={{paper: classes.paper}}
      aria-labelledby="project-delete-confirmation">
      <DialogTitle id="project-delete-confirmation" className={classes.title}>
        {`Delete project '${projectName}'`}
      </DialogTitle>
      <DialogContent>
        <DialogContentText className={classes.text}>
          Deleting a project permanently deletes the project and all of its
          contents including files and builds. You can not undo this action.
        </DialogContentText>
        <TextField
          value={name}
          name="name"
          id="name"
          variant="outlined"
          fullWidth
          InputProps={{
            classes: {input: classes.textField},
            inputProps: {tabIndex: '0'},
          }}
          onChange={handleNameChange}
          error={Boolean(nameError)}
          helperText={nameError}
          placeholder="Confirm project name to delete"
          margin="none"
          autoFocus
        />
      </DialogContent>
      <DialogActions className={classes.action}>
        <Button
          className={classes.button}
          onClick={cancelHandler}
          size="small"
          aria-label="cancel">
          Cancel
        </Button>
        <Button
          onClick={acceptHandler}
          variant="contained"
          size="small"
          aria-label="Delete project and all contents"
          className={clsx(classes.confirmButton, classes.button)}>
          Delete project and all contents
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ProjectDeleteConfirmation.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  projectName: PropTypes.string.isRequired,
};

export default ProjectDeleteConfirmation;

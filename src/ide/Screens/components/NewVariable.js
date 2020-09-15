import React, {useState, useRef, useCallback} from 'react';

import {makeStyles} from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import {VarTypes, MaxLengths, ErrorType} from '../../Constants';

const KEY = 'key';
const VALUE = 'value';
const PRIMARY = 'primary';

const useStyle = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
  },
}));

let initialVar;
const initialError = {
  [KEY]: null,
  [VALUE]: null,
};

const NewVariable = ({addHandler, varType}) => {
  const [variable, setVariable] = useState(() => {
    initialVar = {
      [KEY]: '',
      [VALUE]: '',
    };
    if (varType === VarTypes.BUILD) {
      initialVar.primary = false;
    }
    return initialVar;
  });
  const [error, setError] = useState(initialError);
  const [open, setOpen] = React.useState(false);

  const [switchState, setSwitchState] = React.useState({
    addMultiple: false,
  });
  const firstInput = useRef(null);
  const classes = useStyle();

  // create function once during re renders so that it will be called only on
  // first render.
  const focusOnMount = useCallback((input) => {
    if (input !== null) {
      input.focus();
      if (firstInput.current === null) {
        firstInput.current = input;
      }
    }
  }, []);

  const handleSwitchChange = (name) => (event) => {
    setSwitchState({...switchState, [name]: event.target.checked});
  };

  const resetSwitch = () => {
    setSwitchState({addMultiple: false});
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetSwitch();
  };

  const validate = (key, value) => {
    const errors = {};
    if (key !== undefined) {
      const len = key.trim().length;
      if (len === 0) {
        errors[KEY] = 'Key is required';
      } else if (len > MaxLengths.VAR_KEY) {
        errors[KEY] = `Key can't be more than ${MaxLengths.VAR_KEY} characters`;
      }
    }
    if (value !== undefined) {
      const len = value.trim().length;
      if (len === 0) {
        errors[VALUE] = 'Value is required';
      }
    }
    return errors;
  };

  const handleAdd = () => {
    const errors = validate(variable[KEY], variable[VALUE]);
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    // we're just stopping users on synchronous errors and not on api errors,
    // when some api error occurs, form will clear and continue to focus for
    // typing new values, a snackbar will appear telling the error.
    // To repo async error, I will have to wait for api response after every
    // save before user could enter new variable, this is not something I want,
    // since api errors are rare, for most users, consecutive addition will result
    // in consecutive api requests and once they resolve, records will be added to
    // table. This will look faster and we can do this since the result grid is
    // behind the new variable dlg.
    const syncResponse = addHandler(variable);
    if (syncResponse && syncResponse.error) {
      if (syncResponse.errorType === ErrorType.BUILD_VAR_DUPE_ERROR) {
        errors[KEY] = '';
        errors[VALUE] =
          'This is a duplicate key-value pair, no two values can be same in a key group.';
      } else if (syncResponse.errorType === ErrorType.GLOBAL_VAR_DUPE_ERROR) {
        errors[KEY] = 'This key already exists.';
        errors[VALUE] = '';
      }
      if (Object.keys(errors).length > 0) {
        setError({...error, ...errors});
        return;
      }
    }
    // doesn't look like there is any need for this as we're resetting on change.
    /* if (Object.keys(error).some((k) => error[k])) {
      setError(initialError);
    } */
    setVariable(initialVar);
    setOpen(switchState.addMultiple);
    if (switchState.addMultiple) {
      firstInput.current.focus();
    }
  };

  const handleChange = (column) => ({target}) => {
    setVariable({
      ...variable,
      [column]: column === PRIMARY ? target.checked : target.value,
    });
    if (column === PRIMARY) {
      return;
    }
    const {value} = target;
    const errors = validate(
      column === KEY ? value : undefined,
      column === VALUE ? value : undefined
    );
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    // even if some error is currently shown due to some other cause than the checks
    // in validate(), we will clear that error upon value change in this element.
    if (error[column]) {
      setError({...error, [column]: null});
    }
  };

  return (
    <div>
      <Tooltip title="Add">
        <IconButton aria-label="add" onClick={handleClickOpen}>
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
        classes={{paper: classes.root}}>
        <DialogTitle id="form-dialog-title">
          Add {varType === VarTypes.BUILD ? 'Build' : 'Global'} Variable(s)
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Key"
            fullWidth
            value={variable[KEY]}
            onChange={handleChange(KEY)}
            error={Boolean(error[KEY])}
            helperText={error[KEY] ?? ''}
            margin="normal"
            inputRef={focusOnMount}
            inputProps={{tabIndex: '0'}}
          />
          <TextField
            multiline
            rows={4}
            rowsMax={8}
            label="Value"
            fullWidth
            value={variable[VALUE]}
            onChange={handleChange(VALUE)}
            error={Boolean(error[VALUE])}
            helperText={error[VALUE] ?? ''}
            variant="outlined"
            margin="normal"
            inputProps={{tabIndex: '0'}}
          />
          {varType === VarTypes.BUILD ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={variable[PRIMARY]}
                  onChange={handleChange(PRIMARY)}
                  inputProps={{tabIndex: '0'}}
                />
              }
              label="Is Primary"
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Tooltip title="Add multiple">
            <Switch
              checked={switchState.addMultiple}
              onChange={handleSwitchChange('addMultiple')}
              value="addMultiple"
              inputProps={{'aria-label': 'secondary checkbox', tabIndex: '0'}}
            />
          </Tooltip>
          <Button onClick={handleClose} variant="contained" tabIndex="0">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            color="secondary"
            tabIndex="0">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

NewVariable.propTypes = {
  addHandler: PropTypes.func.isRequired,
  varType: PropTypes.oneOf(Object.values(VarTypes)).isRequired,
};

export default NewVariable;

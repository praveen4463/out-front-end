import React from 'react';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {makeStyles} from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: '50%',
  },
  filledNoPad: {
    backgroundColor: theme.palette.background.paperContrast,
    '&:focus': {
      backgroundColor: theme.palette.background.paperContrast,
    },
    boxShadow: theme.shadows[1],
  },
  filled: {
    backgroundColor: theme.palette.background.paperContrast,
    padding: '15px 12px 14px',
    '&:focus': {
      backgroundColor: theme.palette.background.paperContrast,
    },
    boxShadow: theme.shadows[1],
  },
  input: {
    backgroundColor: theme.palette.background.paperContrast,
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  iconFilled: {
    right: '14px',
  },
  list: {
    minHeight: theme.spacing(8),
  },
  selectError: {
    marginLeft: 0,
  },
  error: {
    border: `1px solid ${theme.palette.error.main}`,
  },
}));

const StyledSelect = ({
  id,
  selected,
  label,
  onChange,
  disabled,
  error,
  children,
}) => {
  const classes = useStyles();

  return (
    <FormControl
      variant="filled"
      className={classes.formControl}
      error={Boolean(error)}>
      {label ? (
        <InputLabel id={`label-${id}`} classes={{root: classes.input}}>
          {label}
        </InputLabel>
      ) : null}
      <Select
        labelId={label ? `label-${id}` : ''}
        id={id}
        name={id}
        value={selected ?? ''}
        onChange={onChange}
        classes={{
          root: classes.input,
          filled: label ? classes.filledNoPad : classes.filled,
          iconFilled: classes.iconFilled,
        }}
        className={clsx(Boolean(error) && classes.error)}
        MenuProps={{classes: {list: classes.list}}}
        IconComponent={ExpandMoreIcon}
        disabled={disabled}
        disableUnderline>
        {children}
      </Select>
      <FormHelperText className={classes.selectError}>{error}</FormHelperText>
    </FormControl>
  );
};

StyledSelect.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.string.isRequired,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node,
};

StyledSelect.defaultProps = {
  label: null,
  error: null,
  disabled: false,
  children: null,
};

export default StyledSelect;

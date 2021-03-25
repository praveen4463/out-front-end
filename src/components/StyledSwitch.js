import React from 'react';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import PropTypes from 'prop-types';
import TooltipCustom from '../TooltipCustom';

const useStyles = makeStyles((theme) => ({
  switchFormControlTop: {
    marginLeft: 0,
    alignItems: 'flex-start',
  },
  switchLabelTop: {
    marginLeft: `-${theme.spacing(1.1)}px`,
  },
  switch: {
    marginLeft: 0,
  },
  switchLabel: {
    color: theme.palette.text.secondary,
  },
  infoLabel: {
    marginLeft: '4px',
    fontSize: '1rem',
    color: theme.palette.background.contrastText,
    cursor: 'pointer',
  },
}));

const StyledSwitch = ({
  name,
  isChecked,
  label,
  helpText,
  handleChange,
  labelPlacement,
}) => {
  const classes = useStyles();

  return (
    <FormControlLabel
      classes={{labelPlacementTop: classes.switchFormControlTop}}
      control={
        <Switch
          checked={isChecked}
          onChange={handleChange}
          name={name}
          classes={{
            root:
              labelPlacement === 'top'
                ? classes.switchLabelTop
                : classes.switch,
          }}
        />
      }
      labelPlacement={labelPlacement}
      label={
        <Box display="flex" alignItems="center">
          <Typography
            variant="body2"
            component="span"
            className={classes.switchLabel}>
            {label}
          </Typography>
          <TooltipCustom title={helpText} placement="right">
            <InfoIcon fontSize="small" className={classes.infoLabel} />
          </TooltipCustom>
        </Box>
      }
    />
  );
};

StyledSwitch.propTypes = {
  name: PropTypes.string.isRequired,
  isChecked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  helpText: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  labelPlacement: PropTypes.string,
};

StyledSwitch.defaultProps = {
  labelPlacement: 'top',
};

export default StyledSwitch;

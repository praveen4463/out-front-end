import React, {useState, useMemo} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormHelperText from '@material-ui/core/FormHelperText';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {MobileDevices} from '../Constants';
import {getMobileDeviceDisplayName} from '../common';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  error: {
    border: `1px solid ${theme.palette.error.main}`,
  },
  text: {
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  device: {
    padding: theme.spacing(1.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    fontWeight: 500,
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderBottom: `1px solid ${theme.palette.border.light}`,
    paddingBottom: theme.spacing(2),
  },
  button: {
    textTransform: 'unset',
  },
}));

// selectedMobileDevice is the value part of a device, i.e the resolution of it
const MobileDeviceSelect = React.memo(
  ({onChange, selectedMobileDevice, error, disabled, accordionClasses}) => {
    const [expanded, setExpanded] = useState(false);
    const classes = useStyles();

    const typeWiseDevices = useMemo(() => {
      const o = {};
      Object.keys(MobileDevices).forEach((k) => {
        const {TYPE, VALUE} = MobileDevices[k];
        if (o[TYPE] === undefined) {
          o[TYPE] = [VALUE];
        } else {
          o[TYPE].push(VALUE);
        }
      });
      return o;
    }, []);

    const handleAccordionChange = (event, isExpanded) => {
      setExpanded(isExpanded);
    };

    const handleChange = (device) => {
      onChange(device);
      setExpanded(false);
    };

    const getSelectedDeviceDisplayText = () => {
      if (!selectedMobileDevice) {
        return 'Select a device';
      }
      // If some device is not found, we will display it's value only
      return (
        getMobileDeviceDisplayName(selectedMobileDevice) || selectedMobileDevice
      );
    };

    return (
      <Box className={classes.root}>
        <Accordion
          expanded={expanded}
          disabled={disabled}
          onChange={handleAccordionChange}
          className={clsx(Boolean(error) && classes.error)}
          classes={{...accordionClasses}}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="md-content"
            id="md-header">
            <div>
              <Typography
                className={classes.text}
                style={{
                  display: 'inline-block',
                  marginLeft: '4px',
                }}>
                {getSelectedDeviceDisplayText()}
              </Typography>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" width="100%">
              {typeWiseDevices &&
                Object.keys(typeWiseDevices).map((k) => (
                  <Box className={classes.content} key={k}>
                    <Box width={80}>
                      <Typography
                        className={classes.text}
                        style={{
                          display: 'inline-block',
                          paddingTop: '14px',
                        }}>
                        {k}
                      </Typography>
                    </Box>
                    <Box flex={1} flexWrap="wrap">
                      {typeWiseDevices[k].map((v) => (
                        <Button
                          className={clsx(
                            classes.device,
                            classes.text,
                            selectedMobileDevice === v
                              ? classes.selected
                              : null,
                            classes.button
                          )}
                          onClick={() => handleChange(v)}
                          title="click to select"
                          key={v}>
                          <Typography
                            className={classes.text}
                            style={{
                              display: 'inline-block',
                              marginLeft: '4px',
                            }}>
                            {getMobileDeviceDisplayName(v)}
                          </Typography>
                        </Button>
                      ))}
                    </Box>
                  </Box>
                ))}
            </Box>
          </AccordionDetails>
        </Accordion>
        {Boolean(error) && <FormHelperText error>{error}</FormHelperText>}
      </Box>
    );
  }
);

MobileDeviceSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedMobileDevice: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  accordionClasses: PropTypes.object,
};

MobileDeviceSelect.defaultProps = {
  selectedMobileDevice: null,
  error: null,
  disabled: false,
  accordionClasses: {},
};

export default MobileDeviceSelect;

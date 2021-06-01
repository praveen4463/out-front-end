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
import {Os} from '../Constants';
import {
  getOsDisplayName,
  getPlatformDisplayName,
  getOsIcon as getOsIcon_,
} from '../common';

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
  os: {
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

// selectedOs is the value part of an Os, such as win10 for Windows 10
const OsSelect = React.memo(
  ({onChange, selectedOs, error, disabled, accordionClasses}) => {
    const [expanded, setExpanded] = useState(false);
    const classes = useStyles();

    const platformWiseOs = useMemo(() => {
      const o = {};
      Object.keys(Os).forEach((k) => {
        const {PLATFORM, VALUE} = Os[k];
        if (o[PLATFORM] === undefined) {
          o[PLATFORM] = [VALUE];
        } else {
          o[PLATFORM].push(VALUE);
        }
      });
      return o;
    }, []);

    const handleAccordionChange = (event, isExpanded) => {
      setExpanded(isExpanded);
    };

    const handleOsChange = (os) => {
      onChange(os);
      setExpanded(false);
    };

    const getSelectedOsDisplayText = () => {
      if (!selectedOs) {
        return 'Select an OS';
      }
      return getOsDisplayName(selectedOs);
    };

    const getOsIcon = (os) => {
      return (
        <img src={getOsIcon_(os)} alt={os} style={{verticalAlign: 'middle'}} />
      );
    };

    const getSelectedOsIcon = () => {
      if (!selectedOs) {
        return null;
      }
      return getOsIcon(selectedOs);
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
            aria-controls="osSelect-content"
            id="osSelect-header">
            <div>
              {getSelectedOsIcon()}
              <Typography
                className={classes.text}
                style={{
                  display: 'inline-block',
                  marginLeft: '4px',
                }}>
                {getSelectedOsDisplayText()}
              </Typography>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" width="100%">
              {platformWiseOs &&
                Object.keys(platformWiseOs).map((k) => (
                  <Box className={classes.content} key={k}>
                    <Box width={80}>
                      <Typography
                        className={classes.text}
                        style={{
                          display: 'inline-block',
                          paddingTop: '14px',
                        }}>
                        {getPlatformDisplayName(k)}
                      </Typography>
                    </Box>
                    <Box flex={1} flexWrap="wrap">
                      {platformWiseOs[k].map((v) => (
                        <Button
                          className={clsx(
                            classes.os,
                            classes.text,
                            selectedOs === v ? classes.selected : null,
                            classes.button
                          )}
                          onClick={() => handleOsChange(v)}
                          title="click to select"
                          key={v}>
                          {getOsIcon(v)}
                          <Typography
                            className={classes.text}
                            style={{
                              display: 'inline-block',
                              marginLeft: '4px',
                            }}>
                            {getOsDisplayName(v)}
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

OsSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedOs: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  accordionClasses: PropTypes.object,
};

OsSelect.defaultProps = {
  selectedOs: null,
  error: null,
  disabled: false,
  accordionClasses: {},
};

export default OsSelect;

import React, {useState, useMemo} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {Os, Platforms} from '../Constants';
import windowsIcon from '../icons/windows.png';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
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
}));

// selectedOs is the value part of an Os, such as win10 for Windows 10
const OsSelect = React.memo(({onChange, selectedOs = null}) => {
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

  const getPlatformDisplayName = (platform) => {
    let display;
    switch (platform) {
      case Platforms.WINDOWS.VALUE:
        display = Platforms.WINDOWS.DISPLAY_NAME;
        break;
      default:
        throw new Error(`Unrecognized platform ${platform}`);
    }
    return display;
  };

  const getOsDisplayName = (os) => {
    let display;
    switch (os) {
      case Os.WIN10.VALUE:
        display = Os.WIN10.DISPLAY_NAME;
        break;
      case Os.WIN8_1.VALUE:
        display = Os.WIN8_1.DISPLAY_NAME;
        break;
      default:
        throw new Error(`Unrecognized os ${os}`);
    }
    return display;
  };

  const getSelectedOsDisplayText = () => {
    if (!selectedOs) {
      return 'Select an OS';
    }
    return getOsDisplayName(selectedOs);
  };

  const getOsIcon = (os) => {
    let icon;
    switch (os) {
      case Os.WIN10.VALUE:
      case Os.WIN8_1.VALUE:
        icon = windowsIcon;
        break;
      default:
        throw new Error(`Unrecognized os ${os}`);
    }
    return <img src={icon} alt={os} style={{verticalAlign: 'middle'}} />;
  };

  const getSelectedOsIcon = () => {
    if (!selectedOs) {
      return null;
    }
    return getOsIcon(selectedOs);
  };

  return (
    <Box className={classes.root}>
      <Accordion expanded={expanded} onChange={handleAccordionChange}>
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
          <Box display="flex" flexDirection="column">
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
                          selectedOs === v ? classes.selected : null
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
    </Box>
  );
});

OsSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedOs: PropTypes.string,
};

OsSelect.defaultProps = {
  selectedOs: null,
};

export default OsSelect;

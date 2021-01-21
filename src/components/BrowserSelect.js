import React, {useState, useEffect, useMemo} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import clsx from 'clsx';
import axios from 'axios';
import PropTypes from 'prop-types';
import {FormHelperText} from '@material-ui/core';
import useSnackbarTypeError from '../hooks/useSnackbarTypeError';
import {Browsers} from '../Constants';
import Browser from '../model';
import {
  getBrowserDisplayName,
  getBrowserIcon as getBrowserIcon_,
  getBrowsersEndpoint,
  handleApiError,
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
  version: {
    padding: theme.spacing(1.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    fontWeight: 500,
  },
  selectedVersion: {
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

// onChange accept a Browser.
const BrowserSelect = React.memo(
  ({
    platform,
    onChange,
    selectedBrowser,
    error,
    disabled,
    accordionClasses,
  }) => {
    const [browserWiseVersions, setBrowserWiseVersions] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
    const classes = useStyles();

    useEffect(() => {
      async function getBrowsers() {
        try {
          const {data} = await axios(getBrowsersEndpoint(platform));
          if (!data.length) {
            throw new Error(
              `${platform} has no browser, this shouldn't have happened`
            );
          }
          const browserWiseData = {};
          // api sends sorted names and versions
          data.forEach((brw) => {
            const name =
              brw.name === 'internet explorer' ? Browsers.IE.VALUE : brw.name;
            browserWiseData[name] = brw.versions;
          });
          setBrowserWiseVersions(browserWiseData);
        } catch (ex) {
          handleApiError(
            ex,
            (errorMsg) => setSnackbarErrorMsg(errorMsg),
            "Couldn't get browsers"
          );
        }
      }
      // when platform is null don't run it, platform can't become non null -> null,
      // it can only change from one value to another.
      // so this is fine.
      if (!platform) {
        return;
      }
      setBrowserWiseVersions(null); // when platform changes, set null so that previous
      // platform's browser won't show up while new are loading, doesn't change state
      // when it's already null.
      getBrowsers();
    }, [platform, setSnackbarErrorMsg]);

    const handleAccordionChange = (event, isExpanded) => {
      setExpanded(isExpanded);
    };

    const handleBrowserChange = (browser) => {
      onChange(browser);
      setExpanded(false);
    };

    const currentBrowser = useMemo(() => {
      // if selectedBrowser is in list of browser, then only make it current.
      if (
        selectedBrowser &&
        browserWiseVersions &&
        browserWiseVersions[selectedBrowser.name] &&
        browserWiseVersions[selectedBrowser.name].indexOf(
          selectedBrowser.version
        ) >= 0
      ) {
        return selectedBrowser;
      }
      return null;
    }, [selectedBrowser, browserWiseVersions]);

    const getSelectedBrowserDisplayText = () => {
      if (!platform) {
        return ''; // when no platform is selected, don't display any text.
      }
      if (!browserWiseVersions) {
        return 'Loading...';
      }
      const selected = currentBrowser;
      if (!selected) {
        return 'Select a browser';
      }
      return `${getBrowserDisplayName(selected.name)} ${selected.version}`;
    };

    const getBrowserIcon = (name) => {
      return (
        <img
          src={getBrowserIcon_(name)}
          alt={name}
          style={{verticalAlign: 'middle'}}
        />
      );
    };

    const getSelectedBrowserIcon = () => {
      const selected = currentBrowser;
      if (!selected) {
        return null;
      }
      return getBrowserIcon(selected.name);
    };

    return (
      <>
        <Box className={classes.root}>
          <Accordion
            expanded={expanded}
            disabled={disabled || !browserWiseVersions}
            onChange={handleAccordionChange}
            className={clsx(Boolean(error) && classes.error)}
            classes={{...accordionClasses}}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="browserSelect-content"
              id="browserSelect-header">
              <div>
                {getSelectedBrowserIcon()}
                <Typography
                  className={classes.text}
                  style={{
                    display: 'inline-block',
                    marginLeft: '4px',
                  }}>
                  {getSelectedBrowserDisplayText()}
                </Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexDirection="column" width="100%">
                {browserWiseVersions &&
                  // platform is necessary so that if platform changes, we don't fill any list until new browsers load.
                  platform &&
                  Object.keys(browserWiseVersions).map((k) => (
                    <Box className={classes.content} key={k}>
                      <Box width={80}>
                        {getBrowserIcon(k)}
                        <Typography
                          className={classes.text}
                          style={{
                            display: 'inline-block',
                            marginLeft: '4px',
                            paddingTop: '14px',
                          }}>
                          {getBrowserDisplayName(k)}
                        </Typography>
                      </Box>
                      <Box flex={1} flexWrap="wrap">
                        {browserWiseVersions[k].map((v) => (
                          <Button
                            className={clsx(
                              classes.version,
                              classes.text,
                              currentBrowser &&
                                currentBrowser.name === k &&
                                currentBrowser.version === v
                                ? classes.selectedVersion
                                : null
                            )}
                            onClick={() =>
                              handleBrowserChange(new Browser(k, v))
                            }
                            title="click to select"
                            key={`${k}-${v}`}>
                            {v}
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
        {snackbarTypeError}
      </>
    );
  }
);

BrowserSelect.propTypes = {
  platform: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  selectedBrowser: PropTypes.instanceOf(Browser),
  error: PropTypes.string,
  disabled: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  accordionClasses: PropTypes.object,
};

BrowserSelect.defaultProps = {
  platform: null,
  selectedBrowser: null,
  error: null,
  disabled: false,
  accordionClasses: {},
};

export default BrowserSelect;

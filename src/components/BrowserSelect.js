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
import PropTypes from 'prop-types';
import {ApiStatuses, Browsers} from '../Constants';
import Browser from '../model';
import chrome from '../icons/chrome.png';
import firefox from '../icons/firefox.png';
import ie from '../icons/ie.png';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
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
  ({platform, onChange, selectedBrowser = null}) => {
    const [browserWiseVersions, setBrowserWiseVersions] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const classes = useStyles();

    // This effect runs just once, the validation method of swr or react-query
    // will update data when user does tab refocus or computer awake etc which
    // should be fine because this list doesn't change rapidly.
    // https://swr.vercel.app/docs/revalidation
    useEffect(() => {
      const onSuccess = (response) => {
        setBrowserWiseVersions(response.data);
      };
      // send api request for browser versions data based on platform
      setTimeout(() => {
        const response = {
          status: ApiStatuses.SUCCESS,
          data: platform
            ? {
                [Browsers.CHROME.VALUE]: [
                  '70',
                  '71',
                  '72',
                  '73',
                  '74',
                  '75',
                  '76',
                  '77',
                  '78',
                  '79',
                  '80',
                  '81',
                  '82',
                  '83',
                  '84',
                  '85',
                  '90',
                ],
                [Browsers.FIREFOX.VALUE]: [
                  '70',
                  '71',
                  '72',
                  '73',
                  '74',
                  '75',
                  '76',
                  '77',
                  '78',
                  '79',
                  '80',
                  '81',
                  '82',
                  '83',
                ],
                [Browsers.IE.VALUE]: ['11'],
              }
            : {},
        };
        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess(response);
        }
      }, 1000);
    }, [platform]);

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

    const getBrowserDisplayName = (name) => {
      let display;
      switch (name) {
        case Browsers.CHROME.VALUE:
          display = Browsers.CHROME.DISPLAY_NAME;
          break;
        case Browsers.FIREFOX.VALUE:
          display = Browsers.FIREFOX.DISPLAY_NAME;
          break;
        case Browsers.IE.VALUE:
          display = Browsers.IE.DISPLAY_NAME;
          break;
        default:
          throw new Error(`Unrecognized browser ${name}`);
      }
      return display;
    };

    const getSelectedBrowserDisplayText = () => {
      if (!browserWiseVersions || !Object.keys(browserWiseVersions).length) {
        return 'Loading...';
      }
      const selected = currentBrowser;
      if (!selected) {
        return 'Select a browser';
      }
      return `${getBrowserDisplayName(selected.name)} ${selected.version}`;
    };

    const getBrowserIcon = (name) => {
      let icon;
      switch (name) {
        case Browsers.CHROME.VALUE:
          icon = chrome;
          break;
        case Browsers.FIREFOX.VALUE:
          icon = firefox;
          break;
        case Browsers.IE.VALUE:
          icon = ie;
          break;
        default:
          throw new Error(`Unrecognized browser ${name}`);
      }
      return <img src={icon} alt={name} style={{verticalAlign: 'middle'}} />;
    };

    const getSelectedBrowserIcon = () => {
      const selected = currentBrowser;
      if (!selected) {
        return null;
      }
      return getBrowserIcon(selected.name);
    };

    return (
      <Box className={classes.root}>
        <Accordion expanded={expanded} onChange={handleAccordionChange}>
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
            <Box display="flex" flexDirection="column">
              {browserWiseVersions &&
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
                          onClick={() => handleBrowserChange(new Browser(k, v))}
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
      </Box>
    );
  }
);

BrowserSelect.propTypes = {
  platform: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  selectedBrowser: PropTypes.instanceOf(Browser),
};

BrowserSelect.defaultProps = {
  selectedBrowser: null,
};

export default BrowserSelect;

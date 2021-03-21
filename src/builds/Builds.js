import React, {
  useState,
  useMemo,
  useRef,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import TimerIcon from '@material-ui/icons/Timer';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import DateRangeIcon from '@material-ui/icons/DateRangeOutlined';
import {
  Switch,
  Route,
  useRouteMatch,
  useLocation,
  useHistory,
  Link as RouterLink,
} from 'react-router-dom';
import {useQueryClient, useQuery} from 'react-query';
import axios from 'axios';
import {DateRangePicker} from 'react-date-range';
import subMonths from 'date-fns/subMonths';
import isBefore from 'date-fns/isBefore';
import intervalToDuration from 'date-fns/intervalToDuration';
import clsx from 'clsx';
import queryString from 'query-string';
import {
  addInSearchQuery,
  addMultipleInSearchQuery,
  filterSearchQuery,
  getBrowserDisplayName,
  getBrowserIcon,
  getCompletedBuildSummaryEndpoint,
  getLocation,
  getNumberParamFromUrl,
  getOsDisplayName,
  getOsIcon,
  getPlatformDisplayName,
  handleApiError,
  isInteger,
  updateMultipleInSearchQuery,
} from '../common';
import {Os, PageUrl, QueryKeys, SearchKeys, TestStatus} from '../Constants';
import useSnackbarAlert from '../hooks/useSnackbarAlert';
import {BuildsSnackbarContext, HomeLinearProgressContext} from '../contexts';
import {
  dateFromUnixEpochSec,
  dateToDateOnlyISO,
  formatDate,
  isoDateOnlyToDate,
} from '../utils';
import {browsersFetch} from '../api/fetches';
import Browser from '../model';
import Loader from '../components/Loader';
import {convertMillisIntoTimeText} from '../buildsCommon';
import CompletedBuild from './CompletedBuild';
import BuildStatusIconSet from '../components/BuildStatusIconSet';
import BuildStatusIcon from '../components/BuildStatusIcon';
import RunningBuilds from './RunningBuilds';

const ALL = 'ALL';

const DEFAULT_FORMAT = 'MMM dd, yyyy';

const DEFAULT_START_DATE = subMonths(new Date(), 1);

const DEFAULT_END_DATE = new Date();

const STATUSES = {
  [ALL]: 'All',
  [TestStatus.SUCCESS]: 'Success',
  [TestStatus.ERROR]: 'Error',
  [TestStatus.STOPPED]: 'Stopped',
  [TestStatus.ABORTED]: 'Aborted',
};

const MenuItems = {
  DATE_RANGE: 'DATE_RANGE',
  STATUS: 'STATUS',
  BROWSER: 'BROWSER',
  OS: 'OS',
};

const useStyles = makeStyles((theme) => ({
  linkText: {
    color: theme.palette.text.medium,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  linksContainer: {
    width: 200,
  },
  root: {
    width: '100%',
  },
  mainContent: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  divider: {
    width: '100%',
    margin: theme.spacing(2, 0),
  },
  button: {
    textTransform: 'none',
  },
  endIcon: {
    marginLeft: 0,
  },
  version: {
    padding: theme.spacing(1.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
    fontWeight: 500,
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
  },
  browserContent: {
    display: 'flex',
    width: '100%',
    borderBottom: `1px solid ${theme.palette.border.light}`,
    paddingBottom: theme.spacing(2),
  },
  browserPopup: {
    maxWidth: '40%',
  },
  osPopup: {
    maxWidth: '30%',
  },
  buttonText: {
    display: 'inline-block',
    marginLeft: '4px',
  },
  borderSuccess: {
    borderLeft: '3px solid #4caf50',
  },
  borderFailure: {
    borderLeft: `3px solid ${theme.palette.error.main}`,
  },
  borderNeutral: {
    borderLeft: '3px solid #868686',
  },
  buildBox: {
    borderBottom: `1px solid ${theme.palette.border.lightest}`,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  statusIconBuild: {
    fontSize: '1.4rem',
  },
  iconsIndication: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
  },
  noRecordText: {
    marginTop: theme.spacing(4),
  },
  separator: {
    margin: `0 ${theme.spacing(2)}px`,
  },
}));

const ContainerPopover = ({id, anchorEl, open, onClose, classes, children}) => (
  <Popover
    id={id}
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    getContentAnchorEl={null}
    classes={classes}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'left',
    }}>
    {children}
  </Popover>
);

ContainerPopover.propTypes = {
  id: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object,
  children: PropTypes.node.isRequired,
};

ContainerPopover.defaultProps = {
  anchorEl: null,
  classes: {},
};

function ListItemLink(props) {
  return (
    <ListItem
      button
      component={RouterLink}
      style={{padding: '0 0 0 4px'}}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}

function Anchor(el = null, menuItem = null) {
  this.el = el;
  this.menuItem = menuItem;
}

const getDateRange = (startDate, endDate) => {
  if (isBefore(endDate, startDate)) {
    throw new RangeError("Start date can't be greater than end");
  }
  return [
    {
      startDate,
      endDate,
      key: 'selection',
    },
  ];
};

async function buildsFetch({queryKey}) {
  const [
    ,
    {projectId, dateRange, testStatus, browser, os, after, before},
  ] = queryKey;
  const {startDate, endDate} = dateRange[0];
  const params = {
    // time is included with start and end date to represent exact 1 day's difference.
    // This enables us to correctly deduce utc dates as it will add/deduct time from
    // date. For example if user select's Mar 20 2021 in 5:30 offset, we will send
    // to api 2021-01-19T18:30:00.000Z and 2021-01-20T18:29:59.999Z
    start: new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      0,
      0,
      0,
      0
    ).toISOString(), // convert dates to utc and iso string
    end: new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23,
      59,
      59,
      999
    ).toISOString(),
  };
  if (testStatus !== ALL) {
    params.status = testStatus;
  }
  if (browser.name !== ALL) {
    params.brw = browser.name;
  }
  if (browser.version !== ALL) {
    params.brwV = browser.version;
  }
  if (os !== ALL) {
    params.os = os;
  }
  if (after) {
    params.after = after;
  }
  if (before) {
    params.before = before;
  }
  const {data} = await axios(getCompletedBuildSummaryEndpoint(projectId), {
    params,
  });
  return data;
}

const Default = ({url}) => {
  const location = useLocation();
  const parsed = useMemo(() => queryString.parse(location.search), [
    location.search,
  ]);
  const history = useHistory();
  const queryClient = useQueryClient();
  const projectId = useMemo(
    () => getNumberParamFromUrl(SearchKeys.PROJECT_QS, location.search),
    [location.search]
  );
  const separatePageQuery = useMemo(
    () => addInSearchQuery('', SearchKeys.PROJECT_QS, projectId),
    [projectId]
  );
  const [state, setState] = useState({
    anchor: new Anchor(),
    dateRange: getDateRange(DEFAULT_START_DATE, DEFAULT_END_DATE),
    testStatus: ALL,
    browser: new Browser(ALL, ALL),
    os: ALL,
    after: null,
    before: null,
  });
  const {anchor, dateRange, testStatus, browser, os, after, before} = state;
  const buildsQueryKeyVar = useMemo(
    () => ({
      projectId,
      dateRange,
      testStatus,
      browser,
      os,
      after,
      before,
    }),
    [after, before, browser, dateRange, os, projectId, testStatus]
  );
  const parsedStartDate = parsed[SearchKeys.START_DATE];
  const parsedEndDate = parsed[SearchKeys.END_DATE];
  const parsedTestStatus = parsed[SearchKeys.TEST_STATUS];
  const parsedBrowserName = parsed[SearchKeys.BROWSER_NAME];
  const parsedBrowserVersion = parsed[SearchKeys.BROWSER_VERSION];
  const parsedOS = parsed[SearchKeys.OS];
  const parsedAfter = parsed[SearchKeys.AFTER];
  const parsedBefore = parsed[SearchKeys.BEFORE];
  const {startDate, endDate} = dateRange[0];
  const {
    data: builds,
    error: buildsError,
    isPreviousData,
    isFetching,
    isLoading,
  } = useQuery(
    [QueryKeys.COMPLETED_BUILDS_SUMMARY, buildsQueryKeyVar],
    buildsFetch,
    {keepPreviousData: true, staleTime: 5000}
    // stale time helps sending fewer requests when user users the same filters
    // too quickly or prefetching encounters the same query fetched moments ago
  );
  const {data: browsers, error: browserError} = useQuery(
    QueryKeys.BROWSERS,
    browsersFetch,
    {staleTime: 10 * 60 * 1000}
  );
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
  const paging = builds?.paging;
  const olderDisabled = !paging?.hasOlder || isPreviousData;
  const newerDisabled = !paging?.hasNewer;
  const completedBuildsSummary = builds?.completedBuildsSummary;
  const [, setSnackbarAlertError] = useContext(BuildsSnackbarContext);
  const setProgressAtTopBar = useContext(HomeLinearProgressContext);
  const btnDateRef = useRef(null);
  const btnStatusRef = useRef(null);
  const btnBrowserRef = useRef(null);
  const btnOsRef = useRef(null);
  const classes = useStyles();

  const setAnchor = (a) => setState((s) => ({...s, anchor: a}));

  const getFirstBuildId = () => {
    if (completedBuildsSummary?.length) {
      return completedBuildsSummary[0].buildId;
    }
    return null;
  };

  const getLastBuildId = useCallback(() => {
    if (completedBuildsSummary?.length) {
      return completedBuildsSummary[completedBuildsSummary.length - 1].buildId;
    }
    return null;
  }, [completedBuildsSummary]);

  // listens for browsers loading error
  useEffect(() => {
    if (browserError) {
      handleApiError(
        browserError,
        setSnackbarAlertError,
        'Browsers failed to load'
      );
    }
  }, [browserError, setSnackbarAlertError]);

  // listens for builds loading error
  useEffect(() => {
    if (buildsError) {
      handleApiError(
        buildsError,
        setSnackbarAlertError,
        'Builds failed to load'
      );
    }
  }, [buildsError, setSnackbarAlertError]);

  // prefetch older page
  useEffect(() => {
    if (!builds?.hasOlder) {
      return;
    }
    queryClient.prefetchQuery(
      [
        QueryKeys.COMPLETED_BUILDS_SUMMARY,
        {...buildsQueryKeyVar, before: getLastBuildId()},
      ],
      buildsFetch
    );
  }, [builds, buildsQueryKeyVar, getLastBuildId, queryClient]);

  // listen to start and end date changes in query and set state
  // not resetting to default when no date is in search as there is no way to
  // remove a filter altogether from search but to change it once it's applied
  useEffect(() => {
    if (parsedStartDate && parsedEndDate) {
      const start = isoDateOnlyToDate(parsedStartDate);
      const end = isoDateOnlyToDate(parsedEndDate);
      try {
        setState((s) => ({
          ...s,
          dateRange: getDateRange(start, end),
        }));
      } catch {
        // when user does something with dates manually in query, and parsing
        // fails for any reason, ignore that and leave what is in state. Don't
        // throw error. This is same as user removing that param from query.
      }
    }
    // if user removes date(s) from query, don't do anything and let the value
    // remain in state. If they change date using component, we will again set in
    // query.
  }, [parsedEndDate, parsedStartDate]);

  // listen to test status change in query and set state
  // not resetting to default when no status is in search as there is no way to
  // remove a filter altogether from search but to change it once it's applied
  useEffect(() => {
    if (parsedTestStatus && STATUSES[parsedTestStatus]) {
      setState((s) => ({...s, testStatus: parsedTestStatus}));
    }
  }, [parsedTestStatus]);

  // listen to browser change
  // not resetting to default when no browser is in search as there is no way to
  // remove a filter altogether from search but to change it once it's applied
  useEffect(() => {
    if (
      parsedBrowserName &&
      parsedBrowserVersion &&
      (parsedBrowserName === ALL || browsers?.[parsedBrowserName]) &&
      (parsedBrowserVersion === ALL ||
        browsers?.[parsedBrowserName].includes(parsedBrowserVersion))
    ) {
      setState((s) => ({
        ...s,
        browser: new Browser(parsedBrowserName, parsedBrowserVersion),
      }));
    }
  }, [browsers, parsedBrowserName, parsedBrowserVersion]);

  // listen to os change
  // not resetting to default when no os is in search as there is no way to
  // remove a filter altogether from search but to change it once it's applied
  useEffect(() => {
    if (
      parsedOS &&
      (parsedOS === ALL ||
        Object.values(platformWiseOs).flat().includes(parsedOS))
    ) {
      setState((s) => ({...s, os: parsedOS}));
    }
  }, [parsedOS, platformWiseOs]);

  // listen to after change
  useEffect(() => {
    setState((s) => ({
      ...s,
      after: parsedAfter && isInteger(parsedAfter) ? parsedAfter : null,
    }));
  }, [parsedAfter]);

  // listen to before change
  useEffect(() => {
    setState((s) => ({
      ...s,
      before: parsedBefore && isInteger(parsedBefore) ? parsedBefore : null,
    }));
  }, [parsedBefore]);

  // set progress when we're fetching.
  useEffect(() => {
    setProgressAtTopBar(isFetching);
    return () => setProgressAtTopBar(false);
  }, [isFetching, setProgressAtTopBar]);

  // whenever builds are changed, scroll to top so user sees new content
  useEffect(() => {
    if (builds) {
      window.scroll(0, 0);
    }
  }, [builds]);

  const handleClose = () => setAnchor(new Anchor());

  const handleDateButtonClick = () =>
    setAnchor(new Anchor(btnDateRef.current, MenuItems.DATE_RANGE));

  const handleStatusButtonClick = () =>
    setAnchor(new Anchor(btnStatusRef.current, MenuItems.STATUS));

  const handleBrowserButtonClick = () =>
    setAnchor(new Anchor(btnBrowserRef.current, MenuItems.BROWSER));

  const handleOsButtonClick = () =>
    setAnchor(new Anchor(btnOsRef.current, MenuItems.OS));

  // sets undefined against paging query keys so that when stringified, they will
  // be removed
  const getPagingRemovalObject = () => ({
    [SearchKeys.AFTER]: undefined,
    [SearchKeys.BEFORE]: undefined,
  });

  const handleDateChange = ({selection}) => {
    updateMultipleInSearchQuery(location, history, {
      [SearchKeys.START_DATE]: dateToDateOnlyISO(selection.startDate),
      [SearchKeys.END_DATE]: dateToDateOnlyISO(selection.endDate),
      ...getPagingRemovalObject(),
    });
  };

  const handleStatusChange = (value) => {
    updateMultipleInSearchQuery(location, history, {
      [SearchKeys.TEST_STATUS]: value,
      ...getPagingRemovalObject(),
    });
    handleClose();
  };

  const handleBrowserChange = (selectedBrowser) => {
    updateMultipleInSearchQuery(location, history, {
      [SearchKeys.BROWSER_NAME]: selectedBrowser.name,
      [SearchKeys.BROWSER_VERSION]: selectedBrowser.version,
      ...getPagingRemovalObject(),
    });
    handleClose();
  };

  const handleOsChange = (selectedOs) => {
    updateMultipleInSearchQuery(location, history, {
      [SearchKeys.OS]: selectedOs,
      ...getPagingRemovalObject(),
    });
    handleClose();
  };

  // remove after from search when older is requested
  const getOlderLocation = () =>
    getLocation(
      location.pathname,
      addMultipleInSearchQuery(location.search, {
        [SearchKeys.AFTER]: undefined,
        [SearchKeys.BEFORE]: getLastBuildId(),
      }),
      location.state
    );

  // remove before from search when newer is requested
  const getNewerLocation = () =>
    getLocation(
      location.pathname,
      addMultipleInSearchQuery(location.search, {
        [SearchKeys.BEFORE]: undefined,
        [SearchKeys.AFTER]: getFirstBuildId(),
      }),
      location.state
    );

  const getButton = (ref, onClick, content, disabled = false) => (
    <Button
      variant="contained"
      endIcon={<ArrowDropDownIcon />}
      className={classes.button}
      ref={ref}
      classes={{endIcon: classes.endIcon}}
      disabled={disabled}
      onClick={onClick}>
      {content}
    </Button>
  );

  const getSelectedBrowserText = () => {
    const {name, version} = browser;
    if (name === ALL) {
      return 'All Browsers';
    }
    return (
      <>
        <img src={getBrowserIcon(name)} alt={name} />
        <span className={classes.buttonText}>
          {`${getBrowserDisplayName(name)} ${version}`}
        </span>
      </>
    );
  };

  const getSelectedOsText = () => {
    if (os === ALL) {
      return 'All OSs';
    }
    return (
      <>
        <img src={getOsIcon(os)} alt={os} />
        <span className={classes.buttonText}>{getOsDisplayName(os)}</span>
      </>
    );
  };

  const getBorderByStatus = (status) => {
    if (status === TestStatus.SUCCESS) {
      return classes.borderSuccess;
    }
    if (status === TestStatus.ERROR) {
      return classes.borderFailure;
    }
    return classes.borderNeutral;
  };

  const getSelectedStatusText = () => {
    if (testStatus === ALL) {
      return 'All Statuses';
    }
    return (
      <>
        <BuildStatusIcon status={testStatus} />
        <span className={classes.buttonText}>{STATUSES[testStatus]}</span>
      </>
    );
  };

  const getDateRangeSelectedText = () => (
    <>
      <DateRangeIcon />
      <span className={classes.buttonText}>
        {`${formatDate(startDate, DEFAULT_FORMAT)} - ${formatDate(
          endDate,
          DEFAULT_FORMAT
        )}`}
      </span>
    </>
  );

  const getStartTimeFormattedText = (startDateInUnixEpochSec) => {
    const duration = intervalToDuration({
      start: dateFromUnixEpochSec(startDateInUnixEpochSec),
      end: new Date(),
    });
    let identifier;
    let total;
    const {years, months, days, hours, minutes, seconds} = duration;
    if (years > 0) {
      identifier = 'year';
      total = years;
      if (months >= 9) {
        total += 1;
      }
    } else if (months > 0) {
      identifier = 'month';
      total = months;
      if (days >= 20) {
        total += 1;
      }
    } else if (days > 0) {
      identifier = 'day';
      total = days;
      if (hours >= 20) {
        total += 1;
      }
    } else if (hours > 0) {
      identifier = 'hour';
      total = hours;
      if (minutes >= 50) {
        total += 1;
      }
    } else if (minutes > 0) {
      identifier = 'minute';
      total = minutes;
      if (seconds >= 50) {
        total += 1;
      }
    } else {
      return 'Ran just now';
    }
    if (total === 1) {
      total = identifier === 'hour' ? 'an' : 'a';
    } else {
      identifier += 's';
    }
    return `Ran about ${total} ${identifier} ago`;
  };

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Box pb={2} display="flex" alignItems="center">
        <Typography variant="h4">Completed Builds</Typography>
        <Box flex={1} />
        <Button
          variant="contained"
          color="secondary"
          component={RouterLink}
          to={getLocation(`${url}${PageUrl.CREATE}`, separatePageQuery, {
            location,
          })}>
          Create New Build
        </Button>
      </Box>
      <Box pb={4} display="flex">
        <Box mr={1}>
          {getButton(
            btnDateRef,
            handleDateButtonClick,
            getDateRangeSelectedText()
          )}
          <ContainerPopover
            id="dateRange"
            anchorEl={anchor.el}
            open={!!(anchor.el && anchor.menuItem === MenuItems.DATE_RANGE)}
            onClose={handleClose}>
            <DateRangePicker
              onChange={handleDateChange}
              showSelectionPreview
              moveRangeOnFirstSelection={false}
              months={1}
              ranges={dateRange}
              direction="horizontal"
            />
          </ContainerPopover>
        </Box>
        <Box mr={1}>
          {getButton(
            btnStatusRef,
            handleStatusButtonClick,
            getSelectedStatusText()
          )}
          <Menu
            id="status"
            anchorEl={anchor.el}
            open={!!(anchor.el && anchor.menuItem === MenuItems.STATUS)}
            onClose={handleClose}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}>
            {Object.keys(STATUSES).map((s) => (
              <MenuItem
                onClick={() => handleStatusChange(s)}
                key={s}
                selected={testStatus === s}>
                <Box display="flex" alignItems="center" justifyContent="center">
                  {s !== ALL ? <BuildStatusIcon status={s} /> : null}
                  <Typography variant="body2" style={{marginLeft: '4px'}}>
                    {STATUSES[s]}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Box>
        <Box mr={1}>
          {getButton(
            btnBrowserRef,
            handleBrowserButtonClick,
            getSelectedBrowserText(),
            !browsers
          )}
          <ContainerPopover
            id="browser"
            anchorEl={anchor.el}
            open={!!(anchor.el && anchor.menuItem === MenuItems.BROWSER)}
            onClose={handleClose}
            classes={{paper: classes.browserPopup}}>
            <Box display="flex" flexDirection="column" width="100%" p={2}>
              <Box flex={1}>
                <Button
                  fullWidth
                  className={clsx(
                    classes.button,
                    browser.name === ALL ? classes.selected : null
                  )}
                  onClick={() => handleBrowserChange(new Browser(ALL, ALL))}>
                  All Browsers
                </Button>
              </Box>
              {browsers
                ? Object.keys(browsers).map((k) => (
                    <Box className={classes.browserContent} key={k}>
                      <Box width={80}>
                        <img
                          src={getBrowserIcon(k)}
                          alt={k}
                          style={{verticalAlign: 'middle'}}
                        />
                        <Typography
                          variant="body2"
                          style={{
                            display: 'inline-block',
                            marginLeft: '4px',
                            paddingTop: '14px',
                          }}>
                          {getBrowserDisplayName(k)}
                        </Typography>
                      </Box>
                      <Box flex={1} flexWrap="wrap">
                        <Button
                          className={clsx(
                            classes.version,
                            browser.name === k && browser.version === ALL
                              ? classes.selected
                              : null
                          )}
                          onClick={() =>
                            handleBrowserChange(new Browser(k, ALL))
                          }>
                          All
                        </Button>
                        {browsers[k].map((v) => (
                          <Button
                            className={clsx(
                              classes.version,
                              browser.name === k && browser.version === v
                                ? classes.selected
                                : null
                            )}
                            onClick={() =>
                              handleBrowserChange(new Browser(k, v))
                            }
                            key={`${k}-${v}`}>
                            {v}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  ))
                : null}
            </Box>
          </ContainerPopover>
        </Box>
        <Box mr={1}>
          {getButton(btnOsRef, handleOsButtonClick, getSelectedOsText())}
          <ContainerPopover
            id="os"
            anchorEl={anchor.el}
            open={!!(anchor.el && anchor.menuItem === MenuItems.OS)}
            onClose={handleClose}
            classes={{paper: classes.osPopup}}>
            <Box display="flex" flexDirection="column" width="100%" p={2}>
              <Box flex={1}>
                <Button
                  fullWidth
                  className={clsx(
                    classes.button,
                    os === ALL ? classes.selected : null
                  )}
                  onClick={() => handleOsChange(ALL)}>
                  All OSs
                </Button>
              </Box>
              {platformWiseOs
                ? Object.keys(platformWiseOs).map((k) => (
                    <Box className={classes.browserContent} key={k}>
                      <Box width={80}>
                        <Typography
                          variant="body2"
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
                              classes.version,
                              classes.button,
                              os === v ? classes.selected : null
                            )}
                            onClick={() => handleOsChange(v)}
                            key={`${k}-${v}`}>
                            <img src={getOsIcon(v)} alt={v} />
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: '4px',
                              }}>
                              {getOsDisplayName(v)}
                            </span>
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  ))
                : null}
            </Box>
          </ContainerPopover>
        </Box>
      </Box>
      <Box
        className={classes.mainContent}
        boxShadow={3}
        display="flex"
        flexDirection="column">
        {isLoading ? (
          <Box width="100%">
            <Loader rows={4} />
          </Box>
        ) : null}
        {completedBuildsSummary && !completedBuildsSummary.length ? (
          <Box textAlign="center" p={10}>
            <Typography variant="body1">
              No builds were found, try expanding date range or other filters.
            </Typography>
          </Box>
        ) : null}
        {completedBuildsSummary?.length
          ? completedBuildsSummary.map((bs) => (
              <ButtonBase
                component={RouterLink}
                to={getLocation(`${url}/${bs.buildId}`, separatePageQuery, {
                  location,
                })}
                key={bs.buildId}>
                <Box
                  p={1}
                  flex={1}
                  display="flex"
                  className={clsx(
                    classes.buildBox,
                    getBorderByStatus(bs.finalStatus)
                  )}>
                  <Box px={1} display="flex" alignItems="center">
                    <BuildStatusIcon
                      status={bs.finalStatus}
                      className={classes.statusIconBuild}
                    />
                  </Box>
                  <Box
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    justifyContent="center">
                    <Typography variant="body1" style={{fontWeight: 500}}>{`# ${
                      bs.buildId
                    } ${bs.buildName || ''}`}</Typography>
                    <Box
                      display="flex"
                      pt={0.5}
                      alignItems="center"
                      color="text.secondary"
                      fontSize="body2.fontSize">
                      <AccessTimeIcon
                        fontSize="small"
                        titleAccess="Begin Time"
                        className={classes.iconsIndication}
                      />
                      {getStartTimeFormattedText(bs.createDate)}
                      <span className={classes.separator}>|</span>
                      <TimerIcon
                        fontSize="small"
                        titleAccess="Tests Completion Time"
                        className={classes.iconsIndication}
                      />
                      {convertMillisIntoTimeText(bs.testTimeMillis)}
                      <span className={classes.separator}>|</span>
                      <img
                        src={getBrowserIcon(bs.browserName)}
                        alt={bs.browserName}
                      />
                      <span className={classes.separator}>|</span>
                      <img src={getOsIcon(bs.os)} alt={bs.os} />
                    </Box>
                  </Box>
                  <BuildStatusIconSet
                    totalSuccess={bs.totalSuccess}
                    totalError={bs.totalError}
                    totalStopped={bs.totalStopped}
                    totalAborted={bs.totalAborted}
                  />
                </Box>
              </ButtonBase>
            ))
          : null}
      </Box>
      <Box display="flex" pt={2} pb={12} justifyContent="center">
        <Button
          variant="contained"
          color="default"
          component={newerDisabled ? Button : RouterLink}
          to={newerDisabled ? null : getNewerLocation()}
          disabled={newerDisabled}
          className={classes.button}>
          Newer
        </Button>
        <Button
          variant="contained"
          color="default"
          component={olderDisabled ? Button : RouterLink}
          to={olderDisabled ? null : getOlderLocation()}
          disabled={olderDisabled}
          style={{marginLeft: '8px'}}
          className={classes.button}>
          Older
        </Button>
      </Box>
    </Box>
  );
};

Default.propTypes = {
  url: PropTypes.string.isRequired,
};

const Builds = () => {
  const location = useLocation();
  const {path, url} = useRouteMatch();
  const getSearchLocation = useMemo(
    () => filterSearchQuery(location.search, [SearchKeys.PROJECT_QS]),
    [location.search]
  );
  const [
    setSnackbarAlertProps,
    snackbarAlert,
    setSnackbarAlertError,
  ] = useSnackbarAlert();
  const classes = useStyles();

  const getLink = (pageUrl, name) => (
    <ListItemLink
      to={getLocation(pageUrl, getSearchLocation)}
      aria-label={name}>
      <ListItemText
        primary={name}
        classes={{
          primary: classes.linkText,
        }}
      />
    </ListItemLink>
  );

  return (
    <>
      <Box display="flex" alignItems="flex-start">
        <Box
          pr={2}
          overflow="auto"
          className={classes.linksContainer}
          component="nav">
          <List style={{padding: 0}}>
            {getLink(url, 'Completed builds')}
            {getLink(`${url}${PageUrl.RUNNING_BUILDS}`, 'Running builds')}
            {getLink(`${url}${PageUrl.CREATE}`, 'New build')}
          </List>
        </Box>
        <Box flex={1} display="flex" justifyContent="center">
          <BuildsSnackbarContext.Provider
            value={[setSnackbarAlertProps, setSnackbarAlertError]}>
            <Switch>
              <Route exact path={path}>
                <Default url={url} />
              </Route>
              <Route path={`${path}${PageUrl.RUNNING_BUILDS}`}>
                <RunningBuilds />
              </Route>
              <Route path={`${path}${PageUrl.CREATE}`}>
                <h1>New Build</h1>
              </Route>
              <Route path={`${path}${PageUrl.GET}`}>
                <CompletedBuild />
              </Route>
            </Switch>
          </BuildsSnackbarContext.Provider>
        </Box>
      </Box>
      {snackbarAlert}
    </>
  );
};

export default Builds;

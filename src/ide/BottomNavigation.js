/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useEffect, useContext, useRef} from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import {BottomNavs} from './Constants';
import {
  IdeBuildRunOngoingContext,
  IdeBuildRunContext,
  IdeDryRunOngoingContext,
  IdeDryRunContext,
  IdeParseRunOngoingContext,
  IdeParseRunContext,
} from './Contexts';

const useStyles = makeStyles((theme) => ({
  nav: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    color: theme.palette.background.contrastText,
    backgroundColor: theme.palette.background.navigations,
    height: 22,
    zIndex: theme.zIndex.appBar,
    width: '100%',
  },
  wrapper: {
    height: '100%',
  },
  typography: {
    marginLeft: 5,
    height: '100%',
  },
  link: {
    cursor: 'pointer',
    padding: '0 5px',
    height: '100%',
    display: 'inline-block',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  linkHover: {
    '&:hover': {
      backgroundColor: theme.palette.linkTab.hoverBackground,
      textDecoration: 'none',
    },
  },
  linkTab: {
    backgroundColor: theme.palette.linkTab.background,
  },
  activeTab: {
    backgroundColor: theme.palette.linkTab.activeBackground,
    color: theme.palette.linkTab.activeBackgroundText,
    '&:hover': {
      textDecoration: 'none',
    },
  },
}));

// TODO: receive from props clickHandler from line
const BottomNavigation = (props) => {
  const {clickHandler, active, lineColContainerRef} = props;
  const buildRunOngoing = useContext(IdeBuildRunOngoingContext);
  const buildRun = useContext(IdeBuildRunContext);
  const dryRunOngoing = useContext(IdeDryRunOngoingContext);
  const dryRun = useContext(IdeDryRunContext);
  const parseRunOngoing = useContext(IdeParseRunOngoingContext);
  const parseRun = useContext(IdeParseRunContext);
  const openedBuildOutputOncePerBuild = useRef(false);
  const openedDryOutputOncePerDry = useRef(false);
  const openedParseOutputOncePerParse = useRef(false);
  const classes = useStyles();

  useEffect(() => {
    if (!buildRunOngoing && openedBuildOutputOncePerBuild.current) {
      openedBuildOutputOncePerBuild.current = false;
    }
  }, [buildRunOngoing]);

  useEffect(() => {
    if (!dryRunOngoing && openedDryOutputOncePerDry.current) {
      openedDryOutputOncePerDry.current = false;
    }
  }, [dryRunOngoing]);

  useEffect(() => {
    if (!parseRunOngoing && openedParseOutputOncePerParse.current) {
      openedParseOutputOncePerParse.current = false;
    }
  }, [parseRunOngoing]);

  useEffect(() => {
    if (
      buildRunOngoing &&
      active !== BottomNavs.BUILD_RUN &&
      !openedBuildOutputOncePerBuild.current
    ) {
      clickHandler(BottomNavs.BUILD_RUN);
      openedBuildOutputOncePerBuild.current = true;
    }
  }, [active, clickHandler, buildRunOngoing]);

  useEffect(() => {
    if (
      dryRunOngoing &&
      active !== BottomNavs.DRY_RUN &&
      !openedDryOutputOncePerDry.current
    ) {
      clickHandler(BottomNavs.DRY_RUN);
      openedDryOutputOncePerDry.current = true;
    }
  }, [active, clickHandler, dryRunOngoing]);

  useEffect(() => {
    if (
      parseRunOngoing &&
      active !== BottomNavs.PARSE &&
      !openedParseOutputOncePerParse.current
    ) {
      clickHandler(BottomNavs.PARSE);
      openedParseOutputOncePerParse.current = true;
    }
  }, [active, clickHandler, parseRunOngoing]);

  return (
    <Paper
      square
      component="div"
      elevation={4}
      aria-label="Bottom Navigation"
      className={classes.nav}>
      {buildRun || buildRunOngoing ? (
        <Box display="flex" className={classes.wrapper}>
          <Typography
            variant="caption"
            style={{marginLeft: 48}}
            className={classes.typography}>
            <Link
              color="inherit"
              onClick={() => clickHandler(BottomNavs.BUILD_RUN)}
              className={clsx(
                classes.link,
                classes.linkTab,
                active === BottomNavs.BUILD_RUN
                  ? classes.activeTab
                  : classes.linkHover
              )}>
              Build Run
            </Link>
          </Typography>
        </Box>
      ) : null}
      {dryRun || dryRunOngoing ? (
        <Box display="flex" className={classes.wrapper}>
          <Typography variant="caption" className={classes.typography}>
            <Link
              color="inherit"
              onClick={() => clickHandler(BottomNavs.DRY_RUN)}
              className={clsx(
                classes.link,
                classes.linkTab,
                active === BottomNavs.DRY_RUN
                  ? classes.activeTab
                  : classes.linkHover
              )}>
              Dry Run
            </Link>
          </Typography>
        </Box>
      ) : null}
      {parseRun || parseRunOngoing ? (
        <Box display="flex" className={classes.wrapper}>
          <Typography variant="caption" className={classes.typography}>
            <Link
              color="inherit"
              onClick={() => clickHandler(BottomNavs.PARSE)}
              className={clsx(
                classes.link,
                classes.linkTab,
                active === BottomNavs.PARSE
                  ? classes.activeTab
                  : classes.linkHover
              )}>
              Parse
            </Link>
          </Typography>
        </Box>
      ) : null}
      <Box flex={1} className={classes.wrapper} />
      <Box
        display="flex"
        alignItems="center"
        className={classes.wrapper}
        style={{paddingRight: 22}}
        ref={lineColContainerRef}
      />
    </Paper>
  );
};

BottomNavigation.propTypes = {
  clickHandler: PropTypes.func.isRequired,
  active: PropTypes.string.isRequired,
  lineColContainerRef: PropTypes.exact({
    current: PropTypes.any,
  }).isRequired,
};

export default BottomNavigation;

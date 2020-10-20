/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useContext, useRef, useEffect} from 'react';
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import {RightNavs} from './Constants';
import {IdeBuildContext, IdeCompletedBuildsContext} from './Contexts';

const useStyles = makeStyles((theme) => ({
  nav: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    position: 'fixed',
    right: 0,
    top: 48,
    bottom: 22,
    color: theme.palette.background.contrastText,
    backgroundColor: theme.palette.background.navigations,
    zIndex: theme.zIndex.appBar,
    width: 22,
    writingMode: 'vertical-rl',
  },
  wrapper: {
    width: '100%',
  },
  typography: {
    marginTop: 5,
    width: '100%',
  },
  link: {
    cursor: 'pointer',
    padding: '5px 0',
    width: '100%',
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

const RightNavigation = (props) => {
  const {clickHandler, active} = props;
  const build = useContext(IdeBuildContext);
  const completedBuilds = useContext(IdeCompletedBuildsContext);
  const openedLivePreviewOncePerBuild = useRef(false);
  const classes = useStyles();

  useEffect(() => {
    if (!build.runOngoing && openedLivePreviewOncePerBuild.current) {
      openedLivePreviewOncePerBuild.current = false;
    }
  }, [build.runOngoing]);

  useEffect(() => {
    if (
      build.runOngoing &&
      build.sessionId &&
      active !== RightNavs.LIVE_PREVIEW &&
      !openedLivePreviewOncePerBuild.current
    ) {
      clickHandler(RightNavs.LIVE_PREVIEW);
      openedLivePreviewOncePerBuild.current = true;
    }
  }, [active, clickHandler, build.runOngoing, build.sessionId]);

  return (
    <Paper
      square
      component="div"
      elevation={4}
      aria-label="Right Navigation"
      className={classes.nav}>
      {completedBuilds && completedBuilds.length ? (
        <Box display="flex" className={classes.wrapper} style={{paddingTop: 8}}>
          <Typography variant="caption" className={classes.typography}>
            <Link
              color="inherit"
              onClick={() => clickHandler(RightNavs.COMPLETED_BUILDS)}
              classes={{root: classes.link}}
              className={clsx(
                classes.link,
                classes.linkTab,
                active === RightNavs.COMPLETED_BUILDS
                  ? classes.activeTab
                  : classes.linkHover
              )}>
              Completed Builds
            </Link>
          </Typography>
        </Box>
      ) : null}
      <Box display="flex" className={classes.wrapper}>
        <Typography variant="caption" className={classes.typography}>
          <Link
            color="inherit"
            onClick={() => clickHandler(RightNavs.LIVE_PREVIEW)}
            classes={{root: classes.link}}
            className={clsx(
              classes.link,
              classes.linkTab,
              active === RightNavs.LIVE_PREVIEW
                ? classes.activeTab
                : classes.linkHover
            )}>
            Live Preview
          </Link>
        </Typography>
      </Box>
      <Box display="flex" flex={1} className={classes.wrapper} />
      <Box
        display="flex"
        className={classes.wrapper}
        style={{paddingBottom: 8}}>
        <Typography variant="caption" className={classes.typography}>
          <Link
            color="inherit"
            onClick={() => clickHandler(RightNavs.DOCUMENTATION)}
            classes={{root: classes.link}}
            className={clsx(
              classes.link,
              classes.linkTab,
              active === RightNavs.DOCUMENTATION
                ? classes.activeTab
                : classes.linkHover
            )}>
            Documentation
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

RightNavigation.propTypes = {
  clickHandler: PropTypes.func.isRequired,
  active: PropTypes.string.isRequired,
};

export default RightNavigation;

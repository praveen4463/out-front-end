import React, {useContext, useMemo, useCallback} from 'react';
import AppBar from '@material-ui/core/AppBar';
import ToolBar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import BuildIcon from '@material-ui/icons/Build';
import StopIcon from '@material-ui/icons/Stop';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import {useHotkeys} from 'react-hotkeys-hook';
import MainMenu from './MainMenu';
import EditMenu from './EditMenu';
import HelpMenu from '../HelpMenu';
import UserAvatar from '../UserAvatar';
import Tooltip from '../TooltipCustom';
import ProjectSelector from '../components/ProjectSelector';
import {
  IdeBuildContext,
  IdeDryContext,
  IdeParseContext,
  IdeDispatchContext,
  IdeFilesContext,
} from './Contexts';
import {getBuildStoppingAction} from '../actions/actionCreators';
import {getDryStoppingAction} from './actionCreators';
import {BUILD_NEW_RUN} from '../actions/actionTypes';
import {DRY_START_RUN, PARSE_START_RUN} from './actionTypes';
import {getOrderedVersionsFromFiles} from '../reducers/common';
import {filterCurrentVersions} from './common';

const useStyles = makeStyles((theme) => ({
  fontSizeSmall: {
    fontSize: '1.00rem',
  },
  fontSizeEditIcon: {
    fontSize: '1.13rem',
  },
  appBarRoot: {
    backgroundColor: theme.palette.background.navigations,
  },
  toolbarRoot: {
    alignItems: 'center',
  },
  toolbarGutters: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

const TopNavigation = () => {
  const dispatch = useContext(IdeDispatchContext);
  const files = useContext(IdeFilesContext);
  const build = useContext(IdeBuildContext);
  const dry = useContext(IdeDryContext);
  const parse = useContext(IdeParseContext);
  const classes = useStyles();

  const anyFiles = useMemo(
    () =>
      files &&
      files.result.length &&
      files.result.some((fid) => files.entities.files[fid].loadToTree),
    [files]
  );

  const runButtonsDisabled = useMemo(
    () => build.runOngoing || dry.runOngoing || parse.runOngoing || !anyFiles,
    [build.runOngoing, dry.runOngoing, anyFiles, parse.runOngoing]
  );

  const stopDisabled = useMemo(() => build.stopping || dry.stopping, [
    build.stopping,
    dry.stopping,
  ]);

  const handleBuild = useCallback(() => {
    if (runButtonsDisabled) {
      return;
    }
    dispatch({
      type: BUILD_NEW_RUN,
    });
  }, [dispatch, runButtonsDisabled]);

  const handleDry = useCallback(() => {
    if (runButtonsDisabled) {
      return;
    }
    dispatch({
      type: DRY_START_RUN,
      payload: {
        versionIds: filterCurrentVersions(
          getOrderedVersionsFromFiles(files),
          files.entities.versions
        ),
      },
    });
  }, [dispatch, files, runButtonsDisabled]);

  const handleParse = useCallback(() => {
    if (runButtonsDisabled) {
      return;
    }
    dispatch({
      type: PARSE_START_RUN,
      payload: {
        versionIds: filterCurrentVersions(
          getOrderedVersionsFromFiles(files),
          files.entities.versions
        ),
      },
    });
  }, [dispatch, files, runButtonsDisabled]);

  const handleStop = useCallback(() => {
    if (stopDisabled) {
      return;
    }
    if (build.runOngoing) {
      dispatch(getBuildStoppingAction(true));
    } else if (dry.runOngoing) {
      dispatch(getDryStoppingAction(true));
    }
  }, [build.runOngoing, dispatch, dry.runOngoing, stopDisabled]);

  useHotkeys('b', handleBuild, {}, [handleBuild]);
  useHotkeys('p', handleParse, {}, [handleParse]);
  useHotkeys('d', handleDry, {}, [handleDry]);
  useHotkeys('ctrl+c', handleStop, {}, [handleStop]);

  return (
    <AppBar classes={{root: classes.appBarRoot}}>
      {/* ToolBar is a flexbox and default alignItems=center. When it's center,
          items don't strech to full height but will remain in original and
          align vertically to center. If we want full height, we will need to
          assign some different value so that default is overriden (note that
          this property is not required for items in flexbox to strech).
          We want all our header items to take full height so that menu and
          tooltip open on the same plane. To do that, first set Toolbar's
          default align to something else, so that all items take full height,
          and also wrap every icon in a flexbox so that we can also strech
          the actual icon to 100% height and center the icon (as the parent box
          isn't centering the items), otherwise elements appearing on bottom
          won't be seeing the full strech (div is streched but not icon, we want
          icon to take the full height of it's container).
          Since IconButton strech to full height on it's own we don't need to
          do anything above for the icons but for things like TextInput in
          header this is required as long as we want a tooltip on it as it has
          to be in same plane with others in header. */}
      <ToolBar
        variant="dense"
        classes={{root: classes.toolbarRoot, gutters: classes.toolbarGutters}}>
        <div>
          <MainMenu />
        </div>
        <Tooltip title="Run Build B">
          <span>
            <IconButton
              aria-label="Run Build"
              disabled={runButtonsDisabled}
              color="primary"
              onClick={handleBuild}>
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Parse All P">
          <span>
            <IconButton
              aria-label="Parse"
              disabled={runButtonsDisabled}
              color="primary"
              onClick={handleParse}>
              <BuildIcon
                fontSize="small"
                classes={{fontSizeSmall: classes.fontSizeSmall}}
              />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Dry Run All D">
          <span>
            <IconButton
              aria-label="Dry Run"
              disabled={runButtonsDisabled}
              color="primary"
              onClick={handleDry}>
              <CheckCircleIcon
                fontSize="small"
                classes={{fontSizeSmall: classes.fontSizeSmall}}
              />
            </IconButton>
          </span>
        </Tooltip>
        {/* build run can't be stopped before session is created, this is so
        because once we request session, machine starts to run build after it is
        acquired, if we want to stop before getting session in response, machine
        will still run entire build, user may think they cancelled build but it
        ran. So stopping after session guarantees it gets stopped asap.
        We can implement stop before session as well by putting an entry in db
        that will be checked before starting session and if found true, build
        is stopped but not doing it for now, this is a TODO */}
        {/* For now parsing has no option to stop */}
        {(build.runOngoing && build.sessionId) || dry.runOngoing ? (
          <Tooltip title="Stop ^C">
            <span>
              <IconButton
                aria-label="Stop"
                disabled={stopDisabled}
                onClick={handleStop}>
                <StopIcon
                  color={stopDisabled ? 'disabled' : 'error'}
                  fontSize="small"
                />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
        <EditMenu
          editIconClasses={{fontSizeSmall: classes.fontSizeEditIcon}}
          openBuildConfig={build.openBuildConfig}
          anyFiles={anyFiles}
        />
        <Box mx={1}>
          <ProjectSelector />
        </Box>
        <Box flexGrow={1} />
        <HelpMenu />
        <div>
          <UserAvatar />
        </div>
      </ToolBar>
    </AppBar>
  );
};

export default TopNavigation;

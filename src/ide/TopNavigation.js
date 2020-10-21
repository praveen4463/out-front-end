import React, {useContext} from 'react';
import AppBar from '@material-ui/core/AppBar';
import ToolBar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import BuildIcon from '@material-ui/icons/Build';
import StopIcon from '@material-ui/icons/Stop';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import MainMenu from './MainMenu';
import EditMenu from './EditMenu';
import HelpMenu from './HelpMenu';
import UserAvatar from './UserAvatar';
import Tooltip from '../TooltipCustom';
import ProjectSelector from './ProjectSelector';
import {
  IdeBuildContext,
  IdeDryContext,
  IdeParseContext,
  IdeDispatchContext,
  IdeFilesContext,
} from './Contexts';
import {getBuildStoppingAction} from '../actions/actionCreators';
import {getDryStoppingAction, getParseStoppingAction} from './actionCreators';
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
    alignItems: 'stretch',
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

  const handleBuild = () => {
    dispatch({
      type: BUILD_NEW_RUN,
    });
  };

  const handleDry = () => {
    dispatch({
      type: DRY_START_RUN,
      payload: {
        versionIds: filterCurrentVersions(
          getOrderedVersionsFromFiles(files),
          files.entities.versions
        ),
      },
    });
  };

  const handleParse = () => {
    dispatch({
      type: PARSE_START_RUN,
      payload: {
        versionIds: filterCurrentVersions(
          getOrderedVersionsFromFiles(files),
          files.entities.versions
        ),
      },
    });
  };

  const handleStop = () => {
    if (build.runOngoing) {
      dispatch(getBuildStoppingAction(true));
    } else if (dry.runOngoing) {
      dispatch(getDryStoppingAction(true));
    } else if (parse.runOngoing) {
      dispatch(getParseStoppingAction(true));
    }
  };

  const runButtonsDisabled = () => {
    return build.runOngoing || dry.runOngoing || parse.runOngoing;
  };

  const stopDisabled = () => {
    return build.stopping || dry.stopping || parse.stopping;
  };

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
        <Tooltip title="Run Build R">
          <IconButton
            aria-label="Run Build"
            disabled={runButtonsDisabled()}
            color="primary"
            onClick={handleBuild}>
            <PlayArrowIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Parse All P">
          <IconButton
            aria-label="Parse"
            disabled={runButtonsDisabled()}
            color="primary"
            onClick={handleParse}>
            <BuildIcon
              fontSize="small"
              classes={{fontSizeSmall: classes.fontSizeSmall}}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="Dry Run All ⇧D">
          <IconButton
            aria-label="Dry Run"
            disabled={runButtonsDisabled()}
            color="primary"
            onClick={handleDry}>
            <CheckCircleIcon
              fontSize="small"
              classes={{fontSizeSmall: classes.fontSizeSmall}}
            />
          </IconButton>
        </Tooltip>
        {(build.runOngoing && build.sessionId) ||
        dry.runOngoing ||
        parse.runOngoing ? (
          <Tooltip title="Stop ^C">
            <IconButton
              aria-label="Stop"
              disabled={stopDisabled()}
              onClick={handleStop}>
              <StopIcon
                color={stopDisabled() ? 'disabled' : 'error'}
                fontSize="small"
              />
            </IconButton>
          </Tooltip>
        ) : null}
        <EditMenu
          editIconClasses={{fontSizeSmall: classes.fontSizeEditIcon}}
          openBuildConfig={build.openBuildConfig}
        />
        <Box
          display="flex"
          flex={1}
          justifyContent="center"
          flexWrap="wrap"
          mx={1}>
          <ProjectSelector />
        </Box>
        <HelpMenu />
        <div>
          <UserAvatar />
        </div>
      </ToolBar>
    </AppBar>
  );
};

export default TopNavigation;

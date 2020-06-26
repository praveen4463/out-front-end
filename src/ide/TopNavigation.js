import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import ToolBar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import BugReportIcon from '@material-ui/icons/BugReport';
import StopIcon from '@material-ui/icons/Stop';
import BuildIcon from '@material-ui/icons/Build';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import MainMenu from './MainMenu';
import EditMenu from './EditMenu';
import HelpMenu from './HelpMenu';
import TestVersionManager from './TestVersionManager';
import UserAvatar from './UserAvatar';
import Tooltip from '../TooltipCustom';

const TopNavigation = (props) => {
  const {testVersionDetail, newVersionHandler} = props;
  return (
    <AppBar color="default">
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
      <ToolBar variant="dense" style={{alignItems: 'stretch'}}>
        <div className="MuiIconButton-edgeStart">
          <MainMenu />
        </div>
        <Tooltip title="Run Build R">
          <IconButton aria-label="Run Build">
            <PlayArrowIcon color="primary" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Start Debug Mode D">
          <IconButton aria-label="Start Debug Mode">
            <BugReportIcon color="primary" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Stop Build ^C">
          <IconButton aria-label="Stop Build">
            <StopIcon color="disabled" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Parse P">
          <IconButton aria-label="Parse">
            <BuildIcon color="primary" fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Dry Run ⇧D">
          <IconButton aria-label="Dry Run">
            <CheckCircleIcon color="secondary" fontSize="small" />
          </IconButton>
        </Tooltip>
        <EditMenu />
        <Box display="flex" flex={1} justifyContent="center" mx={1}>
          <TestVersionManager
            testVersionDetail={testVersionDetail}
            newVersionHandler={newVersionHandler}
          />
        </Box>
        <HelpMenu />
        <div className="MuiIconButton-edgeEnd">
          <UserAvatar />
        </div>
      </ToolBar>
    </AppBar>
  );
};

TopNavigation.propTypes = {
  testVersionDetail: PropTypes.exact({
    testId: PropTypes.number,
    testVersionId: PropTypes.number,
    testName: PropTypes.string,
    testVersion: PropTypes.string,
  }).isRequired,
  newVersionHandler: PropTypes.func.isRequired,
};

export default TopNavigation;

import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import PropTypes from 'prop-types';
import {
  IdeDispatchContext,
  IdeFilesContext,
  IdeEditorContext,
} from '../Contexts';
import TabContent from './TabContent';
import TabPanel from './TabPanel';
import {EDR_SWITCH_TAB} from '../actionTypes';

const useStyle = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.background.default,
  },
  tabBar: {
    backgroundColor: theme.palette.background.paperOnDefault,
  },
  tabs: {
    minHeight: theme.spacing(4),
  },
  tab: {
    padding: 0,
    maxHeight: theme.spacing(4),
    minHeight: theme.spacing(4),
    minWidth: 'fit-content',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(0.5),
    borderRight: `1px solid ${theme.palette.border.light}`,
    textTransform: 'none',
    '&$selected': {
      borderBottom: `1px solid ${theme.palette.secondary.main}`,
    },
  },
  selected: {},
  indicator: {
    height: '0px',
  },
  textColorInherit: {
    opacity: 'unset',
  },
}));

const Editor = React.memo((props) => {
  const dispatch = useContext(IdeDispatchContext);
  const files = useContext(IdeFilesContext);
  const {tabs} = useContext(IdeEditorContext);
  const classes = useStyle();
  const {lineColContainerRef} = props;

  const handleChange = (e, value) => {
    const versionId = value;
    if (tabs.selectedTabVersionId === versionId) {
      // Looks like an invalid (possibly a bug) change event fired because
      // tab didn't change.
      return;
    }
    dispatch({type: EDR_SWITCH_TAB, payload: {versionId}});
  };

  const getTabPanel = (versionId) => {
    const et = files.entities;
    const version = et.versions[versionId];
    if (!version) {
      return null;
    }
    const test = et.tests[version.testId];
    const file = et.files[test.fileId];
    return (
      <TabPanel
        version={version}
        testName={test.name}
        fileName={file.name}
        lineColContainerRef={lineColContainerRef}
      />
    );
  };

  const getTab = (tabMap) => {
    const [versionId, tab] = tabMap;
    const et = files.entities;
    const version = et.versions[versionId];
    const test = et.tests[version.testId];
    const file = et.files[test.fileId];
    const tabContent = (
      <TabContent
        tab={tab}
        versionName={version.name}
        testName={test.name}
        fileName={file.name}
      />
    );
    return (
      <Tab
        value={versionId}
        key={versionId}
        label={tabContent}
        id={`scrollable-auto-tab-${versionId}`}
        aria-controls={`scrollable-auto-tabpanel-${versionId}`}
        disableRipple
        disableFocusRipple
        classes={{
          root: classes.tab,
          selected: classes.selected,
          textColorInherit: classes.textColorInherit,
        }}
      />
    );
  };

  return (
    <div className={classes.root}>
      {/* if editor.tabs are there, files must have something too */}
      {tabs && Array.isArray(tabs.maps) && tabs.maps.length > 0 && (
        <>
          <Box
            position="static"
            display="flex"
            flexDirection="row"
            className={classes.tabBar}
            boxShadow={3}>
            <Tabs
              value={tabs.selectedTabVersionId}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="tabbed layout of test versions"
              classes={{root: classes.tabs, indicator: classes.indicator}}>
              {tabs.maps.map((m) => getTab(m))}
            </Tabs>
          </Box>
          {getTabPanel(tabs.selectedTabVersionId)}
        </>
      )}
    </div>
  );
});

Editor.propTypes = {
  lineColContainerRef: PropTypes.exact({
    current: PropTypes.any,
  }).isRequired,
};

export default Editor;

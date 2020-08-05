import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import {
  IdeDispatchContext,
  IdeFilesContext,
  IdeEditorContext,
} from '../Contexts';
import TabContent from './TabContent';
import TabPanel from './TabPanel';
import {EDR_SWITCH_TAB} from '../actionTypes';

const useStyle = makeStyles((theme) => ({
  selected: {},
  root: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.default,
  },
  tabs: {
    minHeight: theme.spacing(4),
  },
  tab: {
    padding: 0,
    maxHeight: theme.spacing(4),
    minHeight: theme.spacing(4),
    borderRight: `1px solid ${theme.palette.border.dark}`,
    textTransform: 'none',
    '&$selected > fontSizeSmall': {
      opacity: 1,
    },
  },
  indicator: {
    height: '1px',
  },
}));

const Editor = React.memo(() => {
  const dispatch = useContext(IdeDispatchContext);
  const files = useContext(IdeFilesContext);
  const {tabs} = useContext(IdeEditorContext);
  const classes = useStyle();

  const handleChange = (e, value) => {
    dispatch({type: EDR_SWITCH_TAB, payload: {versionId: value}});
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
      <TabPanel version={version} testName={test.name} fileName={file.name} />
    );
  };

  const getTab = (tabMap) => {
    const [versionId, tab] = tabMap;
    const et = files.entities;
    const version = et.versions[versionId];
    // it could be possible when explorer items are deleted, that change it
    // context is applied separate with the change in editor context, which may
    // result in version in editor with no matching version in files. This check
    // makes sure we don't render in such situation.
    if (!version) {
      return null;
    }
    const test = et.tests[version.testId];
    const file = et.files[test.fileId];
    const tabContent = (
      <TabContent
        versionId={versionId}
        versionName={version.name}
        temporary={tab.temporary}
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
        classes={{root: classes.tab, selected: classes.selected}}
      />
    );
  };

  return (
    <div className={classes.root}>
      {/* if editor.tabs are there, files must have something too */}
      {tabs && Array.isArray(tabs.maps) && tabs.maps.length > 0 && (
        <>
          <Box position="static" display="flex" flexDirection="row">
            <Tabs
              value={tabs.selectedTabVersionId}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="off"
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

export default Editor;

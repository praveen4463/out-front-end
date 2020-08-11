import React from 'react';
import {render, screen} from '@testing-library/react';
import {ThemeProvider} from '@material-ui/core/styles';
import TabContent from './TabContent';
import Tab from './model';
import darkTheme from '../Themes';

const tab = new Tab(1, true, true);
const fileName = 'Utils Test';

test('tab text truncates when longer than allowed', () => {
  const versionName = 'version1';
  const testName = 'opens up url and logs me in';
  render(
    <ThemeProvider theme={darkTheme}>
      <TabContent
        tab={tab}
        versionName={versionName}
        testName={testName}
        fileName={fileName}
      />
    </ThemeProvider>
  );
  expect(screen.getByTestId('tab')).toHaveTextContent(
    'opens up url and logs m../vers..'
  );
});

test('tab text does not truncate when within allowed limit', () => {
  const versionName = 'v1';
  const testName = 'opens up url and log in';
  render(
    <ThemeProvider theme={darkTheme}>
      <TabContent
        tab={tab}
        versionName={versionName}
        testName={testName}
        fileName={fileName}
      />
    </ThemeProvider>
  );
  expect(screen.getByTestId('tab')).toHaveTextContent(
    `${testName}/${versionName}`
  );
});

test('tab has full path title', () => {
  const versionName = 'v1';
  const testName = 'opens up url and logs me in';
  render(
    <ThemeProvider theme={darkTheme}>
      <TabContent
        tab={tab}
        versionName={versionName}
        testName={testName}
        fileName={fileName}
      />
    </ThemeProvider>
  );
  expect(screen.getByTestId('tab')).toHaveAttribute(
    'title',
    `${fileName}/${testName}/${versionName}`
  );
});

// Not doing event based test, will be done in components that contains this one.

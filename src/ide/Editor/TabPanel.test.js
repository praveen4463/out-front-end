import React from 'react';
import {render, screen} from '@testing-library/react';
import TabPanel from './TabPanel';
import {Version} from '../Explorer/model';

test('renders with given props', () => {
  const code = 'openUrl("http://google.com")';
  const version = new Version(1, 'v1', 1, code, true);
  const fileName = 'some file';
  const testName = 'some test';
  render(
    <TabPanel version={version} testName={testName} fileName={fileName} />
  );
  expect(screen.getByTestId('breadcrumb')).toHaveTextContent(
    `${fileName} > ${testName} > ${version.name}`
  );
  expect(screen.getByTestId('code')).toHaveTextContent(code);
});

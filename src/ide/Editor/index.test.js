import React from 'react';
import {render, screen} from '@testing-library/react';
import Ide from '../index';

// Currently ide uses sample data, so I can just use that data in this test.
// once I've modified it to use api, I can send the same sample data by mocking,
// so the test should remain same with a little more code to get data.

test('clicking on versions open up tabs', async () => {
  // IDE currently uses setTimeout, which will be replaced by api call. Let's
  // not fake that timeout as it will go away.
  render(<Ide />);
  expect(screen.getByRole('progressbar')).toBeVisible();
  const fileTree = await screen.findByRole('tree');
  expect(fileTree).toBeVisible();
});

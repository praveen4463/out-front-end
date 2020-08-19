import React from 'react';
import {
  render,
  screen,
  getByRole,
  getAllByRole,
  getNodeText,
  getByTestId,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Ide from '../index';
import {ExplorerItemType as EIT} from '../Constants';

// Currently ide uses sample data, so I can just use that data in this test.
// once I've modified it to use api, I can send the same sample data by mocking,
// so the test should remain same with a little more code to get data.

const getTabTitle = (fileName, testName, versionName) => {
  return `${fileName}/${testName}/${versionName}`;
};

const getItemNameTestId = (itemType) => {
  return `${itemType}-treeItemName`;
};

let tests;
let fileName;
beforeEach(async () => {
  // IDE currently uses setTimeout, which will be replaced by api call. Let's
  // not fake that timeout as it will go away.
  render(<Ide />);
  expect(screen.getByRole('progressbar')).toBeVisible();
  // role for ul https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element
  // but since we've given explicit role, that has to be used.
  const fileTree = await screen.findByRole('tree');
  expect(fileTree).toBeVisible();
  const firstFile = getByRole(fileTree, 'treeitem');
  fileName = getNodeText(getByTestId(firstFile, getItemNameTestId(EIT.FILE)));
  userEvent.click(firstFile.firstElementChild);
  tests = getAllByRole(firstFile, 'treeitem');
});

test('clicking on a version open up temporary tab', () => {
  const test = tests[0];
  const testName = getNodeText(getByTestId(test, getItemNameTestId(EIT.TEST)));
  userEvent.click(test.firstElementChild);
  const versions = getAllByRole(test, 'treeitem');
  const version = versions[0];
  const versionName = getNodeText(
    getByTestId(version, getItemNameTestId(EIT.VERSION))
  );
  userEvent.click(version.firstElementChild);
  const tab = screen.getByTitle(getTabTitle(fileName, testName, versionName));
  expect(tab.firstElementChild).toHaveStyle('font-style: italic');
});

// !!! Note, tests are being written in ZWL now because I'm finding I'm doing
// exact same thing while testing using testing-library and it is much less
// efficient than selenium. We can still do tests using jest or this library
// for code that requires mocking etc but most of the test should go into ZWL.

import PropTypes from 'prop-types';
import {Os, Browsers, Platforms, ApiStatuses, TestStatus} from './Constants';
import chrome from './icons/chrome.png';
import firefox from './icons/firefox.png';
import ie from './icons/ie.png';
import windowsIcon from './icons/windows.png';

export const getSortedNames = (ids, propMapping, propName = 'name') => {
  const pairs = ids.map((id) => [id, propMapping[id][propName]]);
  // The reference referenceStr should be string type, since our names comes
  // via text inputs, it's always string and doesn't need conversion or
  // string concat to make it a string.
  // Note: localeCompare is by far the best for string comparison, reference:
  // https://stackoverflow.com/a/26295229/1624454
  pairs.sort((a, b) => a[1].localeCompare(b[1]));
  // no locale specific options for now, TODO: for later.
  return pairs.map((p) => p[0]);
};

export const getOsDisplayName = (os) => {
  switch (os) {
    case Os.WIN10.VALUE:
      return Os.WIN10.DISPLAY_NAME;
    case Os.WIN8_1.VALUE:
      return Os.WIN8_1.DISPLAY_NAME;
    default:
      throw new Error(`Unrecognized OS ${os}`);
  }
};

export const getPlatformByOs = (os) => {
  switch (os) {
    case Os.WIN10.VALUE:
      return Os.WIN10.PLATFORM;
    case Os.WIN8_1.VALUE:
      return Os.WIN8_1.PLATFORM;
    default:
      throw new Error(`Unrecognized OS ${os}`);
  }
};

export const getPlatformDisplayName = (platform) => {
  switch (platform) {
    case Platforms.WINDOWS.VALUE:
      return Platforms.WINDOWS.DISPLAY_NAME;
    default:
      throw new Error(`Unrecognized platform ${platform}`);
  }
};

export const getBrowserDisplayName = (browser) => {
  switch (browser) {
    case Browsers.CHROME.VALUE:
      return Browsers.CHROME.DISPLAY_NAME;
    case Browsers.FIREFOX.VALUE:
      return Browsers.FIREFOX.DISPLAY_NAME;
    case Browsers.IE.VALUE:
      return Browsers.IE.DISPLAY_NAME;
    default:
      throw new Error(`Unrecognized browser ${browser}`);
  }
};

export const getBrowserIcon = (browser) => {
  switch (browser) {
    case Browsers.CHROME.VALUE:
      return chrome;
    case Browsers.FIREFOX.VALUE:
      return firefox;
    case Browsers.IE.VALUE:
      return ie;
    default:
      throw new Error(`Unrecognized browser ${browser}`);
  }
};

export const getOsIcon = (os) => {
  switch (os) {
    case Os.WIN10.VALUE:
    case Os.WIN8_1.VALUE:
      return windowsIcon;
    default:
      throw new Error(`Unrecognized os ${os}`);
  }
};

export const getContextObjShape = () => {
  return {
    $$typeof: PropTypes.symbol,
  };
};

export const getNoOfLines = (text) => {
  if (typeof text !== 'string' || !text.length) {
    return 0;
  }
  const lines = text.match(/\n/g);
  if (!lines) {
    return 1;
  }
  return lines.length + 1; // the last line doesn't have a new line char so adding that
};

export const invokeOnApiCompletion = (response, onSuccess, onError) => {
  if (response.status === ApiStatuses.SUCCESS) {
    onSuccess(response);
  } else if (response.status === ApiStatuses.FAILURE) {
    onError(response);
  }
};

export const getShotName = (sessionId, buildKey, id) => {
  return `${sessionId}-${buildKey}-${id}.png`;
};

export const getShotNameParts = (shotName) => {
  const lastHyphenAt = shotName.lastIndexOf('-');
  const secondLastHyphenAt = shotName.lastIndexOf('-', lastHyphenAt - 1);
  const sessionId = shotName.substring(0, secondLastHyphenAt);
  const buildKey = shotName.substring(secondLastHyphenAt + 1, lastHyphenAt);
  const shotId = shotName.substring(
    lastHyphenAt + 1,
    shotName.lastIndexOf('.')
  );
  return [sessionId, buildKey, shotId];
};

export const getTestStatusDisplayName = (testStatus) => {
  switch (testStatus) {
    case TestStatus.RUNNING:
      return 'Running';
    case TestStatus.SUCCESS:
      return 'Passed';
    case TestStatus.ERROR:
      return 'Failed';
    case TestStatus.ABORTED:
      return 'Aborted';
    case TestStatus.STOPPED:
      return 'Stopped';
    default:
      throw new Error(`Unrecognized status ${testStatus}`);
  }
};

export const getVersionNamePath = (fileName, testName, versionName) =>
  `${fileName} > ${testName} > ${versionName}`;

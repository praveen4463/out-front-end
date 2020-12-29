import PropTypes from 'prop-types';
import {truncate} from 'lodash-es';
import axios from 'axios';
import {
  Os,
  Browsers,
  Platforms,
  ApiStatuses,
  TestStatus,
  PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
  Endpoints,
} from './Constants';
import chrome from './icons/chrome.png';
import firefox from './icons/firefox.png';
import ie from './icons/ie.png';
import windowsIcon from './icons/windows.png';

// detects runtime's locale while building collator.
export const getNewIntlComparer = () => new Intl.Collator().compare;

export const getSortedNames = (ids, propMapping, propName = 'name') => {
  const pairs = ids.map((id) => [id, propMapping[id][propName]]);
  // The reference referenceStr should be string type, since our names comes
  // via text inputs, it's always string and doesn't need conversion or
  // string concat to make it a string.
  pairs.sort((a, b) => getNewIntlComparer()(a[1], b[1]));
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

export const getApiError = (error) => {
  return {
    status: ApiStatuses.FAILURE,
    error: {
      reason: error,
    },
  };
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

export const getTruncated = (value, length) => {
  return truncate(value, {
    length,
  });
};

export const getShortCurrentMonthName = () => {
  return new Intl.DateTimeFormat('en-US', {month: 'short'}).format(new Date());
};

export const getFileSizeInUnit = (size) => {
  if (size < 1024) {
    return `${size} bytes`;
  }
  if (size < 1048576) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1048576).toFixed(1)} MB`;
};

export const getQs = () => {
  return new URLSearchParams(document.location.search);
};

export const completeRelativeUrl = (relative) => {
  return `${relative}${document.location.search}`;
};

export const getNumberParamFromUrl = (param) => {
  const pId = Number(getQs().get(param));
  if (Number.isInteger(pId)) {
    return pId;
  }
  return null;
};

export const handleApiError = (error, showError, message) => {
  console.log('handleApiError', error.response, error.request);
  // TODO: send to sentry from here
  if (error.response) {
    showError(`${message}, ${error.response.data.message}`);
  } else if (error.request) {
    // !NOTE: Any error thrown within axios, like timeout error will land up here as well,
    // but we're shown server unreachable error. This may be fine for now but keep
    // an eye on errors.
    const errorMsg = navigator.onLine
      ? 'server is unreachable. Please try in a few minutes or contact us.'
      : 'network error';
    showError(`${message}, ${errorMsg}`);
  } else {
    // throw so that error boundary could catch as this is unrecoverable error.
    throw new Error(error.message);
  }
};

export const prepareEndpoint = (endpoint, projectId, pathVar) => {
  let formattedEndpoint = endpoint;
  if (formattedEndpoint.includes(PROJECT_ID_ENDPOINT_VAR_TEMPLATE)) {
    formattedEndpoint = formattedEndpoint.replace(
      PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
      projectId
    );
  }
  if (pathVar) {
    formattedEndpoint = `${formattedEndpoint}/${pathVar}`;
  }
  return formattedEndpoint;
};

/**
 * Fetches files with tests from api filtered by te given fileIds
 * @param {fileIds} fileIds Must be comma separated string if multiple, otherwise integer
 * @param {projectId} projectId The zl projectId
 */
export const getFilesWithTests = (fileIds, projectId) => {
  return axios(prepareEndpoint(Endpoints.FILES_WITH_TESTS, projectId), {
    params: {
      fileIdsFilter: fileIds,
    },
  });
};

export const fromJson = (Ctor, json) => {
  return Object.assign(new Ctor(), json);
};

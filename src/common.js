import React from 'react';
import PropTypes from 'prop-types';
import {truncate} from 'lodash-es';
import axios from 'axios';
import {captureException} from '@sentry/react';
import queryString from 'query-string';
import localforage from 'localforage';
import {
  Os,
  Browsers,
  Platforms,
  TestStatus,
  PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
  VERSION_ID_ENDPOINT_VAR_TEMPLATE,
  BUILD_ID_ENDPOINT_VAR_TEMPLATE,
  Endpoints,
  PLATFORM_ENDPOINT_VAR_TEMPLATE,
  CODE_ENDPOINT_VAR_TEMPLATE,
  EMAIL_ENDPOINT_VAR_TEMPLATE,
  LocalStorageKeys,
  PASSWORD_RESET_ID_ENDPOINT_VAR_TEMPLATE,
  EMAIL_CHANGE_ID_ENDPOINT_VAR_TEMPLATE,
} from './Constants';
import chrome from './icons/chrome.png';
import firefox from './icons/firefox.png';
import ie from './icons/ie.png';
import windowsIcon from './icons/windows.png';
import Application from './config/application';
import {UserInLocalStorage} from './model';

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

export const getNumberParamFromUrl = (param, locationSearch) => {
  const p = queryString.parse(locationSearch ?? document.location.search, {
    parseNumbers: true,
  });
  return p[param];
};

export const isInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num);
};

export const handleApiError = (error, showError, message) => {
  console.log('handleApiError', error.response, error.request);
  if (error.response) {
    let errorMsg = error.response.data.message;
    if (!errorMsg || !errorMsg.trim().length) {
      // when there is no message, it could be an error thrown by proxy,
      // read response status and deduce some message.
      const {status} = error.response;
      switch (status) {
        case 401:
          errorMsg = 'User is not authorized';
          break;
        default:
          throw new Error('Got blank error message in response');
      }
    }
    showError(
      message && message.trim().length ? `${message}, ${errorMsg}` : errorMsg
    );
    captureException(error);
  } else if (error.request) {
    // !NOTE: Any error thrown within axios, like timeout error will land up here as well,
    // but we're shown server unreachable error. This may be fine for now but keep
    // an eye on errors.
    const errorMsg = navigator.onLine
      ? 'server is unreachable. Please try in a few minutes or contact us.'
      : 'network error';
    showError(
      message && message.trim().length ? `${message}, ${errorMsg}` : errorMsg
    );
    captureException(error);
  } else {
    // log this with tags and see whether wee need to redirect user to a custom
    // error page if this happens because error boundary won't catch it.
    captureException(error, {
      tags: {
        throwing: true,
        unrecoverable: true,
        location: 'HandleApiError',
      },
    });
    // throw as this is unrecoverable error.
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

export const getNewBuildEndpoint = (projectId) => {
  return Endpoints.NEW_BUILD.replace(
    PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
    projectId
  );
};

export const getStopBuildEndpoint = (buildId) => {
  return Endpoints.STOP_BUILD.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);
};

export const getBuildStatusEndpoint = (buildId, versionId) => {
  return Endpoints.BUILD_STATUS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  ).replace(VERSION_ID_ENDPOINT_VAR_TEMPLATE, versionId);
};

export const getLatestShotEndpoint = (buildId) => {
  return Endpoints.LATEST_SHOT.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);
};

export const getShotBasicDetailsEndpoint = (buildId) => {
  return Endpoints.SHOT_BASIC_DETAILS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getBrowsersEndpoint = (platform) => {
  return Endpoints.BROWSERS.replace(PLATFORM_ENDPOINT_VAR_TEMPLATE, platform);
};

export const getBuildBasicDetailsEndpoint = (buildId) => {
  return Endpoints.BASIC_BUILD_DETAILS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getCapturedBuildCapabilityEndpoint = (buildId) => {
  return Endpoints.CAPTURED_BUILD_CAPABILITY.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getCapturedBuildVarsEndpoint = (buildId) => {
  return Endpoints.CAPTURED_BUILD_VARS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getCapturedGlobalVarsEndpoint = (buildId) => {
  return Endpoints.CAPTURED_GLOBAL_VARS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getRunnerPreferencesEndpoint = (buildId) => {
  return Endpoints.RUNNER_PREFERENCES.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getDriverLogsEndpoint = (buildId) => {
  return Endpoints.DRIVER_LOGS.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);
};

export const getPerformanceLogsEndpoint = (buildId) => {
  return Endpoints.PERFORMANCE_LOGS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getElementShotNamesEndpoint = (buildId) => {
  return Endpoints.ELEMENT_SHOT_NAMES.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );
};

export const getValidateEmailVerificationEndpoint = (code) => {
  return Endpoints.VALIDATE_EMAIL_VERIFICATION.replace(
    CODE_ENDPOINT_VAR_TEMPLATE,
    code
  );
};

export const getSingleUserEndpoint = (email) => {
  return Endpoints.SINGLE_USER.replace(EMAIL_ENDPOINT_VAR_TEMPLATE, email);
};

export const getValidatePasswordResetEndpoint = (code) => {
  return Endpoints.VALIDATE_PASSWORD_RESET.replace(
    CODE_ENDPOINT_VAR_TEMPLATE,
    code
  );
};

export const getValidateEmailChangeEndpoint = (code) => {
  return Endpoints.VALIDATE_EMAIL_CHANGE.replace(
    CODE_ENDPOINT_VAR_TEMPLATE,
    code
  );
};

export const getRestPasswordEndpoint = (passwordResetId) => {
  return Endpoints.RESET_PASSWORD.replace(
    PASSWORD_RESET_ID_ENDPOINT_VAR_TEMPLATE,
    passwordResetId
  );
};

export const getChangeEmailEndpoint = (emailChangeId) => {
  return Endpoints.CHANGE_EMAIL.replace(
    EMAIL_CHANGE_ID_ENDPOINT_VAR_TEMPLATE,
    emailChangeId
  );
};

export const getRenameProjectEndpoint = (projectId) => {
  return Endpoints.RENAME_PROJECT.replace(
    PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
    projectId
  );
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

/**
 * Instantiate the given constructor using the given json, all properties in json will be assigned
 * into the constructor.
 * @param {*} Ctor Constructor that needs to be instantiated with all properties from given json
 * @param {*} json Source object to instantiate the given constructor
 */
export const fromJson = (Ctor, json) => {
  return Object.assign(new Ctor(), json);
};

export const isBlank = (text) => {
  return !text || !text.replace(/[\s\n\r\t]*/, '').length;
};

export const getStaticImageUrl = (imgName) => {
  return Application.STATIC_ASSETS_URL_TEMPLATE.replace(
    Application.IMG_NAME_TEMPLATE,
    imgName
  );
};

/**
 * must be invoked on every login
 */
export const storeUserToLocalStorage = (
  userInLocalStorage,
  onSuccess = null
) => {
  if (!(userInLocalStorage instanceof UserInLocalStorage)) {
    throw new TypeError('Excepting an instance of UserInLocalStorage');
  }
  localforage
    .setItem(LocalStorageKeys.USER, userInLocalStorage)
    .then((value) => {
      if (onSuccess) {
        onSuccess(value);
      }
    });
};

export const storeUserBuiltUsingApiData = (userObj, onSuccess = null) => {
  const userInLocalStorage = new UserInLocalStorage(
    userObj.email,
    userObj.role,
    userObj.shotBucketSessionStorage,
    userObj.organizationId,
    userObj.organization.name
  );
  storeUserToLocalStorage(userInLocalStorage, onSuccess);
};

// Api errors are not handled
export const getFromApiAndStoreUser = (userEmail, onSuccess = null) => {
  axios(getSingleUserEndpoint(userEmail)).then((response) => {
    const {data} = response;
    storeUserBuiltUsingApiData(data, onSuccess);
  });
};

/**
 * Must be used only to fetch an existing user from storage, to check whether
 * a user exist in storage, use localforage.get and check for non null value.
 */
export const getUserFromLocalStorage = (userEmail) => {
  return new Promise((resolve) => {
    localforage.getItem(LocalStorageKeys.USER).then((value) => {
      if (!value) {
        if (!userEmail) {
          throw new Error(
            'user is not in localStorage and also no userEmail is given'
          );
        }
        // user must have explicitly deleted the key, let's fetch from api
        getFromApiAndStoreUser(userEmail, resolve);
      }
      if (value.email !== userEmail) {
        throw new Error('User mismatched');
      }
      resolve(value);
    });
  });
};

export const invokeApiWithAnonymousAuth = (
  auth,
  config,
  onSuccess,
  onError,
  onFinally = null
) => {
  // we want to delete anonymous user asap, i.e before running any callbacks
  auth.signInAnonymously((user) =>
    axios(config)
      .then((response) => {
        user.delete().then(() => onSuccess(response));
      })
      .catch((error) => {
        user.delete().then(() => onError(error));
      })
      .finally(() => {
        if (onFinally) {
          onFinally();
        }
      })
  );
};

export const getLocation = (pathname, search, state = {}) => {
  return {pathname, search, state};
};

export const getZyliticsLogo = () => {
  return (
    <img
      src={getStaticImageUrl('zylitics_logo.svg')}
      alt="Zylitics Logo"
      style={{width: '120px', height: '36px'}}
    />
  );
};

export const getParsedLocationStringified = (parsed) => {
  return `?${queryString.stringify(parsed)}`;
};

export const updateMultipleInSearchQuery = (location, history, map = {}) => {
  const parsed = queryString.parse(location.search);
  Object.keys(map).forEach((k) => {
    parsed[k] = map[k];
  });
  history.push(
    getLocation(
      location.pathname,
      getParsedLocationStringified(parsed),
      location.state
    )
  );
};

export const updateInSearchQuery = (location, history, key, value) => {
  updateMultipleInSearchQuery(location, history, {[key]: value});
};

/**
 * Filters given keys from location search and returns
 * @param {*} filterKeys Keys in location search that needs to be kept
 * @returns new location search with only filtered keys
 */
export const filterSearchQuery = (search, filterKeys = []) => {
  const parsed = queryString.parse(search);
  const newSearch = {};
  filterKeys.forEach((k) => {
    if (parsed[k]) {
      newSearch[k] = parsed[k];
    }
  });
  return getParsedLocationStringified(newSearch);
};

export const addInSearchQuery = (search, key, value) => {
  const parsed = queryString.parse(search);
  parsed[key] = value;
  return getParsedLocationStringified(parsed);
};

export const setAxiosAuthToken = (token) => {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

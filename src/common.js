import React from 'react';
import PropTypes from 'prop-types';
import truncate from 'lodash-es/truncate';
import axios from 'axios';
import {captureException} from '@sentry/react';
import queryString from 'query-string';
import localforage from 'localforage';
import {normalize} from 'normalizr';
import firebase from 'firebase/app';
import 'firebase/auth';
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
  LocalStorageKeys,
  PASSWORD_RESET_ID_ENDPOINT_VAR_TEMPLATE,
  EMAIL_CHANGE_ID_ENDPOINT_VAR_TEMPLATE,
  Role,
  VERSION_IDS_ENDPOINT_VAR_TEMPLATE,
  MobileDevices,
} from './Constants';
import chrome from './icons/chrome.png';
import firefox from './icons/firefox.png';
import ie from './icons/ie.png';
import windowsIcon from './icons/windows.png';
import Application from './config/application';
import {UserInLocalStorage} from './model';
import {File, filesSchema, Test, Version} from './ide/Explorer/model';
import {ExplorerItemType} from './ide/Constants';
import logo from './assets/logo.svg';

export const isFunction = (name) => /^[a-z0-9_]+$/.test(name);

export const composePageTitle = (text) => `${text} . ${Application.ORG}`;

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

export const getMobileDeviceDisplayName = (deviceValue) => {
  switch (deviceValue) {
    case MobileDevices.IPAD_AIR.VALUE:
      return MobileDevices.IPAD_AIR.DISPLAY_NAME;
    case MobileDevices.IPAD_MINI.VALUE:
      return MobileDevices.IPAD_MINI.DISPLAY_NAME;
    case MobileDevices.IPAD_PRO.VALUE:
      return MobileDevices.IPAD_PRO.DISPLAY_NAME;
    case MobileDevices.IPHONE13.VALUE:
      return MobileDevices.IPHONE13.DISPLAY_NAME;
    case MobileDevices.IPHONE_XR.VALUE:
      return MobileDevices.IPHONE_XR.DISPLAY_NAME;
    case MobileDevices.SAMSUNG_GALAXY_S20_ULTRA.VALUE:
      return MobileDevices.SAMSUNG_GALAXY_S20_ULTRA.DISPLAY_NAME;
    case MobileDevices.SAMSUNG_GALAXY_S8_PLUS.VALUE:
      return MobileDevices.SAMSUNG_GALAXY_S8_PLUS.DISPLAY_NAME;
    default:
      return null;
  }
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

export const getContextObjShape = () => ({
  $$typeof: PropTypes.symbol,
});

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

export const getShotUri = (bucket, shotName) =>
  `${Application.STORAGE_HOST}/${bucket}/${shotName}`;

export const getShotName = (sessionId, buildKey, id) =>
  `${sessionId}-${buildKey}-${id}.png`;

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

export const getTruncated = (value, length) =>
  truncate(value, {
    length,
  });

export const getShortCurrentMonthName = () =>
  new Intl.DateTimeFormat('en-US', {month: 'short'}).format(new Date());

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

const getApiErrorDeducedMsg = (userErrorMsg, apiErrorMsg) =>
  userErrorMsg && userErrorMsg.trim().length
    ? `${userErrorMsg}, ${apiErrorMsg}`
    : apiErrorMsg;

/**
 * Should be invoked in the onError handler of every firebase request to show an
 * appropriate message to user. When errors are detected on the handler, this
 * should be invoked after no code is matched with the intended error code.
 * @param {*} error The firebase error object
 * @param {*} showError Function to be invoked with the deduced error message
 * @param {*} message message you want appended with the deduced error messages
 */
export const handleAuthError = (error, showError, message) => {
  captureException(error);
  // console.log('handleAuthError', error);
  let errorMsg;
  switch (error.code) {
    case 'auth/invalid-user-token':
    case 'auth/user-token-expired':
      errorMsg =
        "Due to an error, we couldn't authenticate you with the server, please sign out and then sign in again";
      break;
    case 'auth/too-many-requests':
      errorMsg =
        'You reached maximum number of reattempts, please try in sometime';
      break;
    case 'auth/user-disabled':
      errorMsg =
        "Your account is disabled, if you think that's an error please contact us";
      break;
    case 'auth/network-request-failed':
      errorMsg = !navigator.onLine
        ? 'Network error'
        : 'Server is unreachable. Please try in a few minutes or contact us.';
      break;
    default:
      errorMsg =
        "An unexpected error occurred and we're working on to fix it. Please contact us if the issue persists.";
  }
  showError(getApiErrorDeducedMsg(message, errorMsg));
};

/**
 * Should be invoked in the onError handler of every Zylitics api request to show an
 * appropriate message to user.
 * @param {*} error The axios error object
 * @param {*} showError Optional function to be invoked with the deduced error message,
 * if null, deduced error message will be returned.
 * @param {*} message message you want appended with the deduced error messages
 * @returns {*} deduced error message if showError is null otherwise null
 */

export const getIfPermissionError = (error) => {
  let msg = null;
  const {status, data} = error.response || {};
  if (status === 401) {
    msg = data.message;
  }
  return msg;
};
export const handleApiError = (error, showError, message) => {
  // console.log('handleApiError', error.response, error.request);
  if (error.response) {
    captureException(error);
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
    const deducedErrorMsg = getApiErrorDeducedMsg(message, errorMsg);
    if (!showError) {
      return deducedErrorMsg;
    }
    showError(deducedErrorMsg);
    return null;
  }
  if (error.request) {
    captureException(error);
    // !NOTE: Any error thrown within axios, like timeout error will land up here as well,
    // but we're shown server unreachable error. This may be fine for now but keep
    // an eye on errors.
    const msg = error.message;
    let errorMsg;
    if (!navigator.onLine) {
      errorMsg = 'Network error';
    } else if (msg.includes(`timeout of ${error.config.timeout}ms`)) {
      errorMsg =
        'There was delay hearing back from server, you can try for a few times until it resolves';
    } else {
      errorMsg =
        'Server is unreachable. Please try in a few minutes or contact us.';
    }
    const deducedErrorMsg = getApiErrorDeducedMsg(message, errorMsg);
    if (!showError) {
      return deducedErrorMsg;
    }
    showError(deducedErrorMsg);
    return null;
  }
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

export const getNewBuildEndpoint = (projectId) =>
  Endpoints.NEW_BUILD.replace(PROJECT_ID_ENDPOINT_VAR_TEMPLATE, projectId);

export const getNewBuildWithoutSessionEndpoint = (projectId) =>
  Endpoints.NEW_BUILD_WITHOUT_SESSION.replace(
    PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
    projectId
  );

export const reRunBuildEndpoint = (buildId) =>
  Endpoints.RE_RUN_BUILD.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const newSessionEndpoint = (buildId) =>
  Endpoints.NEW_SESSION.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getCompletedBuildSummaryEndpoint = (projectId) =>
  Endpoints.COMPLETED_BUILD_SUMMARY.replace(
    PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
    projectId
  );

export const getCompletedBuildDetailsEndpoint = (buildId) =>
  Endpoints.COMPLETED_BUILD_DETAILS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );

export const getCompletedVersionStatusEndpoint = (buildId, versionId) =>
  Endpoints.COMPLETED_VERSION_STATUS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  ).replace(VERSION_ID_ENDPOINT_VAR_TEMPLATE, versionId);

export const getRunningBuildsEndpoint = (projectId) =>
  Endpoints.RUNNING_BUILDS.replace(PROJECT_ID_ENDPOINT_VAR_TEMPLATE, projectId);

export const getRunningBuildSummaryEndpoint = (buildId) =>
  Endpoints.RUNNING_BUILD_SUMMARY.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );

export const getStopBuildEndpoint = (buildId) =>
  Endpoints.STOP_BUILD.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getBuildStatusEndpoint = (buildId, versionId) =>
  Endpoints.BUILD_STATUS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  ).replace(VERSION_ID_ENDPOINT_VAR_TEMPLATE, versionId);

export const getLatestShotEndpoint = (buildId) =>
  Endpoints.LATEST_SHOT.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getShotBasicDetailsEndpoint = (buildId) =>
  Endpoints.SHOT_BASIC_DETAILS.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getBuildOutputDetailsEndpoint = (buildId) =>
  Endpoints.BUILD_OUTPUT_DETAILS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );

export const getVersionOutputDetailsEndpoint = (buildId, versionId) =>
  Endpoints.VERSION_OUTPUT_DETAILS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  ).replace(VERSION_ID_ENDPOINT_VAR_TEMPLATE, versionId);

export const getCapturedCodeEndpoint = (buildId, versionId) =>
  Endpoints.CAPTURED_CODE.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  ).replace(VERSION_ID_ENDPOINT_VAR_TEMPLATE, versionId);

export const getPlatformBrowsersEndpoint = (platform) =>
  Endpoints.PLATFORM_BROWSERS.replace(PLATFORM_ENDPOINT_VAR_TEMPLATE, platform);

export const getCapturedBuildCapabilityEndpoint = (buildId) =>
  Endpoints.CAPTURED_BUILD_CAPABILITY.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );

export const getCapturedBuildVarsEndpoint = (buildId) =>
  Endpoints.CAPTURED_BUILD_VARS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );

export const getCapturedGlobalVarsEndpoint = (buildId) =>
  Endpoints.CAPTURED_GLOBAL_VARS.replace(
    BUILD_ID_ENDPOINT_VAR_TEMPLATE,
    buildId
  );

export const getRunnerPreferencesEndpoint = (buildId) =>
  Endpoints.RUNNER_PREFERENCES.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getDriverLogsEndpoint = (buildId) =>
  Endpoints.DRIVER_LOGS.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getPerformanceLogsEndpoint = (buildId) =>
  Endpoints.PERFORMANCE_LOGS.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getElementShotNamesEndpoint = (buildId) =>
  Endpoints.ELEMENT_SHOT_NAMES.replace(BUILD_ID_ENDPOINT_VAR_TEMPLATE, buildId);

export const getValidateEmailVerificationEndpoint = (code) =>
  Endpoints.VALIDATE_EMAIL_VERIFICATION.replace(
    CODE_ENDPOINT_VAR_TEMPLATE,
    code
  );

export const getValidateTeamInviteEndpoint = (code) =>
  Endpoints.VALIDATE_TEAM_INVITE.replace(CODE_ENDPOINT_VAR_TEMPLATE, code);

export const getValidatePasswordResetEndpoint = (code) =>
  Endpoints.VALIDATE_PASSWORD_RESET.replace(CODE_ENDPOINT_VAR_TEMPLATE, code);

export const getValidateEmailChangeEndpoint = (code) =>
  Endpoints.VALIDATE_EMAIL_CHANGE.replace(CODE_ENDPOINT_VAR_TEMPLATE, code);

export const getRestPasswordEndpoint = (passwordResetId) =>
  Endpoints.RESET_PASSWORD.replace(
    PASSWORD_RESET_ID_ENDPOINT_VAR_TEMPLATE,
    passwordResetId
  );

export const getChangeEmailEndpoint = (emailChangeId) =>
  Endpoints.CHANGE_EMAIL.replace(
    EMAIL_CHANGE_ID_ENDPOINT_VAR_TEMPLATE,
    emailChangeId
  );

export const getRenameProjectEndpoint = (projectId) =>
  Endpoints.RENAME_PROJECT.replace(PROJECT_ID_ENDPOINT_VAR_TEMPLATE, projectId);

export const getDownloadProjectEndpoint = (projectId) =>
  Endpoints.DOWNLOAD_PROJECT_FILES.replace(
    PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
    projectId
  );

export const getFilesWithTestsEndpoint = (projectId) =>
  prepareEndpoint(Endpoints.FILES_WITH_TESTS, projectId);

export const getParseEndpoint = (versionIds) => {
  return Endpoints.PARSE.replace(VERSION_IDS_ENDPOINT_VAR_TEMPLATE, versionIds);
};

/**
 * Fetches files with tests from api filtered by te given fileIds
 * @param {fileIds} fileIds Must be comma separated string if multiple, otherwise integer
 * @param {projectId} projectId The zl projectId
 */
export const getFilesWithTests = (fileIds, projectId) =>
  axios(getFilesWithTestsEndpoint(projectId), {
    params: {
      fileIdsFilter: fileIds,
    },
  });

export const transformApiBrowserData = (data) => {
  if (!data.length) {
    throw new Error("No browsers found, this shouldn't have happened");
  }
  const browserWiseData = {};
  // api sends sorted names and versions
  data.forEach((brw) => {
    const name =
      brw.name === 'internet explorer' ? Browsers.IE.VALUE : brw.name;
    browserWiseData[name] = brw.versions;
  });
  return browserWiseData;
};

/**
 * Instantiate the given constructor using the given json, all properties in json will be assigned
 * into the constructor.
 * @param {*} Ctor Constructor that needs to be instantiated with all properties from given json
 * @param {*} json Source object to instantiate the given constructor
 */
export const fromJson = (Ctor, json) => Object.assign(new Ctor(), json);

export const isBlank = (text) =>
  !text || !text.replace(/[\s\n\r\t]*/, '').length;

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
    userObj.firstName,
    userObj.lastName,
    userObj.email,
    userObj.role,
    userObj.shotBucketSessionStorage,
    userObj.organizationId,
    userObj.organization.name
  );
  storeUserToLocalStorage(userInLocalStorage, onSuccess);
};

export const getFromApiAndStoreUser = (onSuccess = null, onFailure = null) => {
  axios(Endpoints.SINGLE_USER)
    .then((response) => {
      const {data} = response;
      storeUserBuiltUsingApiData(data, onSuccess);
    })
    .catch((error) => {
      if (onFailure) {
        onFailure(error);
      }
    });
};

/**
 * Must be used only to fetch an existing user from storage, to check whether
 * a user exist in storage, use localforage.get and check for non null value.
 */
export const getUserFromLocalStorage = () =>
  new Promise((resolve) => {
    localforage.getItem(LocalStorageKeys.USER).then((value) => {
      if (!value) {
        // user must have explicitly deleted the key, let's fetch from api
        getFromApiAndStoreUser(resolve);
      }
      resolve(value);
    });
  });

export const anyUserExistInLocalStorage = () =>
  new Promise((resolve) => {
    localforage.getItem(LocalStorageKeys.USER).then((value) => {
      resolve(!!value);
    });
  });

export const getUserDisplayName = (firstName, lastName) =>
  `${firstName} ${lastName}`;

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

export const getLocation = (pathname, search, state = {}) => ({
  pathname,
  search,
  state,
});

export const getZyliticsLogo = () => (
  <img
    src={logo}
    alt="Outomated Logo"
    style={{width: '120px', height: '36px'}}
  />
);

export const getParsedLocationStringified = (parsed) =>
  `?${queryString.stringify(parsed)}`;

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

export const removeMultipleFromSearchQuery = (location, history, keys = []) => {
  const parsed = queryString.parse(location.search);
  keys.forEach((k) => delete parsed[k]);
  history.push(
    getLocation(
      location.pathname,
      getParsedLocationStringified(parsed),
      location.state
    )
  );
};

export const removeFromSearchQuery = (location, history, key) => {
  removeMultipleFromSearchQuery(location, history, [key]);
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

export const addMultipleInSearchQuery = (search, map = {}) => {
  const parsed = queryString.parse(search);
  Object.keys(map).forEach((k) => {
    parsed[k] = map[k];
  });
  return getParsedLocationStringified(parsed);
};

export const addInSearchQuery = (search, key, value) => {
  return addMultipleInSearchQuery(search, {[key]: value});
};

export const setAxiosAuthToken = (token) => {
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const getRoleDisplayName = (role) => {
  switch (role) {
    case Role.ADMIN:
      return 'Admin';
    case Role.DEVELOPER:
      return 'Developer';
    default:
      throw new Error(`Unrecognized role ${role}`);
  }
};

export const keyUpHandler = (handler) => (e) => {
  if (e.key === 'Enter') {
    handler();
  }
};

export const filesWithTestsApiDataToNormalizedSorted = (data) => {
  if (!Array.isArray(data)) {
    throw new TypeError('data must be an array of files with tests');
  }
  const filesWithTests = data.map((f) => fromJson(File, f));
  filesWithTests.sort((a, b) => getNewIntlComparer()(a.name, b.name));
  filesWithTests
    .filter((f) => f.tests)
    .forEach((f) => {
      // eslint-disable-next-line no-param-reassign
      f.tests = f.tests.map((t) => fromJson(Test, t));
      f.tests.sort((a, b) => getNewIntlComparer()(a.name, b.name));
      f.tests.forEach((t) => {
        // eslint-disable-next-line no-param-reassign
        t.versions = t.versions.map((v) => fromJson(Version, v));
        t.versions.sort((a, b) => getNewIntlComparer()(a.name, b.name));
      });
    });
  return normalize(filesWithTests, filesSchema);
};

export const updateBuildConfigSelectedVersions = (
  selectedVersions,
  files,
  itemType,
  itemId,
  isSelected
) => {
  switch (itemType) {
    case ExplorerItemType.VERSION: {
      if (isSelected) {
        selectedVersions.add(itemId);
      } else {
        selectedVersions.delete(itemId);
      }
      break;
    }
    case ExplorerItemType.TEST: {
      if (isSelected) {
        // when a test is selected, add it's current version only.
        selectedVersions.add(
          files.entities.tests[itemId].versions.find(
            (v) => files.entities.versions[v].isCurrent
          )
        );
      } else {
        // when a test is deselected, delete all it's versions that exists
        files.entities.tests[itemId].versions.forEach((vid) =>
          selectedVersions.delete(vid)
        );
      }
      break;
    }
    case ExplorerItemType.FILE: {
      if (isSelected) {
        // when a file is selected, add all it's tests' current versions
        files.entities.files[itemId].tests
          .filter((tid) => !isFunction(files.entities.tests[tid].name))
          .forEach((tid) =>
            selectedVersions.add(
              files.entities.tests[tid].versions.find(
                (v) => files.entities.versions[v].isCurrent
              )
            )
          );
        break;
      } else {
        // when a files is deselected, delete all it's tests' version that exists
        files.entities.files[itemId].tests.forEach((tid) =>
          files.entities.tests[tid].versions.forEach((vid) =>
            selectedVersions.delete(vid)
          )
        );
        break;
      }
    }
    default:
      throw new Error(`Unrecognized itemType ${itemType}`);
  }
};

// make it more generic later on when we've more providers by adding one more function,
// signUpWithProviders and giving it with profile and credential.
export const signUpWithGoogle = (
  auth,
  googleUser,
  planName,
  emailVerificationId,
  onSuccess,
  onError
) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcOffsetInMinutes = new Date().getTimezoneOffset();
  const profile = googleUser.getBasicProfile();
  const payload = {
    firstName: profile.getGivenName(),
    lastName: profile.getFamilyName(),
    email: profile.getEmail(),
    timezone,
    utcOffsetInMinutes,
    emailVerificationId,
    planName,
    usingLoginProvider: true,
  };
  invokeApiWithAnonymousAuth(
    auth,
    {
      url: Endpoints.USERS,
      method: 'post',
      data: payload,
    },
    ({data}) => {
      // Store extra user data in local storage. This
      // is done because firebase doesn't allow to store extra details with
      // user object. We can't put it as browser state because if user opens
      // up multiple tabs, we will have to fetch this data multiple times
      // whereas with local storage, we will fetch it on logins only.
      // it will have to be re fetched whenever some of it's data changes from
      // profile page or email change etc.
      storeUserBuiltUsingApiData(data.user);
      // sign in user in firebase
      // sign in using a token and link to the given account.
      auth.signInUsingToken(data.customToken, (user) => {
        const credential = firebase.auth.GoogleAuthProvider.credential(
          googleUser.getAuthResponse().id_token
        );
        // https://firebase.google.com/docs/reference/js/firebase.User?authuser=0#linkwithcredential
        // All errors listed here don't apply here because we do this linking as a workaround
        // to signup user using identity provider while using our own UID.
        user.linkWithCredential(credential);
        // let caller handle actions after successful signup. Caller may either redirect
        // to home or show a terms/pricing page.
        onSuccess();
      });
    },
    // Errors may occur only during internal api call such as email already in use.
    onError
  );
};

export const readPlanFromQS = (locSearch) => {
  const parsed = queryString.parse(locSearch);
  return parsed.plan;
};

export const getCurrentUser = () => firebase.auth().currentUser;

export const copy = (text) => {
  return new Promise((resolve, reject) => {
    navigator.permissions.query({name: 'clipboard-write'}).then((_res) => {
      if (_res.state !== 'granted' && _res.state !== 'prompt') {
        reject(new Error("Couldn't access clipboard"));
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        resolve();
      });
    });
  });
};

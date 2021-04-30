import {immerable} from 'immer';
import {BuildCapsTimeouts, Defaults} from './Constants';
// Note: our resolutions list is taken from GCP's virtual display's supported
// resolution fetched using qres.exe /L
import resolutions from './config/desktopResolution.json';

// doesn't have to be immer draftable as we set the whole object.
export default function Browser(name, version) {
  this.name = name;
  this.version = version;
}

function BuildConfig(
  buildName = null,
  buildCapabilityId = null,
  selectedVersions = new Set(), // set of versionIds, name should be changed to selectedVersionIds
  displayResolution,
  timezone = Defaults.TIMEZONE,
  selectedBuildVarIdPerKey = {},
  abortOnFailure = false,
  aetKeepSingleWindow = true,
  aetUpdateUrlBlank = true,
  aetResetTimeouts = true,
  aetDeleteAllCookies = true,
  openLessOften = false
) {
  this.buildName = buildName;
  this.buildCapabilityId = buildCapabilityId;
  /*
  the stored versions may not necessarily be in the order they're supposed to run
  by runner (ascending order) and are kept in 'files'. Once we're going to submit
  to api and put into output console, get all versions from files array in the
  order (first get files from result, then for each file, it's tests, then for each
  test it's versions and put in an array until all files are processed. this is the
  version list in order.) and remove versions those are not in selectedVersions
  by finding an intersection between them. The new array is the version array in order
  ready to run a build. This also avoids any stale version in selected list.
  */
  this.selectedVersions = selectedVersions;
  if (!displayResolution) {
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    if (resolutions.includes(screenRes)) {
      this.displayResolution = screenRes;
    } else if (resolutions.includes(Defaults.DESKTOP_RES)) {
      this.displayResolution = Defaults.DESKTOP_RES;
    } else {
      throw new Error(
        "Couldn't find default resolution in our supported resolutions"
      );
    }
  }
  this.timezone = timezone;
  this.selectedBuildVarIdPerKey = selectedBuildVarIdPerKey;
  this.abortOnFailure = abortOnFailure;
  this.aetKeepSingleWindow = aetKeepSingleWindow;
  this.aetUpdateUrlBlank = aetUpdateUrlBlank;
  this.aetResetTimeouts = aetResetTimeouts;
  this.aetDeleteAllCookies = aetDeleteAllCookies;
  this.openLessOften = openLessOften;

  this[immerable] = true;
}

function BuildCapabilities(
  id = null,
  name = null,
  serverOs = null,
  wdBrowserName = null,
  wdBrowserVersion = null,
  wdPlatformName = null,
  wdAcceptInsecureCerts = false,
  wdTimeoutsScript = BuildCapsTimeouts.ST,
  wdTimeoutsPageLoad = BuildCapsTimeouts.PLT,
  wdTimeoutsElementAccess = BuildCapsTimeouts.EAT,
  wdStrictFileInteractability = false,
  wdUnhandledPromptBehavior = 'ignore',
  wdIeElementScrollBehavior = 'top',
  wdIeEnablePersistentHovering = false,
  wdIeRequireWindowFocus = false,
  wdIeDisableNativeEvents = false,
  wdIeDestructivelyEnsureCleanSession = false, // don't give user but send true when in IDE as we use same machine for IDE
  wdIeLogLevel = 'FATAL',
  wdChromeVerboseLogging = false,
  wdChromeSilentOutput = false,
  wdChromeEnableNetwork = false,
  wdChromeEnablePage = false,
  wdFirefoxLogLevel = 'info',
  wdBrwStartMaximize = true
) {
  this.id = id;
  this.name = name;
  this.serverOs = serverOs;
  this.wdBrowserName = wdBrowserName;
  this.wdBrowserVersion = wdBrowserVersion;
  this.wdPlatformName = wdPlatformName;
  this.wdAcceptInsecureCerts = wdAcceptInsecureCerts;
  this.wdTimeoutsScript = wdTimeoutsScript;
  this.wdTimeoutsPageLoad = wdTimeoutsPageLoad;
  this.wdTimeoutsElementAccess = wdTimeoutsElementAccess;
  this.wdStrictFileInteractability = wdStrictFileInteractability;
  this.wdUnhandledPromptBehavior = wdUnhandledPromptBehavior;
  this.wdIeElementScrollBehavior = wdIeElementScrollBehavior;
  this.wdIeEnablePersistentHovering = wdIeEnablePersistentHovering;
  this.wdIeRequireWindowFocus = wdIeRequireWindowFocus;
  this.wdIeDisableNativeEvents = wdIeDisableNativeEvents;
  this.wdIeDestructivelyEnsureCleanSession = wdIeDestructivelyEnsureCleanSession;
  this.wdIeLogLevel = wdIeLogLevel;
  this.wdChromeVerboseLogging = wdChromeVerboseLogging;
  this.wdChromeSilentOutput = wdChromeSilentOutput;
  this.wdChromeEnableNetwork = wdChromeEnableNetwork;
  this.wdChromeEnablePage = wdChromeEnablePage;
  this.wdFirefoxLogLevel = wdFirefoxLogLevel;
  this.wdBrwStartMaximize = wdBrwStartMaximize;
}

function UserInLocalStorage(
  firstName,
  lastName,
  email,
  role,
  shotBucketSessionStorage,
  organizationId,
  organizationName
) {
  this.firstName = firstName;
  this.lastName = lastName;
  this.email = email;
  this.role = role;
  this.shotBucketSessionStorage = shotBucketSessionStorage;
  this.organizationId = organizationId;
  this.organizationName = organizationName;
}

function SnackbarAlertProps(
  message = null,
  type = null,
  verPos = null,
  horPos = null,
  autoHideDuration = null
) {
  this.message = message;
  this.type = type;
  this.verPos = verPos;
  this.horPos = horPos;
  this.autoHideDuration = autoHideDuration;
}

function TestVersionDetails(
  versionId,
  versionName,
  totalLines,
  currentLine,
  status,
  timeTakenMillis,
  fileName,
  testName
) {
  this.versionId = versionId;
  this.versionName = versionName;
  this.totalLines = totalLines;
  this.currentLine = currentLine;
  this.status = status;
  this.timeTakenMillis = timeTakenMillis;
  this.fileName = fileName;
  this.testName = testName;
}

function CompletedBuildDetailsObj(
  buildId,
  buildName,
  finalStatus,
  createDate,
  testTimeMillis,
  os,
  browserName,
  browserVersion,
  resolution,
  timezone,
  buildCapsName,
  shotBucket,
  allDoneDate,
  driverLogsAvailable,
  perfLogsAvailable,
  elemShotsAvailable,
  testVersionDetailsList
) {
  this.buildId = buildId;
  this.buildName = buildName;
  this.finalStatus = finalStatus;
  this.createDate = createDate;
  this.testTimeMillis = testTimeMillis;
  this.os = os;
  this.browserName = browserName;
  this.browserVersion = browserVersion;
  this.resolution = resolution;
  this.timezone = timezone;
  this.buildCapsName = buildCapsName;
  this.shotBucket = shotBucket;
  this.allDoneDate = allDoneDate;
  this.driverLogsAvailable = driverLogsAvailable;
  this.perfLogsAvailable = perfLogsAvailable;
  this.elemShotsAvailable = elemShotsAvailable;
  this.testVersionDetailsList = testVersionDetailsList;
}

function RunningBuildObj(
  buildId,
  buildKey,
  buildName,
  shotBucket,
  os,
  browserName
) {
  this.buildId = buildId;
  this.buildKey = buildKey;
  this.buildName = buildName;
  this.shotBucket = shotBucket;
  this.os = os;
  this.browserName = browserName;
}

function RunningBuildSummary(
  buildId,
  sessionKey,
  acquiringSession,
  newSessionFail,
  newSessionFailureError,
  allDone,
  runningForMillis,
  finalStatus,
  testVersionDetailsList
) {
  this.buildId = buildId;
  this.sessionKey = sessionKey;
  this.acquiringSession = acquiringSession;
  this.newSessionFail = newSessionFail;
  this.newSessionFailureError = newSessionFailureError;
  this.allDone = allDone;
  this.runningForMillis = runningForMillis;
  this.finalStatus = finalStatus;
  this.testVersionDetailsList = testVersionDetailsList;
}

function BuildOutputDetailsByVersion(
  buildId,
  versionId,
  outputsWithLineBreak,
  error
) {
  this.buildId = buildId;
  this.versionId = versionId;
  this.outputsWithLineBreak = outputsWithLineBreak;
  this.error = error;
}

function BuildDialogState(
  open = false,
  title = null,
  content = null,
  openerType = null
) {
  this.open = open;
  this.title = title;
  this.content = content;
  this.openerType = openerType;
}

function FilesWithTestsApiConfig(excludeCode, excludeNoCodeTests) {
  this.excludeCode = excludeCode;
  this.excludeNoCodeTests = excludeNoCodeTests;
}

export {
  BuildConfig,
  BuildCapabilities,
  UserInLocalStorage,
  SnackbarAlertProps,
  CompletedBuildDetailsObj,
  TestVersionDetails,
  RunningBuildObj,
  RunningBuildSummary,
  BuildOutputDetailsByVersion,
  BuildDialogState,
  FilesWithTestsApiConfig,
};

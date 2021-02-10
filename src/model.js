import {immerable} from 'immer';
import {BuildCapsTimeouts, Defaults} from './Constants';
import resolutions from './config/desktopResolution.json';

// doesn't have to be immer draftable as we set the whole object.
export default function Browser(name, version) {
  this.name = name;
  this.version = version;
}

function BuildConfig(
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
    this.displayResolution =
      resolutions.indexOf(screenRes) >= 0 ? screenRes : Defaults.DESKTOP_RES;
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

// User is identified using email not id, to keep id out of storage
function UserInLocalStorage(
  email,
  shotBucketSessionStorage,
  organizationId,
  organizationName
) {
  this.email = email;
  this.shotBucketSessionStorage = shotBucketSessionStorage;
  this.organizationId = organizationId;
  this.organizationName = organizationName;
}

export {BuildConfig, BuildCapabilities, UserInLocalStorage};

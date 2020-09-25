import {immerable} from 'immer';
import {BuildCapsTimeouts} from './Constants';

// doesn't have to be immer draftable as we set the whole object.
export default function Browser(name, version) {
  this.name = name;
  this.version = version;
}

function RunState(
  newBuildRequested = false,
  onBuildRunCallback = () => null,
  onBuildCancelCallback = () => null
) {
  this.newBuildRequested = newBuildRequested;
  this.onBuildRunCallback = onBuildRunCallback;
  this.onBuildCancelCallback = onBuildCancelCallback;
}

function BuildConfig(
  buildCapabilityId = null,
  selectedVersions = new Set(),
  selectedVersionsImplicit = [],
  selectedBuildVarIdPerKey = {},
  openLessOften = false,
  runState = new RunState()
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
  /* versions that are implicitly selected with a single user action such as using
  context menu in explorer, editor panel's run button, re-run and run-failed, kept
  separately because we don't clear selectionVersions when implicit selection occurs.
  This should be reset after each build is run because config checks this and decides
  whether to show version select component. This will always be ordered. */
  this.selectedVersionsImplicit = selectedVersionsImplicit;
  this.selectedBuildVarIdPerKey = selectedBuildVarIdPerKey;
  this.openLessOften = openLessOften;
  this.runState = runState;

  this[immerable] = true;
}

function BuildCapabilities(
  id = null,
  name = null,
  os = null,
  browserName = null,
  browserVersion = null,
  platformName = null,
  acceptInsecureCertificate = false,
  scriptTimeout = BuildCapsTimeouts.ST,
  pageLoadTimeout = BuildCapsTimeouts.PLT,
  elementAccessTimeout = BuildCapsTimeouts.EAT,
  strictFileIntractability = false,
  unhandledPromptBehavior = 'ignore',
  ieElementScrollBehavior = 'top',
  ieEnablePersistentHovering = false,
  ieRequireWindowFocus = false,
  ieDisableNativeEvents = false,
  ieDestructivelyEnsureCleanSession = false, // don't give user but send true when in IDE as we use same machine for IDE
  ieLogLevel = 'FATAL',
  chromeVerboseLogging = false,
  chromeSilentLogging = false,
  chromeEnableNetworkLogs = false,
  chromeEnablePageLogs = false,
  firefoxLogLevel = 'info',
  startMaximize = true
) {
  this.id = id;
  this.name = name;
  this.os = os;
  this.browserName = browserName;
  this.browserVersion = browserVersion;
  this.platformName = platformName;
  this.acceptInsecureCertificate = acceptInsecureCertificate;
  this.scriptTimeout = scriptTimeout;
  this.pageLoadTimeout = pageLoadTimeout;
  this.elementAccessTimeout = elementAccessTimeout;
  this.strictFileIntractability = strictFileIntractability;
  this.unhandledPromptBehavior = unhandledPromptBehavior;
  this.ieElementScrollBehavior = ieElementScrollBehavior;
  this.ieEnablePersistentHovering = ieEnablePersistentHovering;
  this.ieRequireWindowFocus = ieRequireWindowFocus;
  this.ieDisableNativeEvents = ieDisableNativeEvents;
  this.ieDestructivelyEnsureCleanSession = ieDestructivelyEnsureCleanSession;
  this.ieLogLevel = ieLogLevel;
  this.chromeVerboseLogging = chromeVerboseLogging;
  this.chromeSilentLogging = chromeSilentLogging;
  this.chromeEnableNetworkLogs = chromeEnableNetworkLogs;
  this.chromeEnablePageLogs = chromeEnablePageLogs;
  this.firefoxLogLevel = firefoxLogLevel;
  this.startMaximize = startMaximize;
}

export {BuildConfig, BuildCapabilities};

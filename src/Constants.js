export const Browsers = {
  CHROME: {
    DISPLAY_NAME: 'Chrome',
    VALUE: 'chrome',
  },
  FIREFOX: {
    DISPLAY_NAME: 'Firefox',
    VALUE: 'firefox',
  },
  IE: {
    DISPLAY_NAME: 'IE',
    VALUE: 'IE',
  },
};

export const Platforms = {
  WINDOWS: {
    DISPLAY_NAME: 'Windows',
    VALUE: 'windows',
  },
};

// put os in descending order of release
export const Os = {
  WIN10: {
    DISPLAY_NAME: 'Windows 10',
    VALUE: 'win10',
    PLATFORM: Platforms.WINDOWS.VALUE,
  },
  WIN8_1: {
    DISPLAY_NAME: 'Windows 8.1',
    VALUE: 'win8_1',
    PLATFORM: Platforms.WINDOWS.VALUE,
  },
};

export const TestStatus = {
  RUNNING: 'RUNNING',
  ERROR: 'ERROR',
  STOPPED: 'STOPPED',
  ABORTED: 'ABORTED',
  SUCCESS: 'SUCCESS',
};

export const RunType = {
  BUILD_RUN: 'BUILD_RUN',
  DRY_RUN: 'DRY_RUN',
  PARSE_RUN: 'PARSE_RUN',
};

export const VarTypes = {
  BUILD: 'BUILD',
  GLOBAL: 'GLOBAL',
};

export const ErrorType = {
  API_ERROR: 'API_ERROR',
  BUILD_VAR_DUPE_ERROR: 'BUILD_VAR_DUPE_ERROR',
  GLOBAL_VAR_DUPE_ERROR: 'GLOBAL_VAR_DUPE_ERROR',
};

// match with BuildCapsFields to make sense of keys
export const BuildCapsKeys = {
  ID: 'ID',
  NAME: 'NAME',
  OS: 'OS',
  BN: 'BN',
  BV: 'BV',
  PN: 'PN',
  AIC: 'AIC',
  CVL: 'CVL',
  CSL: 'CSL',
  CENL: 'CENL',
  CEPL: 'CEPL',
  FLL: 'FLL',
  IELL: 'IELL',
  SM: 'SM',
  ST: 'ST',
  PLT: 'PLT',
  EAT: 'EAT',
  SFI: 'SFI',
  UPB: 'UPB',
  IEESB: 'IEESB',
  IEEPH: 'IEEPH',
  IERWF: 'IERWF',
  IEDNE: 'IEDNE',
  IEDECS: 'IEDECS',
};

export const BuildConfigKeys = {
  BCAP: 'BCAP',
  SV: 'SV',
  DR: 'DR',
  TZ: 'TZ',
  SBVIPK: 'SBVIPK',
  AOF: 'AOF',
  AKSW: 'AKSW',
  AUUB: 'AUUB',
  ART: 'ART',
  ADAC: 'ADAC',
  OLO: 'OLO',
};

export const BuildCapsFields = {
  ID: 'id',
  NAME: 'name',
  OS: 'serverOs',
  BN: 'wdBrowserName',
  BV: 'wdBrowserVersion',
  PN: 'wdPlatformName',
  AIC: 'wdAcceptInsecureCerts',
  CVL: 'wdChromeVerboseLogging',
  CSL: 'wdChromeSilentOutput',
  CENL: 'wdChromeEnableNetwork',
  CEPL: 'wdChromeEnablePage',
  FLL: 'wdFirefoxLogLevel',
  IELL: 'wdIeLogLevel',
  SM: 'wdBrwStartMaximize',
  ST: 'wdTimeoutsScript',
  PLT: 'wdTimeoutsPageLoad',
  EAT: 'wdTimeoutsElementAccess',
  SFI: 'wdStrictFileInteractability',
  UPB: 'wdUnhandledPromptBehavior',
  IEESB: 'wdIeElementScrollBehavior',
  IEEPH: 'wdIeEnablePersistentHovering',
  IERWF: 'wdIeRequireWindowFocus',
  IEDNE: 'wdIeDisableNativeEvents',
  IEDECS: 'wdIeDestructivelyEnsureCleanSession',
};

export const BuildConfigFields = {
  BCAP: 'buildCapabilityId',
  SV: 'selectedVersions',
  DR: 'displayResolution',
  TZ: 'timezone',
  SBVIPK: 'selectedBuildVarIdPerKey',
  AOF: 'abortOnFailure',
  AKSW: 'aetKeepSingleWindow',
  AUUB: 'aetUpdateUrlBlank',
  ART: 'aetResetTimeouts',
  ADAC: 'aetDeleteAllCookies',
  OLO: 'openLessOften',
};

export const BuildCapsLabels = {
  NAME: 'Name',
  OS: 'OS',
  BRW: 'Browser',
  AIC: 'Accept Insecure Certificate',
  CVL: 'Enable Chrome Verbose Logging',
  CSL: 'Enable Chrome Silent Logging',
  CENL: 'Enable Chrome Network Logs',
  CEPL: 'Enable Chrome Page Logs',
  FLL: 'Firefox Log Level',
  IELL: 'IE Log Level',
  SM: 'Start Browser Maximize',
  ST: 'Script Timeout',
  PLT: 'Page Load Timeout',
  EAT: 'Element Access Timeout',
  SFI: 'Strict File Intractability',
  UPB: 'Unhandled Prompt Behavior',
  IEESB: 'IE Element Scroll Behavior',
  IEEPH: 'IE Enable Persistent Hovering',
  IERWF: 'IE Require Window Focus',
  IEDNE: 'IE Disable Native Events',
};

export const BuildConfigLabels = {
  BCAP: 'Build Capability',
  SV: 'Tests',
  DR: 'Display Resolution',
  TZ: 'Timezone',
  SBVIPK: 'Build Variables',
  AOF: 'Abort On Failure',
  AKSW: 'Keep Single Window After Each Test',
  AUUB: 'Update Url Blank After Each Test',
  ART: 'Reset Timeouts After Each Test',
  ADAC: 'Delete All Cookies After Each Test',
  OLO: 'Open Build Config Less Often',
};

export const BuildCapsInfo = {
  AIC:
    'Indicates whether untrusted and self-signed TLS certificates be trusted by the browser.' +
    ' Use it if the application under test could have invalid certificates.',
  CVL:
    'Indicates whether chrome webdriver write verbose logs, use while debugging.',
  CSL: 'Indicates whether chrome webdriver write no logs.',
  CENL: 'Indicates whether chrome webdriver write network logs.',
  CEPL: 'Indicates whether chrome webdriver write page logs.',
  FLL: 'Indicates firefox webdriver log level, use trace while debugging.',
  IELL: 'Indicates IE webdriver log level, use TRACE while debugging.',
  SM:
    'Indicates whether webdriver start the browser maximized before running tests.',
  ST:
    'Indicates the timeout in milliseconds until webdriver waits for a JS script' +
    ' to finish execution before raising error.',
  PLT:
    'Indicates the timeout in milliseconds until webdriver waits for a page to' +
    ' finish loading before raising error.',
  EAT:
    'Indicates the timeout in milliseconds until zylitics test runner waits for' +
    ' an element to appear on page before raising error.',
  SFI:
    'Indicates whether webdriver validate every file input element on page to be' +
    ' interactive. Use it when application under test uses file inputs and need to make sure' +
    ' interactivity before beginning test.',
  UPB:
    'Indicates whether webdriver handles JS alerts implicitly or leave on test to handle' +
    ' when one appears. See documentation for explanation of each option.',
  IEESB:
    'Indicates whether IE webdriver when scrolls an element into viewport, align it to' +
    ' top or bottom of the viewport before interacting.',
  IEEPH:
    'Indicates whether IE webdriver enable persistent hovers, when enabled continuous' +
    ' mouse over events will be fired at last location of mouse pointer. Use it when' +
    ' testing elements that become visible on mouse hovers at certain page location.',
  /*
  From zl-btbr code: (write details documentation for this capability) Also read from changelog
  Let's not enable this by default and give it to use to decide, give mostly all IE caps to them
  to decide as there are of uncertainties and different use case may require different set of
  capabilities. requireWindowFocus still have problems with element.sendKeys and doesn't send
  all keys which is very important requirement for every test. Jim said in a post he has fixed
  it so it now doesn't truncate keys but this doesn't seems to be true. When not using it there
  are some problems in mouse related tests, no all mouse related tests work well like drag and
  drop but most others do and like other drivers the mouse pointer doesn't shows while moving,
  on the other hand when using it, it shows a mouse moving and have better control (although
  much slower). Let's leave it on user to decide what to do since we can't fix it, users that
  may want better mouse control perhaps use actions.sendKeys instead while using this
  capability. Note that the browser window should always be in focus while the test is running.
  */
  IERWF:
    'Read documentation for details on it, there are pros and cons when this is enabled or disabled.' +
    ' By default this is disabled as there are known issues in sending keys to elements.',
  IEDNE:
    'Indicates whether IE webdriver generate native OS level events for performing commands, this' +
    ' is by default enabled as native events closely mimics real user actions.',
};

export const BuildConfigInfo = {
  SV:
    'Select tests that need to run as a suite in builds. Tests can' +
    ' be from across files and can include any versions. Giving a' +
    ' test run order is not supported and discouraged, every test ' +
    " should be able to run on it's own and there shouldn't be a state" +
    ' sharing among them.',
  DR:
    'Select a display resolution for tests, the allocated machine' +
    ' for tests will be set to this resolution.',
  TZ: 'Select a timezone for the allocated machine.',
  SBVIPK:
    'Build variables having more than one values can resolve to a' +
    ' desired value per build/dry-run. The list inside below element' +
    ' shows build variables and the value they currently resolve to.' +
    ' To change the resolved value, expand a variable group and' +
    ' select desired value.',
  AOF:
    'Indicates whether runner abort all remaining tests once a test is failed.',
  AKSW:
    'Indicates whether runner deletes opened browser windows and keep just one' +
    '  after each test, if the last test had opened more than one windows.',
  AUUB: 'Indicates whether runner update url to about:blank after each test.',
  ART: 'Indicates whether runner resets webdriver timeouts after each test.',
  ADAC: 'Indicates whether runner delete all cookies after each test.',
  OLO:
    "Subsequent build runs won't open build config if it" +
    ' has required fields selected, allowing you to run builds' +
    ' faster without additional interruption.',
};

export const MaxLengths = {
  BUILD_CAPS_NAME: 200,
  BUILD_CAPS_TIMEOUT: 3600000,
  UPLOAD_SIZE_MB: 100,
  GCP_OBJECT_NAME: 500,
  PROJECT_NAME: 50,
};

export const BuildCapsTimeouts = {
  ST: 30000,
  PLT: 300000,
  EAT: 60000,
};

export const PromptBehavior = {
  DISMISS: 'dismiss',
  ACCEPT: 'accept',
  DNN: 'dismiss and notify',
  ANN: 'accept and notify',
  IGNORE: 'ignore',
};

export const IEScrollBehavior = {
  TOP: 'top',
  BOTTOM: 'bottom',
};

export const IELogLevel = {
  FATAL: 'FATAL',
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE',
};

export const FirefoxLogLevel = {
  FATAL: 'fatal',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  CONFIG: 'config',
  DEBUG: 'debug',
  TRACE: 'trace',
};

export const Defaults = {
  TIMEZONE: 'UTC',
  DESKTOP_RES: '1366x768',
};

export const ShotIdentifiers = {
  EOS: 'EOS',
  ERROR: 'ERROR',
};

export const ASSET_UPLOAD_IN_PROGRESS_ERROR =
  'Assets upload is still in progress, please try in sometime.';
export const MB_BYTES = 1048576; // (1 KB = 1024 bytes, 1MB = 1024 KB) https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
export const GCP_OBJECT_NAME_REGEX = /[\\/\s*[\]?#]|^\.$|^\.\.$/;
export const GCP_OBJECT_NAME_ILLEGAL_CHARS_STRING =
  '\\, /, Whitespace, *, [, ], ?, #, Dot-As-File-Name, Two-Dots-As-File-Name';

export const QueryKeys = {
  PROJECTS: 'projects',
  TEST_FILES: 'testFiles',
  BUILD_CAPABILITIES: 'buildCapabilities',
};

export const PROJECT_ID_ENDPOINT_VAR_TEMPLATE = '{projectId}';
export const VERSION_ID_ENDPOINT_VAR_TEMPLATE = '{versionId}';
export const VERSION_IDS_ENDPOINT_VAR_TEMPLATE = '{versionIds}';
export const BUILD_ID_ENDPOINT_VAR_TEMPLATE = '{buildId}';
export const PLATFORM_ENDPOINT_VAR_TEMPLATE = '{platform}';

export const Endpoints = {
  PROJECTS: '/projects',
  TEST_FILES: '/testFiles',
  ISSUE: '/issue',
  BUILD_CAPABILITIES: '/buildCapabilities',
  FILES: `/projects/${PROJECT_ID_ENDPOINT_VAR_TEMPLATE}/files`,
  FILES_WITH_TESTS: `/projects/${PROJECT_ID_ENDPOINT_VAR_TEMPLATE}/files/getWithTests`,
  TESTS: '/tests',
  VERSIONS: '/versions',
  VERSION_RENAME: `/versions/${VERSION_ID_ENDPOINT_VAR_TEMPLATE}/renameVersion`,
  VERSION_CODE_UPDATE_PARSE: `/versions/${VERSION_ID_ENDPOINT_VAR_TEMPLATE}/updateCodeAndParse`,
  PARSE: `/versions/${VERSION_IDS_ENDPOINT_VAR_TEMPLATE}/parse`,
  DRY_RUN: `/projects/${PROJECT_ID_ENDPOINT_VAR_TEMPLATE}/versions/${VERSION_ID_ENDPOINT_VAR_TEMPLATE}/dryRun`,
  BUILD_VARS: `/projects/${PROJECT_ID_ENDPOINT_VAR_TEMPLATE}/buildVars`,
  GLOBAL_VARS: `/projects/${PROJECT_ID_ENDPOINT_VAR_TEMPLATE}/globalVars`,
  NEW_BUILD: `/projects/${PROJECT_ID_ENDPOINT_VAR_TEMPLATE}/builds`,
  STOP_BUILD: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/stopBuild`,
  BUILD_STATUS: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/versions/${VERSION_ID_ENDPOINT_VAR_TEMPLATE}/getBuildStatusOutput`,
  LATEST_SHOT: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getLatestShot`,
  SHOT_BASIC_DETAILS: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getShotBasicDetails`,
  BROWSERS: `/platforms/${PLATFORM_ENDPOINT_VAR_TEMPLATE}/browsers`,
  BASIC_BUILD_DETAILS: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getBuildBasicDetails`,
  CAPTURED_BUILD_CAPABILITY: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getCapturedBuildCapability`,
  CAPTURED_BUILD_VARS: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getCapturedBuildVars`,
  CAPTURED_GLOBAL_VARS: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getCapturedGlobalVars`,
  RUNNER_PREFERENCES: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getRunnerPreferences`,
  DRIVER_LOGS: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getDriverLogs`,
  PERFORMANCE_LOGS: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getPerformanceLogs`,
  ELEMENT_SHOT_NAMES: `/builds/${BUILD_ID_ENDPOINT_VAR_TEMPLATE}/getElementShotNames`,
};

export const Timeouts = {
  API_TIMEOUT_SMALL: 60000,
  API_TIMEOUT_LONG: 300000,
  API_TIMEOUT_X_LONG: 600000,
};

export const BuildSourceType = {
  IDE: 'IDE',
  CI: 'CI',
  NOT_IDE: 'NOT_IDE',
};

export const OFFLINE_MSG = "You're offline, waiting for network...";
export const OFFLINE_RECOVERY_TIME = 60000;

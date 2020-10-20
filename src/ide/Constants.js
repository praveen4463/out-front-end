const LeftNavs = {
  EXPLORER: 'EXPLORER',
};

const RightNavs = {
  COMPLETED_BUILDS: 'COMPLETED_BUILDS',
  LIVE_PREVIEW: 'LIVE_PREVIEW',
  DOCUMENTATION: 'DOCUMENTATION',
};

const BottomNavs = {
  BUILD_RUN: 'BUILD_RUN',
  DRY_RUN: 'DRY_RUN',
  PARSE: 'PARSE',
};

const None = 'None';

const ExplorerItemType = {
  FILE: 'FILE',
  TEST: 'TEST',
  VERSION: 'VERSION',
};

const MaxLengths = {
  [ExplorerItemType.FILE]: 50,
  [ExplorerItemType.TEST]: 200,
  [ExplorerItemType.VERSION]: 50,
  VAR_KEY: 100,
  IDE_TEST_HOST_ACQUIRE_TIME_STAGE1: 10000,
  IDE_TEST_HOST_ACQUIRE_TIME_STAGE2: 20000,
};

const ExplorerEditOperationType = {
  NEW_ITEM: 'NEW_ITEM',
  RENAME: 'RENAME',
};

const ZwlLexer = {
  IDENTIFIER: /[a-zA-Z_]\w*/,
  IDENTIFIER_WITH_START_END: /^[a-zA-Z_]\w*$/,
};

const TestProgress = {
  POLL_TIME: 1000,
  API_ERRORS_BEFORE_BAIL_OUT: 6,
};

const LivePreviewConstants = {
  POLL_TIME_WHEN_NOT_FOUND: 1000,
  MAX_POLL_AFTER_NOT_FOUND: 5,
  OFFLINE_RECOVERY_TIME: 30000,
  ERROR_SHOT_FOUND_TEXT:
    "There was an error generating live preview. We've been notified and will be fixing it on topmost priority.",
  COMPLETION_TEXT: 'Live preview has been ended.',
};

const PARSE_SUCCESS_MSG = 'Parsing completed, no problems found';

export {
  LeftNavs,
  RightNavs,
  BottomNavs,
  None,
  ExplorerItemType,
  MaxLengths,
  ExplorerEditOperationType,
  ZwlLexer,
  TestProgress,
  PARSE_SUCCESS_MSG,
  LivePreviewConstants,
};

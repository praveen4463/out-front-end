const LeftNavs = {
  EXPLORER: 'EXPLORER',
};

const RightNavs = {
  COMPLETED_BUILDS: 'COMPLETED_BUILDS',
  LIVE_PREVIEW: 'LIVE_PREVIEW',
  API_REF: 'API_REF',
};

const BottomNavs = {
  BUILD_RUN: 'BUILD_RUN',
  DRY_RUN: 'DRY_RUN',
  PARSE: 'PARSE',
};

// Alternative to null so that props that are required don't get a null.
// TODO: use defaultProps at those places and remove this, mistake during learning
// react.
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

export {
  LeftNavs,
  RightNavs,
  BottomNavs,
  None,
  ExplorerItemType,
  MaxLengths,
  ExplorerEditOperationType,
  ZwlLexer,
};

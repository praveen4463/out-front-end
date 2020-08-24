const LeftNavs = {
  EXPLORER: 'EXPLORER',
};

const RightNavs = {
  COMPLETED_BUILDS: 'COMPLETED_BUILDS',
  LIVE_PREVIEW: 'LIVE_PREVIEW',
  API_REF: 'API_REF',
};

const BottomNavs = {
  BUILD_OUTPUT_STATUS: 'BUILD_OUTPUT_STATUS',
};

// Alternative to null so that props that are required don't get a null.
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
};

const ExplorerEditOperationType = {
  NEW_ITEM: 'NEW_ITEM',
  RENAME: 'RENAME',
};

const RunType = {
  BUILD_RUN: 'BUILD_RUN',
  DRY_RUN: 'DRY_RUN',
  PARSE_RUN: 'PARSE_RUN',
};

export {
  LeftNavs,
  RightNavs,
  BottomNavs,
  None,
  ExplorerItemType,
  MaxLengths,
  ExplorerEditOperationType,
  RunType,
};

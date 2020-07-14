const LeftNavs = {
  EXPLORER: 1,
};

const RightNavs = {
  COMPLETED_BUILDS: 1,
  LIVE_PREVIEW: 2,
  API_REF: 3,
};

const BottomNavs = {
  BUILD_OUTPUT_STATUS: 1,
};

// Alternative to null so that props that are required don't get a null.
const None = -1;

export {LeftNavs, RightNavs, BottomNavs, None};

const versionsHaveLastParseStatus = (etVersions, versionIds) => {
  return versionIds.every((vid) => etVersions[vid].lastParseRun);
};

const versionsHaveParseErrorWhenStatusAvailable = (etVersions, versionIds) => {
  // first validate all versions have a lastParseRun status, if no throw error as this
  // function expects every version to have that.
  if (!versionsHaveLastParseStatus(etVersions, versionIds)) {
    throw new Error('All versions should have lastParseRun status available');
  }
  return versionIds.some((vid) => etVersions[vid].lastParseRun.error);
};

export {versionsHaveParseErrorWhenStatusAvailable, versionsHaveLastParseStatus};

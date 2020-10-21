export const addBuildVar = (config, payload) => {
  if (payload.buildVar === undefined) {
    throw new Error('Insufficient arguments passed to addBuildVar.');
  }
  const {buildVar} = payload;
  const {selectedBuildVarIdPerKey} = config;
  selectedBuildVarIdPerKey[buildVar.key] = buildVar.id;
};

export const onBuildVarDelete = (config, payload) => {
  if (payload.buildVar === undefined) {
    throw new Error('Insufficient arguments passed to onBuildVarDelete.');
  }
  const {buildVar} = payload;
  const {selectedBuildVarIdPerKey} = config;
  if (selectedBuildVarIdPerKey[buildVar.key] === buildVar.id) {
    delete selectedBuildVarIdPerKey[buildVar.key];
  }
};

// TODO: later try to memoize this somehow
export const getOrderedVersionsFromFiles = (stateFiles) => {
  const versions = [];
  const et = stateFiles.entities;
  const {files, tests} = et;
  stateFiles.result.forEach(
    (fid) =>
      files[fid].tests &&
      files[fid].tests.forEach((tid) =>
        tests[tid].versions.forEach((vid) => versions.push(vid))
      )
  );
  // versions now have ordered versions
  return versions;
};

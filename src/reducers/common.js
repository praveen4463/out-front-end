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

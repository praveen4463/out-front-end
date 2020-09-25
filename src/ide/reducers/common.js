// spread operator does nothing when the object is undefined but when an array
// is spread, it should be array.
const getDeepClonedFiles = (files) => {
  const clone = {
    entities: {
      versions: {...files.entities.versions},
      tests: {...files.entities.tests},
      files: {...files.entities.files},
    },
    result: Array.isArray(files.result) ? [...files.result] : [],
  };
  const et = clone.entities;
  Object.keys(et.versions).forEach((k) => {
    et.versions[k] = {...et.versions[k]};
  });
  Object.keys(et.tests).forEach((k) => {
    et.tests[k] = {...et.tests[k]};
    if (Array.isArray(et.tests[k].versions)) {
      et.tests[k].versions = [...et.tests[k].versions];
    }
  });
  Object.keys(et.files).forEach((k) => {
    et.files[k] = {...et.files[k]};
    if (Array.isArray(et.files[k].tests)) {
      et.files[k].tests = [...et.files[k].tests];
    }
  });
  return clone;
};

export default getDeepClonedFiles;

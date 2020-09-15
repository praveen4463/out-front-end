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

export const getSortedNames = (ids, propMapping, propName = 'name') => {
  const pairs = ids.map((id) => [id, propMapping[id][propName]]);
  // The reference referenceStr should be string type, since our names comes
  // via text inputs, it's always string and doesn't need conversion or
  // string concat to make it a string.
  // Note: localeCompare is by far the best for string comparison, reference:
  // https://stackoverflow.com/a/26295229/1624454
  pairs.sort((a, b) => a[1].localeCompare(b[1]));
  // no locale specific options for now, TODO: for later.
  return pairs.map((p) => p[0]);
};

export default getDeepClonedFiles;

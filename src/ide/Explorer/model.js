import {schema} from 'normalizr';
// https://immerjs.github.io/immer/docs/complex-objects Details of immerable
import {immerable} from 'immer';

// These models aren't of much use other than defining what fields are
// possibly available to use/write rather than just setting any arbitrary
// fields in json, I'm trying to keep in a place what data we could've in a
// particular part of application.

// Files model and schema, note that fields those don't belong to db may or may
// not be in data/normalized data.
function Version(id, name, testId, code, isCurrent, hasError, errorMsg) {
  this.id = id;
  this.name = name;
  this.testId = testId;
  this.code = code;
  this.isCurrent = isCurrent;
  this.hasError = hasError;
  this.errorMsg = errorMsg;
  this[immerable] = true;
}

function Test(id, name, fileId, versions, hasError) {
  this.id = id;
  this.name = name;
  this.fileId = fileId;
  this.versions = versions;
  this.hasError = hasError;
  // if any of version in this test has 'hasError=true', the test also contain
  // the flag so that the whole tree could be marked an error.
  this[immerable] = true;
}

function File(id, name, tests, hasError, loadToTree) {
  this.id = id;
  this.name = name;
  this.tests = tests;
  this.hasError = hasError;
  // if any of version in this file has 'hasError=true', the file also contain
  // the flag so that the whole tree could be marked an error.
  this.loadToTree = loadToTree;
  this[immerable] = true;
}

const version = new schema.Entity('versions');
const test = new schema.Entity('tests', {
  versions: [version],
});
const file = new schema.Entity('files', {
  tests: [test],
});
const filesSchema = [file];

/*
When normalized the files array look like following:
{
  entities: {
    versions: {
      "1": {
        id: 1,
        name: "v1",
        code:
          "# when ",
        isCurrent: true,
        hasError: false
      },
      "2": {
        id: 2,
        name: "v1",
        code:
          '# 1. simple ',
        isCurrent: false,
        hasError: false
      },
    },
    tests: {
      "1": {
        id: 1,
        name: "debug button changes color on click",
        versions: [1],
        hasError: false
      },
      "2": {
        id: 2,
        name: "start button begins running test",
        versions: [2, 3],
        hasError: false
      },
    },
    files: {
      "1": {
        id: 1,
        name: "IDE Tests",
        tests: [1, 2, 3],
        hasError: false,
        loadToTree: true
      },
      "2": {
        id: 2,
        name: "Build Run Tests",
        hasError: false,
        loadToTree: true
      }
    }
  },
  result: [1, 2]
};
*/

export {Version, Test, File, filesSchema};

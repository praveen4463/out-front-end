import {schema} from 'normalizr';
// https://immerjs.github.io/immer/docs/complex-objects Details of immerable
import {immerable} from 'immer';

// These models aren't of much use other than defining what fields are
// possibly available to use/write rather than just setting any arbitrary
// fields in json, I'm trying to keep in a place what data we could've in a
// particular part of application.

// Files model and schema, note that fields those don't belong to db may or may
// not be in data/normalized data.

function LastRunError(msg, fromPos, toPos) {
  this.msg = msg;
  this.fromPos = fromPos;
  this.toPos = toPos;
  this[immerable] = true;
}

function LastRun(runType, output, showSuccessMsgInStatus, error) {
  this.runType = runType; // Constants.RunType
  this.output = output; // the raw output received from api, may be null.
  this.showSuccessMsgInStatus = showSuccessMsgInStatus;
  this.error = error; // error is an instance of LastRunError, in future this may be an
  // array of LastRunError to contain multiple errors occurred, for example during
  // parsing. Must be null when there is no error occurred.
  this[immerable] = true;
}

function Version(
  id,
  name,
  testId,
  code,
  isCurrent,
  lastRun,
  lastParseRun, // Additionally keeps lastRun object for parse request, so that
  // parse status of a version is never overwritten by other runs. This is used
  // when running build or dry runs to know parse status of a version so that an
  // api request for parsing is avoided every time a new run is initiated. Note that
  // when a version is parsed, both lastRun and lastParseRun will hold parse status.
  // When a build is run, we would parse and set results to versions, once build runs,
  // we would set it's result to version, loosing parse status. By keeping it separately,
  // we will always know that versions were parsed. If they are changed, they will be
  // automatically parsed, so just one parsing will be enough for the lifetime of IDE.
  showAsErrorInExplorer
) {
  this.id = id;
  this.name = name;
  this.testId = testId;
  this.code = code;
  this.isCurrent = isCurrent;
  this.lastRun = lastRun;
  this.showAsErrorInExplorer = showAsErrorInExplorer;
  // showAsErrorInExplorer should be assigned to a version and it's test and file only when
  // we want to mark them as 'Error' in explorer. For example usually a parse
  // error is shown in explorer up to the root, and build run errors are not.
  this[immerable] = true;
}

function Test(id, name, fileId, versions, showAsErrorInExplorer) {
  this.id = id;
  this.name = name;
  this.fileId = fileId;
  this.versions = versions;
  this.showAsErrorInExplorer = showAsErrorInExplorer;
  // if any of version in this test has 'showAsErrorInExplorer=true', the test also contain
  // the flag so that the whole tree could be marked an error.
  this[immerable] = true;
}

function File(id, name, tests, showAsErrorInExplorer, loadToTree) {
  this.id = id;
  this.name = name;
  this.tests = tests;
  this.showAsErrorInExplorer = showAsErrorInExplorer;
  // if any of version in this file has 'showAsErrorInExplorer=true', the file also contain
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
        showAsErrorInExplorer: false
      },
      "2": {
        id: 2,
        name: "v1",
        code:
          '# 1. simple ',
        isCurrent: false,
        showAsErrorInExplorer: false
      },
    },
    tests: {
      "1": {
        id: 1,
        name: "debug button changes color on click",
        versions: [1],
        showAsErrorInExplorer: false
      },
      "2": {
        id: 2,
        name: "start button begins running test",
        versions: [2, 3],
        showAsErrorInExplorer: false
      },
    },
    files: {
      "1": {
        id: 1,
        name: "IDE Tests",
        tests: [1, 2, 3],
        showAsErrorInExplorer: false,
        loadToTree: true
      },
      "2": {
        id: 2,
        name: "Build Run Tests",
        showAsErrorInExplorer: false,
        loadToTree: true
      }
    }
  },
  result: [1, 2]
};
*/

export {Version, Test, File, filesSchema, LastRun, LastRunError};

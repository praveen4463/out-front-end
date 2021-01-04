import {schema} from 'normalizr';
// https://immerjs.github.io/immer/docs/complex-objects Details of immerable
import {immerable} from 'immer';

function LastRunError(msg, fromPos, toPos) {
  this.msg = msg;
  this.fromPos = fromPos;
  this.toPos = toPos;
  this[immerable] = true;
}

function LastRun(runType, output, showSuccessMsgInStatus, error) {
  this.runType = runType; // Constants.RunType
  this.output = output; // the raw output received from api, may be null.
  this.showSuccessMsgInStatus = showSuccessMsgInStatus; // this may be false when
  // no status regarding success is required in status bar. For instance, tab panel's
  // output status make it false when auto save, auto parses so that user is not
  // interrupted with parse success messages.
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
  lastParseRun, // When any type of run is started, we want to make sure versions
  // passed parsing so that runs don't fail with parsing errors after starting
  // new server or initiating expensive api calls. lastRun field keep last run
  // information of a version, which includes all type of runs. For instances when
  // a version is parsed and then runs as build, lastRun first gets parse info then
  // build info. If the version needs to run again, we need to parse again as we
  // don't know it's parse status (even if it has no parse errors). This field
  // always keeps most recent parse status of a version so that all runs first look
  // into this, if null call api to know the status. Once this has value, no run
  // will have to go to api again to know parse status.
  // When a version has error, this and lastRun both will have parse status but we
  // should use this field only for checking parse status to be consistent.
  showAsErrorInExplorer
) {
  this.id = id;
  this.name = name;
  this.testId = testId;
  this.code = code;
  this.isCurrent = isCurrent;
  this.lastRun = lastRun;
  this.lastParseRun = lastParseRun;
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
  // the flag so that the whole tree could be marked as error.
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

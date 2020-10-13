import {immerable} from 'immer';

function BuildRunVersion(
  versionId,
  status = null,
  currentLine = null,
  timeTaken = null,
  error = null,
  output = null,
  nextOutputToken = null
) {
  this.versionId = versionId;
  this.status = status;
  this.currentLine = currentLine;
  this.timeTaken = timeTaken; // in millis
  this.error = error; // error is an instance of Explorer.model.LastRunError
  this.output = output;
  this.nextOutputToken = nextOutputToken;

  this[immerable] = true;
}

function BuildRun(
  runId,
  buildRunVersions,
  testProgressIntervalId = null,
  error = null,
  completed = false
) {
  this.runId = runId;
  this.buildRunVersions = buildRunVersions; // object of shape {versionId: BuildRunVersion, ...}
  // interval that checks progress of tests
  this.testProgressIntervalId = testProgressIntervalId;
  this.error = error; // any type of error occurred before completion of build, aborts entire build.
  this.completed = completed;

  this[immerable] = true;
}

export {BuildRun, BuildRunVersion};

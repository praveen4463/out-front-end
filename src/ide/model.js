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
  versionIds, // sorted versionIds being tested, kept separately because buildRunVersions
  // object don't keep specific ordering of ids and build.versionIds becomes null on completion.
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

function DryRunVersion(
  versionId,
  status = null,
  timeTaken = null,
  error = null,
  output = null
) {
  this.versionId = versionId;
  this.status = status;
  this.timeTaken = timeTaken; // in millis
  this.error = error; // error is an instance of Explorer.model.LastRunError
  this.output = output;

  this[immerable] = true;
}

function DryRun(
  runId,
  dryRunVersions,
  versionIds, // sorted versionIds being tested, kept separately because dryRunVersions
  // object don't keep specific ordering of ids and dry.versionIds becomes null on completion.
  inProgress = false,
  error = null,
  completed = false
) {
  this.runId = runId;
  this.dryRunVersions = dryRunVersions; // object of shape {versionId: DryRunVersion, ...}
  this.inProgress = inProgress;
  this.error = error; // any type of error occurred before completion of dry run, aborts entire dry run.
  this.completed = completed;

  this[immerable] = true;
}

export {BuildRun, BuildRunVersion, DryRun, DryRunVersion};

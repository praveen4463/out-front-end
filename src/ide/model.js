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
  this.timeTaken = timeTaken;
  this.error = error;
  this.output = output;
  this.nextOutputToken = nextOutputToken;
}

function BuildRun(runId, buildRunVersions, testProgressIntervalId = null) {
  this.runId = runId;
  this.buildRunVersions = buildRunVersions; // object of shape {versionId: BuildRunVersion, ...}
  // interval that checks progress of tests
  this.testProgressIntervalId = testProgressIntervalId;
}

export {BuildRun, BuildRunVersion};

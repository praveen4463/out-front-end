// These models aren't of much use other than defining what fields are
// possibly available to use/write rather than just setting any arbitrary
// fields in json, I'm trying to keep in a place what data we could've in a
// particular part of application.

function Version(id, name, code, isCurrent, hasError, errorMsg) {
  this.id = id;
  this.name = name;
  this.code = code;
  this.isCurrent = isCurrent;
  this.hasError = hasError;
  this.errorMsg = errorMsg;
}

function Test(id, name, versions) {
  this.id = id;
  this.name = name;
  this.versions = versions;
}

function File(id, name, tests, loadToTree) {
  this.id = id;
  this.name = name;
  this.tests = tests;
  this.loadToTree = loadToTree;
}

export {Version, Test, File};

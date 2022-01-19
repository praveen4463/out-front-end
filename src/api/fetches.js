import axios from 'axios';
import {normalize} from 'normalizr';
import {Endpoints} from '../Constants';
import {
  filesWithTestsApiDataToNormalizedSorted,
  fromJson,
  getBuildOutputDetailsEndpoint,
  getCompletedBuildDetailsEndpoint,
  getCompletedVersionStatusEndpoint,
  getCurrentUser,
  getFilesWithTestsEndpoint,
  getNewIntlComparer,
  getRunningBuildSummaryEndpoint,
  getUserFromLocalStorage,
  getVersionOutputDetailsEndpoint,
  prepareEndpoint,
  transformApiBrowserData,
} from '../common';
import {
  BuildOutputDetailsByVersion,
  CompletedBuildDetailsObj,
  CompletedVersionStatus,
  RunningBuildSummary,
  TestVersionDetails,
} from '../model';
import {BuildVars, buildVarsSchema} from '../variables/model';

export const projectsFetch = async () => {
  if (!getCurrentUser()) {
    return {};
  }
  const {data} = await axios(Endpoints.PROJECTS);
  data.sort((a, b) => getNewIntlComparer()(a.name, b.name));
  return data;
};

export const userInStorageFetch = () =>
  getUserFromLocalStorage().then((userInStorage) => userInStorage);

export const userPlanFetch = () =>
  axios(Endpoints.USER_PLAN).then(({data}) => data);

export const apiKeyFetch = () =>
  axios(Endpoints.API_KEY).then(({data}) => data);

export const browsersFetch = () =>
  axios(Endpoints.BROWSERS).then(({data}) => transformApiBrowserData(data));

export const completedBuildDetailsFetch = async ({queryKey}) => {
  const [, buildId] = queryKey;
  const {data} = await axios(getCompletedBuildDetailsEndpoint(buildId));
  const cbd = fromJson(CompletedBuildDetailsObj, data);
  cbd.testVersionDetailsList = cbd.testVersionDetailsList.map((l) =>
    fromJson(TestVersionDetails, l)
  );
  return cbd;
};

export const runningBuildSummaryFetch = async ({queryKey}) => {
  const [, buildId] = queryKey;
  const {data} = await axios(getRunningBuildSummaryEndpoint(buildId));
  const rbs = fromJson(RunningBuildSummary, data);
  rbs.testVersionDetailsList = rbs.testVersionDetailsList.map((l) =>
    fromJson(TestVersionDetails, l)
  );
  return rbs;
};

export const buildOutputFetch = async ({queryKey}) => {
  const [, buildId, versionId] = queryKey;
  const endpoint = versionId
    ? getVersionOutputDetailsEndpoint(buildId, versionId)
    : getBuildOutputDetailsEndpoint(buildId);
  const {data} = await axios(endpoint);
  const toArray = Array.isArray(data) ? data : [data];
  return toArray.map((d) => fromJson(BuildOutputDetailsByVersion, d));
};

export const completedVersionStatusFetch = async ({queryKey}) => {
  const [, buildId, versionId] = queryKey;
  const endpoint = getCompletedVersionStatusEndpoint(buildId, versionId);
  const {data} = await axios(endpoint);
  return fromJson(CompletedVersionStatus, data);
};

export const filesWithTestsFetch = async ({queryKey}) => {
  const [, projectId, config, fileIds] = queryKey;
  const params = {};
  if (fileIds) {
    params.fileIdsFilter = fileIds;
  }
  if (config) {
    // config is FilesWithTestsApiConfig
    const {excludeCode, excludeNoCodeTests} = config;
    if (excludeCode) {
      params.excludeCode = excludeCode;
    }
    if (excludeNoCodeTests) {
      params.excludeNoCodeTests = excludeNoCodeTests;
    }
  }
  const {data} = await axios(getFilesWithTestsEndpoint(projectId), {params});
  return filesWithTestsApiDataToNormalizedSorted(data);
};

export const buildVarsFetch = async ({queryKey}) => {
  const [, projectId] = queryKey;
  const {data} = await axios(prepareEndpoint(Endpoints.BUILD_VARS, projectId));
  const buildVars = data.map((b) => fromJson(BuildVars, b));
  buildVars.sort((a, b) => getNewIntlComparer()(a.key, b.key));
  return normalize(buildVars, buildVarsSchema);
};

export const buildCapabilitiesFetch = async () => {
  const {data} = await axios(Endpoints.BUILD_CAPABILITIES);
  data.sort((a, b) => getNewIntlComparer()(a.name, b.name));
  return data;
};

import axios from 'axios';
import {Endpoints} from '../Constants';
import {
  fromJson,
  getBuildOutputDetailsEndpoint,
  getCompletedBuildDetailsEndpoint,
  getNewIntlComparer,
  getRunningBuildSummaryEndpoint,
  getUserFromLocalStorage,
  getVersionOutputDetailsEndpoint,
  transformApiBrowserData,
} from '../common';
import {
  BuildOutputDetailsByVersion,
  CompletedBuildDetailsObj,
  RunningBuildSummary,
  TestVersionDetails,
} from '../model';

export const projectsFetch = async () => {
  const {data} = await axios(Endpoints.PROJECTS);
  data.sort((a, b) => getNewIntlComparer()(a.name, b.name));
  return data;
};

export const userInStorageFetch = () =>
  getUserFromLocalStorage().then((userInStorage) => userInStorage);

export const userPlanFetch = () =>
  axios(Endpoints.USER_PLAN).then(({data}) => data);

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

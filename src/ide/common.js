import axios from 'axios';
import {CLEAR_VERSIONS_LAST_RUN} from './actionTypes';
import batchActions, {getLastRunAction} from './actionCreators';
import {LastRunError} from './Explorer/model';
import {
  RunType,
  Endpoints,
  VERSION_ID_ENDPOINT_VAR_TEMPLATE,
  PROJECT_ID_ENDPOINT_VAR_TEMPLATE,
} from '../Constants';
import {PARSE_SUCCESS_MSG, ExplorerItemType} from './Constants';
import {prepareEndpoint, handleApiError, getParseEndpoint} from '../common';

const versionsHaveLastParseStatus = (etVersions, versionIds) => {
  return versionIds.every((vid) => etVersions[vid].lastParseRun);
};

const getVersionsNoParseStatus = (etVersions, versionIds) => {
  return versionIds.filter((vid) => !etVersions[vid].lastParseRun);
};

const versionsHaveParseErrorWhenStatusAvailable = (etVersions, versionIds) => {
  // first validate all versions have a lastParseRun status, if no throw error as this
  // function expects every version to have that.
  if (!versionsHaveLastParseStatus(etVersions, versionIds)) {
    throw new Error('All versions should have lastParseRun status available');
  }
  return versionIds.some((vid) => etVersions[vid].lastParseRun.error);
};

const getVersionsWithParseErrorWhenStatusAvailable = (
  etVersions,
  versionIds
) => {
  if (!versionsHaveLastParseStatus(etVersions, versionIds)) {
    throw new Error('All versions should have lastParseRun status available');
  }
  return versionIds.filter((vid) => etVersions[vid].lastParseRun.error);
};

const filterCurrentVersions = (versionIds, etVersions) => {
  return versionIds.filter((vid) => etVersions[vid].isCurrent);
};

const getExplorerItemEndpoint = (itemType, projectId, pathVar) => {
  let endpoint;
  switch (itemType) {
    case ExplorerItemType.FILE:
      endpoint = Endpoints.FILES;
      break;
    case ExplorerItemType.TEST:
      endpoint = Endpoints.TESTS;
      break;
    case ExplorerItemType.VERSION:
      endpoint = Endpoints.VERSIONS;
      break;
    default:
      throw new Error(`Can't recognize ${itemType}`);
  }
  return prepareEndpoint(endpoint, projectId, pathVar);
};

const getFilesEndpoint = (projectId) => {
  return Endpoints.FILES.replace(PROJECT_ID_ENDPOINT_VAR_TEMPLATE, projectId);
};

const getTestsEndpoint = () => {
  return Endpoints.TESTS;
};

const getVersionRenameEndpoint = (versionId) => {
  return Endpoints.VERSION_RENAME.replace(
    VERSION_ID_ENDPOINT_VAR_TEMPLATE,
    versionId
  );
};

const getVersionCodeUpdateAndParseEndpoint = (versionId) => {
  return Endpoints.VERSION_CODE_UPDATE_PARSE.replace(
    VERSION_ID_ENDPOINT_VAR_TEMPLATE,
    versionId
  );
};

const getDryRunEndpoint = (projectId, versionId) => {
  return Endpoints.DRY_RUN.replace(
    VERSION_ID_ENDPOINT_VAR_TEMPLATE,
    versionId
  ).replace(PROJECT_ID_ENDPOINT_VAR_TEMPLATE, projectId);
};

/**
  used to populate last parse status to versionIds having no parse status, it
  returns the versionIds that failed parsing.
*/
const fillLastParseStatusAndGetFailed = (versionIds, dispatch) => {
  async function sendParse(resolve, reject) {
    try {
      const {data} = await axios.get(getParseEndpoint(versionIds.join(',')));
      const actions = [];
      const parseErrorVersionIds = [];
      if (data.length) {
        // we've parse errors in some versions
        data.forEach((d) => {
          const {versionId, error} = d;
          parseErrorVersionIds.push(versionId);
          const lastRunAction = getLastRunAction(
            versionId,
            RunType.PARSE_RUN,
            null,
            new LastRunError(error.msg, error.from, error.to)
          );
          actions.push(lastRunAction);
        });
      }
      // versions that have no parse errors should also have lastRun
      const filteredVersionIds = parseErrorVersionIds.length
        ? versionIds.filter((vid) => parseErrorVersionIds.indexOf(vid) < 0)
        : versionIds;
      filteredVersionIds.forEach((vid) => {
        const lastRunAction = getLastRunAction(
          vid,
          RunType.PARSE_RUN,
          PARSE_SUCCESS_MSG,
          null
        );
        actions.push(lastRunAction);
      });
      dispatch(batchActions(actions));
      resolve(parseErrorVersionIds);
    } catch (error) {
      handleApiError(
        error,
        (errorMsg) => reject(new Error(errorMsg)),
        "Couldn't parse"
      );
      // when parse has exceptions, clear lastRun of all versions.
      dispatch({
        type: CLEAR_VERSIONS_LAST_RUN,
        payload: {versionIds, runType: RunType.PARSE_RUN},
      });
    }
  }
  return new Promise((resolve, reject) => {
    sendParse(resolve, reject);
  });
};

export {
  getVersionsNoParseStatus,
  versionsHaveParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
  fillLastParseStatusAndGetFailed,
  filterCurrentVersions,
  getVersionsWithParseErrorWhenStatusAvailable,
  getExplorerItemEndpoint,
  getVersionRenameEndpoint,
  getVersionCodeUpdateAndParseEndpoint,
  getParseEndpoint,
  getDryRunEndpoint,
  getFilesEndpoint,
  getTestsEndpoint,
};

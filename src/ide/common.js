import batchActions, {getLastRunAction} from './actionCreators';
import {LastRunError} from './Explorer/model';
import {RunType, ApiStatuses} from '../Constants';
import {PARSE_SUCCESS_MSG} from './Constants';

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

/**
  used to populate last parse status to versionIds having no parse status, it
  returns the versionIds that failed parsing.
*/
// TODO: responseData is for testing only until api implemented. Remove once api is there.
const fillLastParseStatusAndGetFailed = (
  versionIds,
  dispatch,
  responseData = null
) => {
  const onSuccess = (response, resolve) => {
    const actions = [];
    const parseErrorVersionIds = [];
    if (response.data) {
      // we've parse errors in some versions
      response.data.forEach((d) => {
        const {versionId} = d;
        parseErrorVersionIds.push(versionId);
        const lastRunAction = getLastRunAction(
          versionId,
          RunType.PARSE_RUN,
          null,
          new LastRunError(d.error.msg, d.error.from, d.error.to)
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
  };
  const onError = (response, reject) => {
    reject(new Error(response.error.reason));
  };
  return new Promise((resolve, reject) => {
    // send versionIds for parsing to api and expect only the failed ones with error.
    // when all succeeded, there will be no data. When api couldn't parse for any
    // reason, status will be failure with reason of error.
    setTimeout(() => {
      /* const response = {
        status: ApiStatuses.SUCCESS,
        data: [
          {
            versionId: versionIds[0],
            error: {
              msg: "no viable alternative at input 'a+' line 2:2",
              from: {line: 2, ch: 1},
              to: {line: 2, ch: 2},
            },
          },
        ],
      }; */
      const response = {
        status: ApiStatuses.SUCCESS,
        data: responseData,
      };
      /* const response = {
        status: ApiStatuses.FAILURE,
        error: {
          reason: 'Internal exception occurred while parsing',
        },
      }; */
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response, resolve);
      } else if (response.status === ApiStatuses.FAILURE) {
        onError(response, reject);
      }
    }, 2000);
  });
};

const filterCurrentVersions = (versionIds, etVersions) => {
  return versionIds.filter((vid) => etVersions[vid].isCurrent);
};

const convertMillisIntoTimeText = (millis) => {
  if (millis < 1000) {
    return `${millis} ms`;
  }
  const d = new Date(70, 0, 1, 0, 0, 0, millis);
  const text = [];
  const days = d.getDate() - 1;
  const hours = d.getHours();
  const mins = d.getMinutes();
  const secs = d.getSeconds();
  const ms = d.getMilliseconds();
  if (days > 0) {
    text.push(`${days} d`);
  }
  if (hours > 0) {
    text.push(`${hours} h`);
  }
  if (mins > 0) {
    text.push(`${mins} m`);
  }
  if (secs > 0) {
    text.push(`${secs} s`);
  }
  if (ms > 0) {
    text.push(`${ms} ms`);
  }
  return text.join(' ');
};

export {
  getVersionsNoParseStatus,
  versionsHaveParseErrorWhenStatusAvailable,
  versionsHaveLastParseStatus,
  fillLastParseStatusAndGetFailed,
  filterCurrentVersions,
  getVersionsWithParseErrorWhenStatusAvailable,
  convertMillisIntoTimeText,
};

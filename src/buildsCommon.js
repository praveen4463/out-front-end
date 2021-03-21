import {captureMessage} from '@sentry/react';
import getDayOfYear from 'date-fns/getDayOfYear';
import axios from 'axios';
import {
  OFFLINE_MSG,
  ShotIdentifiers,
  SnackbarHorPos,
  SnackbarType,
  SnackbarVerPos,
  TestStatus,
  Timeouts,
} from './Constants';
import {SnackbarAlertProps} from './model';
import {handleApiError, newSessionEndpoint} from './common';

export const DlgOpenerType = {
  LOG: 'LOG',
  SCREENSHOT: 'SCREENSHOT',
  ELEMENT_SHOT: 'ELEMENT_SHOT',
  DATA: 'DATA',
  CODE: 'CODE',
  LIVE_PREVIEW: 'LIVE_PREVIEW',
};

export const SHOT_LABEL = 'Screenshots & Playback';

export const JUST_NOW_TIME = 'JUST_NOW_TIME';

export const YET_TO_RUN = 'YET_TO_RUN';

// Note: date-fns Duration doesn't contain a milliseconds field and thus we
// can't use it here.
export const convertMillisIntoTimeText = (millis) => {
  if (millis > 31556952000) {
    throw new RangeError(
      "This method is meant to convert milliseconds lesser than of a year's interval"
    );
  }
  if (millis < 1000) {
    return `${millis}ms`;
  }
  const d = new Date(70, 0, 1, 0, 0, 0, millis);
  const text = [];
  // this is ok to deduct 1 from total days because we're calculating offset from
  // 1st, so if we added for example 74 hours into this date, we get Jan 4th, but
  // we will show 3d 2h...
  const days = getDayOfYear(d) - 1;
  const hours = d.getHours();
  const mins = d.getMinutes();
  const secs = d.getSeconds();
  const ms = d.getMilliseconds();
  if (days > 0) {
    text.push(`${days}d`);
  }
  if (hours > 0) {
    text.push(`${hours}h`);
  }
  if (mins > 0) {
    text.push(`${mins}m`);
  }
  if (secs > 0) {
    text.push(`${secs}s`);
  }
  if (ms > 0) {
    text.push(`${ms}ms`);
  }
  return text.join(' ');
};

export const getTestResultPerStatus = (completedVersions) => {
  const totalForStatus = (status) => {
    return completedVersions.filter((v) => v.status === status).length;
  };
  const totalSuccess = totalForStatus(TestStatus.SUCCESS);
  const totalError = totalForStatus(TestStatus.ERROR);
  const totalStopped = totalForStatus(TestStatus.STOPPED);
  const totalAborted = totalForStatus(TestStatus.ABORTED);
  return {totalSuccess, totalError, totalStopped, totalAborted};
};

export const SHOT_ID_TMPL = '##ID##';

export const LivePreviewConstants = {
  POLL_TIME_WHEN_NOT_FOUND: 500,
  MAX_POLL_AFTER_NOT_FOUND: 20, // precisely set to large value, sometimes the
  // first shot takes time to come, delays such as opening browser, maximizing
  // window etc, slow connection
  OFFLINE_RECOVERY_TIME: 30000,
  ERROR_SHOT_FOUND_TEXT:
    "There was an error generating live preview. We've been notified and working on getting it fixed.",
  COMPLETION_TEXT: 'Live preview has been ended.',
};

export const getShotIdFromName = (shotName) => {
  return shotName.substring(
    shotName.lastIndexOf('-') + 1,
    shotName.lastIndexOf('.')
  );
};

const endIfLastShot = (stringShotId, onPreviewEnd) => {
  if (stringShotId === ShotIdentifiers.EOS) {
    onPreviewEnd();
    return true;
  }
  return false;
};

// !! default null to latestShotIdentifier is important so that when converting
// to number we get a 0 rather than NaN
export const startPreview = (
  unmountedRef,
  setStatusMsg,
  getErrorTypeStatusMsg,
  setImageSrc,
  onPreviewEnd,
  shotUriTemplate,
  latestShotIdentifier = null
) => {
  let numberShotId = Number(latestShotIdentifier);
  if (
    Number.isNaN(numberShotId) &&
    endIfLastShot(latestShotIdentifier, onPreviewEnd)
  ) {
    return;
  }
  numberShotId += 1;

  // !!! TODO: currently the logic to detect an END depends on trying shots
  // that may be unavailable on storage which will lead to 404 errors on
  // browser console. Customer may worry what they are and complain, thus
  // it would be good to mention it somewhere to either ignore those 404 or
  // filter them out in console, tell this to user. Currently we're relying
  // on this method only, and fix later if possible.
  let totalPollsNotFound = 0;
  const show = (stringShotId) => {
    if (unmountedRef.current) {
      return;
    }
    const img = new Image();
    // when image was in cache, onload doesn't invoke if src is mentioned
    // before that, but here in live preview, content can't be in cache as
    // all builds are unique.
    const src = shotUriTemplate.replace(
      SHOT_ID_TMPL,
      stringShotId ?? numberShotId
    );
    // console.log('going to get livePreview image', src);
    img.onload = () => {
      // console.log(`image ${src} loaded`);
      if (stringShotId && endIfLastShot(stringShotId, onPreviewEnd)) {
        return;
      }
      if (totalPollsNotFound > 0) {
        totalPollsNotFound = 0;
      }
      setImageSrc(src);
      numberShotId += 1;
      if (unmountedRef.current) {
        return;
      }
      show(); // move to next immediately, no wait because all shots are taken
      // and uploaded within the runtime of the test. When we try one shot,
      // client take sometime downloading it and at the same time server is
      // uploading next ones.
    };
    img.src = src;
    img.onerror = () => {
      if (unmountedRef.current) {
        return;
      }
      // console.log(`image ${src} has error`);
      // error because we're offline
      if (!navigator.onLine) {
        // when offline, either preview will end of resume from current shot
        const offlineStart = Date.now();
        // show offline message, set image to null for showing a status
        setImageSrc(null);
        // console.log('set offline msg');
        setStatusMsg(getErrorTypeStatusMsg(OFFLINE_MSG));
        const offlineCheckInterval = setInterval(() => {
          if (navigator.onLine) {
            // console.log('back online');
            clearInterval(offlineCheckInterval);
            show(stringShotId); // we're online, try showing the current shot
            return;
          }
          if (
            Date.now() - offlineStart >
            LivePreviewConstants.OFFLINE_RECOVERY_TIME
          ) {
            clearInterval(offlineCheckInterval);
            // console.log('offline limit reached');
            captureMessage(
              'live preview ended with error as user was offline',
              {
                tags: {
                  type: 'warning',
                },
              }
            );
            onPreviewEnd(`Unable to deliver live preview, Network error.`);
          }
          // console.log('offline interval invoked');
        }, 500);
        return;
      }
      // error occurred when online, don't show any message as it may be an
      // end of shots.

      // if we couldn't find eos in storage, that indicate of some
      // storage or server error, let's just show generic error and fix that.
      // don't look into db for error shot, even if it's there we're going to
      // tell use the same error message.
      if (
        totalPollsNotFound === LivePreviewConstants.MAX_POLL_AFTER_NOT_FOUND
      ) {
        captureMessage(
          `${src} couldn't be found within max allowed poll time, live preview will end with error`,
          {
            tags: {
              type: 'error',
            },
          }
        );
        onPreviewEnd(LivePreviewConstants.ERROR_SHOT_FOUND_TEXT);
        return;
      }
      // let's try finding 'actual shot' > eos sequentially for
      // MAX_POLL_AFTER_NOT_FOUND times waiting for POLL_TIME_WHEN_NOT_FOUND
      // in between reattempts.
      // console.log('stringShotId', stringShotId);
      if (!stringShotId) {
        // console.log(`${ShotIdentifiers.EOS} will be tried`);
        // current shot is an actual shot, try if an eos shot is there
        show(ShotIdentifiers.EOS);
        return;
      }
      if (stringShotId === ShotIdentifiers.EOS) {
        // console.log('actual shot will be tried after waiting');
        // current shot is an error, wait and try if the actual shot is now there
        setTimeout(() => {
          totalPollsNotFound += 1;
          return show();
        }, LivePreviewConstants.POLL_TIME_WHEN_NOT_FOUND); // I don't want to
        // wait exponentially, because most of times next shot should be found
        // in 1-2 reattempts of the same poll duration. Take a short poll time
        // as I don't want to wait long if it's a little network blockage at
        // server. If there is really very slow network speed at server, we
        // are better off not showing live preview, I am sure this won't happen
        // many times.
      }
    };
  };
  show();
};

export const newSessionInBackground = (
  buildId,
  buildName,
  setSnackbarAlertProps,
  onFailure = null
) => {
  // Once new buildId is received from api as result of newBuildWithoutSession or
  // reRun call, we begin new session and tell user it's running,
  // if for some reason new session fails, we show an error as snackbar that
  // is at app level so wherever the user is on our app, they will see it.
  // Running builds page will pickup this new build.
  axios
    .post(newSessionEndpoint(buildId), null, {
      timeout: Timeouts.API_TIMEOUT_X_LONG,
    })
    .catch((ex) => {
      handleApiError(
        ex,
        (errorMsg) =>
          setSnackbarAlertProps(
            new SnackbarAlertProps(
              errorMsg,
              SnackbarType.ERROR,
              SnackbarVerPos.TOP,
              SnackbarHorPos.CENTER,
              30000
            )
          ),
        `Couldn't start running # ${buildId}${buildName ? ` ${buildName}` : ''}`
      );
      if (onFailure) {
        onFailure();
      }
    });
};

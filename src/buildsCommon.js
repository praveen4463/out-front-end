import getDayOfYear from 'date-fns/getDayOfYear';
import {TestStatus} from './Constants';

export const JUST_NOW_TIME = 'JUST_NOW_TIME';

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

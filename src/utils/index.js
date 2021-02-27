import format from 'date-fns/format';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
const normalizeString = (s) => {
  if (s) {
    return s.trim().replace(/["\\]/g, '\\$&'); // if string contains dbl quotes or a backslash, escape them.
    // so a string like /[a-z]"\// becomes /[a-z]\"\\// which is a valid string inside dbl quotes.
  }
  return null;
};

export const pushIfNotExists = (array, value) => {
  if (array.indexOf(value) === -1) {
    array.push(value);
  }
};

export const getNumSeqArray = (len) => {
  return Array.from({length: len}, (v, i) => i);
};

export const equalIgnoreCase = (v1, v2) => {
  return v1.toLowerCase() === v2.toLowerCase();
};

/**
 * Formats a date
 * @param {Date} date The Date object
 * @param {string} formatValue Format as per https://date-fns.org/v2.17.0/docs/format
 */
export const formatDate = (date, formatValue) => {
  return format(date, formatValue);
};

/**
 * Formats a unix epoch seconds timestamp
 * Implementation notes: Zylitics api stores and fetches all date-time in UTC and
 * converts them to epochSeconds before passing over to client. Client can now
 * convert epochSeconds to a Date object. The default Date object is in current
 * user's default timezone so if the intention is to show dates to current user's
 * own timezone, there is no need for any locale specified timezone conversion but
 * when we require to show date in other timezone, it will need conversion.
 * @param {number} unixEpochSec timestamp in unix epoch seconds
 * @param {string} formatValue Format as per https://date-fns.org/v2.17.0/docs/format
 */
export const formatTimestamp = (unixEpochSec, formatValue) => {
  return format(new Date(unixEpochSec * 1000), formatValue);
};

export default normalizeString;

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

export default normalizeString;

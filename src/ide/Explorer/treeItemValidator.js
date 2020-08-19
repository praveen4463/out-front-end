import {MaxLengths} from '../Constants';

export default (name, existingNames, itemType) => {
  const targetEl = itemType.toLowerCase();
  if (name.includes('/') || name.includes('\\')) {
    return `A ${targetEl} name can't contain slash characters.`;
  }

  if (name.length > MaxLengths[itemType]) {
    return `A ${targetEl} name can't be more than ${MaxLengths[itemType]} characters.`;
  }

  if (
    Array.isArray(existingNames) &&
    existingNames.some((n) => n.toLowerCase() === name.toLowerCase())
  ) {
    return `A ${targetEl} of the same name already exists.`;
  }

  return null;
};

import {MaxLengths} from '../Constants';

export default (name, existingNames, itemType) => {
  const targetEl = itemType.toLowerCase();

  if (name.include('/') || name.include('\\')) {
    return `${targetEl} name can't contain slash characters`;
  }

  if (name.length > MaxLengths[itemType]) {
    return `${targetEl} name can't be more than ${MaxLengths[itemType]} characters.`;
  }

  if (Array.isArray(existingNames) && existingNames.includes(name)) {
    return `A ${targetEl} of the same name already exists.`;
  }

  return null;
};

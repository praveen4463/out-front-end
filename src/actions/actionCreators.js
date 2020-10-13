import {BUILD_UPDATE_BY_PROP} from './actionTypes';

const getBuildStoppingAction = (isStopping) => {
  return {
    type: BUILD_UPDATE_BY_PROP,
    payload: {prop: 'stopping', value: isStopping},
  };
};

// eslint-disable-next-line import/prefer-default-export
export {getBuildStoppingAction};

import axios from 'axios';
import {Endpoints} from '../Constants';
import {getNewIntlComparer, getUserFromLocalStorage} from '../common';

export const projectsFetch = () => {
  return axios(Endpoints.PROJECTS).then(({data}) => {
    const p = data;
    p.sort((a, b) => getNewIntlComparer()(a.name, b.name));
    return p;
  });
};

export const userInStorageFetch = () =>
  getUserFromLocalStorage().then((userInStorage) => userInStorage);

export const userPlanFetch = () =>
  axios(Endpoints.USER_PLAN).then(({data}) => data);

export const files = () => {};

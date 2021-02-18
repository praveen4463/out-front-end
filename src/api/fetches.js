import axios from 'axios';
import {Endpoints} from '../Constants';
import {getNewIntlComparer} from '../common';

export const projectsFetch = () => {
  return axios(Endpoints.PROJECTS).then(({data}) => {
    const p = data;
    p.sort((a, b) => getNewIntlComparer()(a.name, b.name));
    return p;
  });
};

export const files = () => {};

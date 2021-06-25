import {useHistory, useLocation} from 'react-router-dom';
import queryString from 'query-string';
import {getLocation} from './common';
import {PageUrl} from './Constants';

const SSO = () => {
  const history = useHistory();
  const location = useLocation();
  history.replace(
    getLocation(PageUrl.LOGIN, null, {
      discourseSSO: true,
      params: queryString.parse(location.search),
    })
  );
  return null;
};

export default SSO;

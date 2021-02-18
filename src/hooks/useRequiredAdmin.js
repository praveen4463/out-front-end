import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {useAuthContext} from '../Auth';
import {getLocation} from '../common';
import Application from '../config/application';
import {PageUrl} from '../Constants';

const useRequiredAdmin = () => {
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!auth.authStateLoaded) {
      return;
    }
    if (!auth.user || auth.user.isAnonymous) {
      history.push(getLocation(PageUrl.LOGIN, location.search, {location}));
      return;
    }
    if (!Application.ZYLITICS_ADMIN_EMAILS.includes(auth.user.email)) {
      // when some other user try to access admin, redirect them to 404
      history.replace('/404');
    }
  }, [auth.authStateLoaded, auth.user, history, location]);

  return auth;
};

export default useRequiredAdmin;

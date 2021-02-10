import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {useAuth} from '../Auth';
import Application from '../config/application';
import {PageUrl} from '../Constants';

const useRequiredAdmin = () => {
  const auth = useAuth();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!auth.authStateLoaded) {
      return;
    }
    if (!auth.user || auth.user.isAnonymous) {
      history.push({
        pathname: PageUrl.LOGIN,
        state: {location},
      });
      return;
    }
    if (!Application.ZYLITICS_ADMIN_EMAILS.includes(auth.user.email)) {
      history.replace('/404');
    }
  }, [auth.authStateLoaded, auth.user, history, location]);

  return auth;
};

export default useRequiredAdmin;

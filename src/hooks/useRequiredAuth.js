import {useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {useAuth} from '../Auth';
import {PageUrl} from '../Constants';

const useRequiredAuth = (redirectTo = PageUrl.LOGIN) => {
  const auth = useAuth();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!auth.authStateLoaded) {
      console.log('auth not yet loaded');
      return;
    }
    console.log('auth user', auth.user);
    if (!auth.user || auth.user.isAnonymous) {
      history.push({
        pathname: redirectTo,
        state: {location},
      });
    }
  }, [auth.authStateLoaded, auth.user, history, location, redirectTo]);

  return auth;
};

export default useRequiredAuth;

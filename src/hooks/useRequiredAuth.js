import {useContext, useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {useAuthContext} from '../Auth';
import {getLocation} from '../common';
import {PageUrl} from '../Constants';
import {AppSnackbarContext} from '../contexts';

/**
 * Redirects to a given url when there is no logged in user
 * @param {() => any} redirectFn Provide an optional function to redirect user
 * when they are not authorized or logged in.
 */
const useRequiredAuth = (redirectFn = null) => {
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();
  const [setSnackbarAlertProps] = useContext(AppSnackbarContext);

  useEffect(() => {
    if (!auth.authStateLoaded) {
      // console.log('auth not yet loaded');
      return;
    }
    // console.log('auth user', auth.user);
    if (!auth.user || auth.user.isAnonymous) {
      if (redirectFn) {
        redirectFn();
      } else {
        history.push(getLocation(PageUrl.LOGIN, null, {location}));
      }
    }
  }, [
    auth.authStateLoaded,
    auth.user,
    history,
    location,
    redirectFn,
    setSnackbarAlertProps,
  ]);

  return auth;
};

export default useRequiredAuth;

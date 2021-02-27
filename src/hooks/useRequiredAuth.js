import {useContext, useEffect} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {useAuthContext} from '../Auth';
import {getLocation} from '../common';
import {PageUrl} from '../Constants';
import {AppSnackbarContext} from '../contexts';

/**
 * Redirects to a given url when there is no logged in user
 * @param {() => any} beforeRedirectFn synchronous function to call before
 * redirecting to url when there is no logged in user.
 * @param {string} redirectTo Url of the page to redirect when there is no
 * logged in user
 */
const useRequiredAuth = (beforeRedirectFn = null, redirectTo = null) => {
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();
  const [setSnackbarAlertProps] = useContext(AppSnackbarContext);

  useEffect(() => {
    if (!auth.authStateLoaded) {
      console.log('auth not yet loaded');
      return;
    }
    console.log('auth user', auth.user);
    if (!auth.user || auth.user.isAnonymous) {
      if (beforeRedirectFn) {
        beforeRedirectFn();
      }
      history.push(
        getLocation(redirectTo || PageUrl.LOGIN, location.search, {location})
      );
    }
  }, [
    auth.authStateLoaded,
    auth.user,
    history,
    location,
    redirectTo,
    setSnackbarAlertProps,
    beforeRedirectFn,
  ]);

  return auth;
};

export default useRequiredAuth;

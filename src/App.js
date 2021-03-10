import React, {useCallback, Suspense, lazy} from 'react';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import firebase from 'firebase/app';
import 'firebase/auth';
import {Switch, Route, useLocation, useHistory} from 'react-router-dom';
import {ErrorBoundary} from 'react-error-boundary';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import Home from './Home';
import FinishSignup from './FinishSignup';
import {ProvideAuth} from './Auth';
import NotFound from './NotFound';
import Login from './Login';
import SendBetaInvitations from './admin/SendBetaInvitations';
import {PageUrl, SearchKeys} from './Constants';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import {addInSearchQuery, getLocation, setAxiosAuthToken} from './common';
import SelectAProject from './SelectAProject';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import RootErrorFallback, {rootErrorHandler} from './ErrorBoundary';
import useSnackbarAlert from './hooks/useSnackbarAlert';
import {AppSnackbarContext} from './contexts';
import ChangeEmail from './ChangeEmail';

const Ide = lazy(() => import('./ide'));

const App = () => {
  const location = useLocation();
  const history = useHistory();
  const [
    setSnackbarAlertProps,
    snackbarAlert,
    setSnackbarAlertError,
  ] = useSnackbarAlert();

  const onInit = useCallback((getTokenOfUser, tokenExpTimeSecsRef) => {
    axios.interceptors.request.use((config) => {
      const user = firebase.auth().currentUser;
      // console.log('request interceptor invoked with config', config);
      if (!user) {
        throw new Error('No authenticated user');
      }
      if (user.isAnonymous) {
        // when user is anonymous, tokens can never expire as we sign in just
        // before making a call
        console.warn('interceptor returning as user is anonymous');
        return config;
      }
      // console.log('config request interceptor', config);
      return new Promise((resolve) => {
        if (Math.floor(Date.now() / 1000) < tokenExpTimeSecsRef.current) {
          // console.log('interceptor returning as not expired');
          resolve(config);
          return;
        }
        // console.log('token expired');
        // token is expired, get new one
        getTokenOfUser(user, (idToken) => {
          setAxiosAuthToken(idToken);
          // current request got expired token, axios has already read from
          // default values and won't read it again as we've updated auth header
          // in default, thus for this request, provide auth headers
          const configClone = {...config};
          configClone.headers = configClone.headers
            ? {...configClone.headers}
            : {};
          configClone.headers.Authorization = `Bearer ${idToken}`;
          resolve(configClone);
        });
      });
    });
  }, []);

  const onSignIn = useCallback((uid, idToken, email) => {
    // 1.
    // if user signs-in irrespective to what type they're, set user's id token
    // to auth header in axios. So on every page that uses auth, axios will
    // be defined with auth header making it ready to make authenticated api
    // calls.
    setAxiosAuthToken(idToken);
    // 2.
    // set current user to Sentry to appear with logs
    Sentry.setUser(Sentry.setUser({id: uid, email}));
  }, []);

  const onSignOut = useCallback(() => {
    delete axios.defaults.headers.common.Authorization;
    Sentry.setUser(null);
  }, []);

  const sendToIdeWithReset = () => {
    history.replace(
      getLocation(
        PageUrl.IDE,
        addInSearchQuery(location.search, SearchKeys.RESET_ON_ERROR, 1)
      )
    );
  };

  // !! List all root level url's here
  return (
    <>
      <ProvideAuth
        onInit={onInit}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        showGlobalError={setSnackbarAlertError}>
        {/* on reset we will go to home page as there is currently no state to reset
          It is hoped that the last error shouldn't occur going to empty home url
          without anything in search */}
        <ErrorBoundary
          FallbackComponent={RootErrorFallback}
          onReset={() => history.push(PageUrl.HOME)}
          onError={rootErrorHandler}>
          <AppSnackbarContext.Provider
            value={[setSnackbarAlertProps, setSnackbarAlertError]}>
            <Switch>
              <Route path={PageUrl.SELECT_PROJECT}>
                <SelectAProject />
              </Route>
              <Route path={PageUrl.LOGIN}>
                <Login />
              </Route>
              <Route path={PageUrl.FINISH_SIGNUP}>
                <FinishSignup />
              </Route>
              <Route path={PageUrl.REQUEST_RESET_PWD}>
                <ForgotPassword />
              </Route>
              <Route path={PageUrl.RESET_PWD}>
                <ResetPassword />
              </Route>
              <Route path={PageUrl.EMAIL_CHANGE}>
                <ChangeEmail />
              </Route>
              <Route path={PageUrl.IDE}>
                <Suspense
                  fallback={
                    <PageLoadingIndicator loadingText="Loading Zylitics IDE" />
                  }>
                  {/* Had to put boundary for ide here rather than inside it to
                  catch error thrown at reducer level and those are not in components
                  within ide. Due to outside, it take theme of root level which is fine
                  and doesn't matter much.
                  Make sure to put it inside suspense so that if IDE fails to load due
                  to network error, the top level boundary is run rather than this otherwise
                  this will try to go to IDE on 'retry' and we will have a recursive
                  loop that will not end until ide could load. */}
                  <ErrorBoundary
                    FallbackComponent={RootErrorFallback}
                    onReset={sendToIdeWithReset}
                    onError={rootErrorHandler}>
                    <Ide />
                  </ErrorBoundary>
                </Suspense>
              </Route>
              <Route exact path="/admin/send-beta-invitations">
                <SendBetaInvitations />
              </Route>
              <Route path={PageUrl.HOME}>
                <Home />
              </Route>
              <Route path="*">
                {/* Keep this in the end of switch */}
                <NotFound />
              </Route>
            </Switch>
          </AppSnackbarContext.Provider>
        </ErrorBoundary>
      </ProvideAuth>
      {snackbarAlert}
    </>
  );
};

export default App;

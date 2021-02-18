import React, {useCallback, Suspense, lazy} from 'react';
import {ThemeProvider} from '@material-ui/core/styles';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import firebase from 'firebase/app';
import 'firebase/auth';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import Home from './Home';
import FinishSignup from './FinishSignup';
import ErrorBoundary from './ErrorBoundary';
import darkTheme from './ide/Themes';
import lightTheme from './Themes';
import {ProvideAuth} from './Auth';
import NotFound from './NotFound';
import Login from './Login';
import SendBetaInvitations from './admin/SendBetaInvitations';
import {PageUrl} from './Constants';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Profile from './Profile';
import {setAxiosAuthToken} from './common';
import SelectAProject from './SelectAProject';
import PageLoadingIndicator from './components/PageLoadingIndicator';

const Ide = lazy(() => import('./ide'));

const App = () => {
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

  // !! List all root level url's here
  return (
    <ProvideAuth onInit={onInit} onSignIn={onSignIn} onSignOut={onSignOut}>
      <Router>
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
          <Route path={PageUrl.IDE}>
            <Suspense
              fallback={
                <PageLoadingIndicator loadingText="Loading Zylitics IDE" />
              }>
              <Ide />
            </Suspense>
          </Route>
          <Route path={PageUrl.PROFILE}>
            <Profile />
          </Route>
          <Route exact path="/show-error-boundary-for-test-dark">
            <ThemeProvider theme={darkTheme}>
              <ErrorBoundary
                resetErrorBoundary={() =>
                  console.log('resetErrorBoundary invoked')
                }
              />
            </ThemeProvider>
          </Route>
          <Route exact path="/show-error-boundary-for-test-light">
            <ThemeProvider theme={lightTheme}>
              <ErrorBoundary
                resetErrorBoundary={() =>
                  console.log('resetErrorBoundary invoked')
                }
              />
            </ThemeProvider>
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
      </Router>
    </ProvideAuth>
  );
};

export default App;

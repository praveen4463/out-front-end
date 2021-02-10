import React, {useCallback} from 'react';
import {ThemeProvider} from '@material-ui/core/styles';
import axios from 'axios';
import * as Sentry from '@sentry/react';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import Home from './Home';
import Ide from './ide';
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

const App = () => {
  const onSignIn = useCallback((uid, idToken, email) => {
    // 1.
    // if user signs-in irrespective to what type they're, set user's id token
    // to auth header in axios. So on every page that uses auth, axios will
    // be defined with auth header making it ready to make authenticated api
    // calls.
    axios.defaults.headers.common.Authorization = `Bearer ${idToken}`;
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
    <ProvideAuth onSignIn={onSignIn} onSignOut={onSignOut}>
      <Router>
        <Switch>
          <Route exact path={PageUrl.HOME}>
            <Home />
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
            <Ide />
          </Route>
          <Route path={PageUrl.PROFILE}>
            <Profile />
          </Route>
          <Route path="/show-error-boundary-for-test-dark">
            <ThemeProvider theme={darkTheme}>
              <ErrorBoundary
                resetErrorBoundary={() =>
                  console.log('resetErrorBoundary invoked')
                }
              />
            </ThemeProvider>
          </Route>
          <Route path="/show-error-boundary-for-test-light">
            <ThemeProvider theme={lightTheme}>
              <ErrorBoundary
                resetErrorBoundary={() =>
                  console.log('resetErrorBoundary invoked')
                }
              />
            </ThemeProvider>
          </Route>
          <Route path="/admin/send-beta-invitations">
            <SendBetaInvitations />
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

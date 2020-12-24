import React from 'react';
import ReactDOM from 'react-dom';
import {ErrorBoundary} from 'react-error-boundary';
import {ThemeProvider} from '@material-ui/core/styles';
import {enableMapSet} from 'immer';
import Cookies from 'js-cookie';
import axios from 'axios';
import {QueryClient, QueryClientProvider} from 'react-query';
import RootErrorFallback, {rootErrorHandler} from './ErrorBoundary';
import './index.css';
import Ide from './ide';
import theme from './Themes';
import Application from './config/application';
import 'fontsource-roboto/latin-300.css';
import 'fontsource-roboto/latin-400.css';
import 'fontsource-roboto/latin-500.css';
import 'fontsource-roboto/latin-700.css';
import 'fontsource-source-code-pro/latin-200.css';
import 'fontsource-source-code-pro/latin-300.css';
import 'fontsource-fira-mono/latin-400.css';

enableMapSet();
// TODO: put session cookies manually for now until we've logon, remove it later
// in logon do it properly with expires, domain etc.
// TODO: will have to remove all cookie related code and probably Cookies lib too
// as we're using firebase auth which is not cookie based.
Cookies.set(
  Application.SESSION_ASSET_BUCKET_NAME_COOKIE,
  'zl-session-assets-mum'
);
Cookies.set(Application.USER_NAME_COOKIE, 'Zylitics Admin');

// TODO: write an firebase observer, keep bucket, username etc in an object and pass
// via context and change axios default auth header when token changes.

// TODO: fix these for production, get url from environment and change header to auth token bearer
axios.defaults.baseURL = 'http://localhost:8080/beta';
// we're sending json object specified here https://cloud.google.com/endpoints/docs/openapi/authenticating-users-firebase after base64url encoding just like ESP does. Use http://www.base64url.com/
// for encoding. Example object
/*
  {
    "id": "3",
    "issuer": "google",
    "email": "p@g.com",
    "audiences": ["aud1"],
    "claims": {
      "jwt": "yo"
    }
  }
*/
axios.defaults.headers.common['X-Endpoint-API-UserInfo'] =
  'ewogICJpZCI6ICIzIiwKICAiaXNzdWVyIjogImdvb2dsZSIsCiAgImVtYWlsIjogInBAZy5jb20iLAogICJhdWRpZW5jZXMiOiBbImF1ZDEiXSwKICAiY2xhaW1zIjogewogICAgICJqd3QiOiAieW8iCiAgIH0KfQ';
axios.defaults.timeout = 5000;

// configure react-query
// TODO: refetch on window focus is disabled for now to keep resource usage in budget as we don't have good
// caching strategy at api level, otherwise there will be lot of db hits. Once we're up for some month, think
// about it. Components that badly need it can enable at query level.
const queryClient = new QueryClient({
  defaultOptions: {
    // The staleTime, refetchOnMount, refetchOnWindowFocus should be used per query not globally.
    queries: {
      retry: 5,
    },
  },
});

// TODO: implement onReset error boundary
ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <ErrorBoundary
        FallbackComponent={RootErrorFallback}
        onReset={() => console.log('on reset invoked')}
        onError={rootErrorHandler}>
        <QueryClientProvider client={queryClient}>
          <Ide />
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

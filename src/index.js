import React from 'react';
import ReactDOM from 'react-dom';
import {init} from '@sentry/react';
import {Integrations} from '@sentry/tracing';
import {ErrorBoundary} from 'react-error-boundary';
import {ThemeProvider} from '@material-ui/core/styles';
import {enableMapSet} from 'immer';
import axios from 'axios';
import {QueryClient, QueryClientProvider} from 'react-query';
import Application from './config/application';
import RootErrorFallback, {rootErrorHandler} from './ErrorBoundary';
import './index.css';
import App from './App';
import theme from './Themes';
import 'fontsource-roboto/latin-300.css';
import 'fontsource-roboto/latin-400.css';
import 'fontsource-roboto/latin-500.css';
import 'fontsource-roboto/latin-700.css';
import 'fontsource-source-code-pro/latin-200.css';
import 'fontsource-source-code-pro/latin-300.css';
import 'fontsource-fira-mono/latin-400.css';

// **Immer
// enable Map and Set ================================================
enableMapSet();

// **environment variables =======================================================
const isProduction = process.env.NODE_ENV === 'production';

// **Sentry ======================================================================
// https://docs.sentry.io/platforms/javascript/guides/react/configuration/filtering/
// I've added all of ignore and deny for now as it looks useful
init({
  dsn: isProduction
    ? 'https://8f5fa9b62a4d459b9db9defb6d3e8cc5@o514195.ingest.sentry.io/5617099'
    : '', // disable sdk on local
  integrations: [new Integrations.BrowserTracing()],

  tracesSampleRate: isProduction ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Facebook borked
    'fb_xd_fragment',
    // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
    // reduce this. (thanks @acdha)
    // See http://stackoverflow.com/questions/4113268
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
    'conduitPage',
  ],
  denyUrls: [
    // Facebook flakiness
    /graph\.facebook\.com/i,
    // Facebook blocked
    /connect\.facebook\.net\/en_US\/all\.js/i,
    // Woopra flakiness
    /eatdifferent\.com\.woopra-ns\.com/i,
    /static\.woopra\.com\/js\/woopra\.js/i,
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Other plugins
    /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
    /webappstoolbarba\.texthelp\.com\//i,
    /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
  ],
});

// **Axios =======================================================================
// Note that auth header is set in the callback to authStateChange
axios.defaults.baseURL = isProduction
  ? Application.PRODUCTION_API_BASE_URL
  : Application.LOCAL_API_BASE_URL;
axios.defaults.timeout = 5000;

// **React-Query =================================================================
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
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

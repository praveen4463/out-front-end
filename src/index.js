import React from 'react';
import ReactDOM from 'react-dom';
import {init} from '@sentry/react';
import {Integrations} from '@sentry/tracing';
import {ThemeProvider} from '@material-ui/core/styles';
import {enableMapSet} from 'immer';
import axios from 'axios';
import {QueryClient, QueryClientProvider} from 'react-query';
import {ReactQueryDevtools} from 'react-query/devtools';
import firebase from 'firebase/app';
import 'firebase/analytics';
import {BrowserRouter as Router} from 'react-router-dom';
import localforage from 'localforage';
import {HelmetProvider} from 'react-helmet-async';
import Application from './config/application';
import './index.css';
import App from './App';
import theme from './Themes';
import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import '@fontsource/source-code-pro/latin-200.css';
import '@fontsource/source-code-pro/latin-300.css';
import '@fontsource/fira-mono/latin-400.css';
import '@fontsource/roboto/latin-300-italic.css';
import '@fontsource/roboto/latin-400-italic.css';
import '@fontsource/roboto/latin-500-italic.css';
import '@fontsource/roboto/latin-700-italic.css';
import '@fontsource/source-code-pro/latin-200-italic.css';
import '@fontsource/source-code-pro/latin-300-italic.css';

// **Immer
// enable Map and Set ================================================
enableMapSet();

// **environment variables =======================================================
const isProduction =
  process.env.NODE_ENV === 'production' &&
  document.location.hostname !== 'localhost';

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
// when not in production, assign hostname from location rather than localhost
// so that another network computer could access api
axios.defaults.baseURL = isProduction
  ? Application.PRODUCTION_API_BASE_URL
  : Application.LOCAL_API_URL_TEMPLATE.replace(
      'HOST',
      document.location.hostname
    );
axios.defaults.timeout = 15000; // raised timeouts to cover calls for which we don't wait.

// **React-Query =================================================================
// configure react-query
const queryClient = new QueryClient({
  defaultOptions: {
    // The staleTime, refetchOnMount, refetchOnWindowFocus should be used per query not globally.
    queries: {
      retry: 5,
    },
  },
});

// **LocalForage =======================================================================
localforage.config({
  name: 'ZyliticsLocalStorageDb',
  version: 1.0,
  storeName: 'ZyliticsLocalStorage', // Should be alphanumeric, with underscores.
});

// **Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDGDzeT2kbQxmdS_kCmjs4E4iZqOAU4ejQ',
  authDomain: 'zl-front-end.firebaseapp.com',
  projectId: 'zl-front-end',
  storageBucket: 'zl-front-end.appspot.com',
  messagingSenderId: '786012176086',
  appId: '1:786012176086:web:a1434a98dd522440a6d377',
  measurementId: 'G-KG989GGTNL',
};

const firebaseLocalConfig = {
  apiKey: 'AIzaSyCvjdNXfPTfvSFIKfu3sWB0SsZAQIZkSig',
  authDomain: 'zl-front-end-dev.firebaseapp.com',
  projectId: 'zl-front-end-dev',
  storageBucket: 'zl-front-end-dev.appspot.com',
  messagingSenderId: '780550079910',
  appId: '1:780550079910:web:0b2cd7c931f1ab2c0e3b67',
};

if (!firebase.apps.length) {
  firebase.initializeApp(isProduction ? firebaseConfig : firebaseLocalConfig);
  firebase.analytics();
}

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

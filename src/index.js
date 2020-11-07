import React from 'react';
import ReactDOM from 'react-dom';
import {ErrorBoundary} from 'react-error-boundary';
import {ThemeProvider} from '@material-ui/core/styles';
import {enableMapSet} from 'immer';
import Cookies from 'js-cookie';
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
Cookies.set(
  Application.SESSION_ASSET_BUCKET_NAME_COOKIE,
  'zl-session-assets-mum'
);
Cookies.set(Application.USER_NAME_COOKIE, 'Zylitics Admin');

// TODO: implement onReset error boundary
ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <ErrorBoundary
        FallbackComponent={RootErrorFallback}
        onReset={() => console.log('on reset invoked')}
        onError={rootErrorHandler}>
        <Ide />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

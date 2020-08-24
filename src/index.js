import React from 'react';
import ReactDOM from 'react-dom';
import {ErrorBoundary} from 'react-error-boundary';
import {ThemeProvider} from '@material-ui/core/styles';
import RootErrorFallback, {rootErrorHandler} from './ErrorBoundary';
import './index.css';
import Ide from './ide';
import theme from './Themes';
import 'fontsource-roboto/latin-300.css';
import 'fontsource-roboto/latin-400.css';
import 'fontsource-roboto/latin-500.css';
import 'fontsource-roboto/latin-700.css';
import 'fontsource-source-code-pro/latin-200.css';
import 'fontsource-source-code-pro/latin-300.css';
import 'fontsource-fira-mono/latin-400.css';

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

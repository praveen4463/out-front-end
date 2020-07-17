import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Ide from './ide';
import 'fontsource-roboto/latin-300.css';
import 'fontsource-roboto/latin-400.css';
import 'fontsource-roboto/latin-500.css';
import 'fontsource-roboto/latin-700.css';
import 'fontsource-source-code-pro/latin-200.css';
import 'fontsource-source-code-pro/latin-300.css';

ReactDOM.render(
  <React.StrictMode>
    <Ide />
  </React.StrictMode>,
  document.getElementById('root')
);

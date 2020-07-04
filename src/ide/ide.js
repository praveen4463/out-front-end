import React, {useState} from 'react';
import {createMuiTheme} from '@material-ui/core/styles';
import {ThemeProvider} from '@material-ui/styles';
import TopNavigation from './TopNavigation';
import LeftNavigation from './LeftNavigation';
import BottomNavigation from './BottomNavigation';
import Content from './Content';
import RightNavigation from './RightNavigation';

// https://material.io/design/color/dark-theme.html#ui-application
const highEmphasisOpacity = 0.87;
const defTheme = createMuiTheme(); // not using useTheme() hook because we're
// not in a function, and I need this while creating theme.

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      light: '#e2cdfd',
      main: '#bb86fc',
      dark: '#994af1',
      contrastText: '#000000',
    },
    secondary: {
      light: '#d4f6f2',
      main: '#03dac4',
      dark: '#00b798',
      contrastText: '#000000',
    },
    error: {
      light: '#e49cad',
      main: '#cf6679',
      dark: '#b75463',
      contrastText: '#000000',
    },
    warning: {
      light: '#ffe0b2',
      main: '#ffb84d',
      dark: '#ff9900',
      contrastText: '#000000',
    },
    info: {
      light: '#bbdefb',
      main: '#64b4f6',
      dark: '#2395f3',
      contrastText: '#000000',
    },
    success: {
      light: '#a5d6a6',
      main: '#66bb69',
      dark: '#43a046',
      contrastText: '#000000',
    },
    background: {
      paper: '#212121',
      default: '#121212',
      contrastText: `rgba(255, 255, 255, ${highEmphasisOpacity})`,
    },
    linkTab: {
      hoverBackground: '#424242',
      background: '#323232',
      activeBackground: '#646464',
      activeBackgroundText: '#fff',
    },
  },
  textOpacity: {
    highEmphasis: highEmphasisOpacity,
    mediumEmphasis: 0.6,
    disabled: 0.38,
  },
  overrides: {
    MuiMenuItem: {
      root: {
        fontWeight: 400,
        fontSize: '0.8125rem',
        lineHeight: 1,
        minHeight: '0px',
        opacity: highEmphasisOpacity,
      },
    },
    MuiListItem: {
      gutters: {
        paddingLeft: defTheme.spacing(4),
        paddingRight: defTheme.spacing(4),
      },
    },
    MuiTooltip: {
      arrow: {
        marginTop: '0px',
      },
      tooltip: {
        fontSize: '0.75rem',
        color: `rgba(255, 255, 255, ${highEmphasisOpacity})`,
      },
      tooltipPlacementBottom: {
        [defTheme.breakpoints.down('xl')]: {
          // This style is different per the screen sizes, this breakpoint will
          // keep it same for all sizes under xl
          marginTop: '0.25rem', // using rem rather than px for responsiveness
        },
      },
      tooltipPlacementRight: {
        [defTheme.breakpoints.down('xl')]: {
          // This style is different per the screen sizes, this breakpoint will
          // keep it same for all sizes under xl
          marginLeft: '0.25rem', // using rem rather than px for responsiveness
        },
      },
    },
  },
});

const Ide = () => {
  // May also be null when there is no incoming project found on load, for
  // example user visits IDE without selecting any project/file/test.
  const [selectedProject, setSelectedProject] = useState(1);

  function changeProjectHandler(value) {
    setSelectedProject(value);
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          margin: 0,
        }}>
        <div style={{display: 'flex', flex: '1 1 auto'}}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'fixed',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}>
            <TopNavigation
              selectedProject={selectedProject}
              changeProjectHandler={changeProjectHandler}
            />
            <div
              style={{
                display: 'flex',
                flex: '1 1 auto',
                height: '100%',
                width: 'initial',
              }}>
              <LeftNavigation />
              <Content />
              <RightNavigation />
              <BottomNavigation />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Ide;

import {unstable_createMuiStrictModeTheme as createMuiTheme} from '@material-ui/core/styles';

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
      highlight: '#2b5651',
      contrastText: '#000000',
    },
    error: {
      light: '#f6546c',
      main: '#f63a56',
      dark: '#f60d30',
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
      paperContrast: '#262626',
      navigations: '#363636',
      panelClose: '#282828',
      default: '#121212',
      paperOnDefault: '#181818',
      contrastText: `rgba(255, 255, 255, ${highEmphasisOpacity})`,
    },
    border: {
      light: '#363636',
      dark: '#212121',
    },
    linkTab: {
      hoverBackground: '#525252',
      background: '#424242',
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
        fontSize: '0.875rem',
        lineHeight: 1.5,
        minHeight: '0px',
        opacity: highEmphasisOpacity,
      },
    },
    MuiListItem: {
      gutters: {
        paddingLeft: defTheme.spacing(4),
        paddingRight: defTheme.spacing(12),
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
    MuiInputBase: {
      input: {
        color: `rgba(255, 255, 255, ${highEmphasisOpacity})`,
        fontSize: '0.875rem',
      },
    },
  },
});

export default darkTheme;

import {unstable_createMuiStrictModeTheme as createMuiTheme} from '@material-ui/core/styles';

const highEmphasisOpacity = 0.87;
const defTheme = createMuiTheme();

const lightTheme = createMuiTheme({
  palette: {
    type: 'light',
    primary: {
      light: '#9e47ff',
      main: '#6200ee',
      dark: '#0400ba',
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: '#66fff9',
      main: '#03dac6',
      dark: '#00a896',
      contrastText: '#000000',
    },
    error: {
      light: '#ff747a',
      main: '#ff3b4e',
      dark: '#c40026',
      contrastText: '#000000',
    },
    background: {
      paper: '#FFFFFF',
      paperContrast: '#FFFFFF',
      navigations: '#FFFFFF',
      panelClose: '#FFFFFF',
      default: `#f5f7fa`,
      paperOnDefault: '#FFFFFF',
      contrastText: '#000000',
    },
    border: {
      light: `rgba(0, 0, 0, 0.12)`,
      dark: `rgba(0, 0, 0, 0.87)`,
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
        fontSize: '0.875rem',
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
        fontSize: '0.875rem',
      },
    },
  },
});

export default lightTheme;

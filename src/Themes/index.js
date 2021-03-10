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
      contrastText: `rgba(0, 0, 0, ${highEmphasisOpacity})`,
    },
    background: {
      paper: '#FFFFFF',
      paperContrast: '#f7f7fa',
      navigations: '#f7f7fa',
      panelClose: '#FFFFFF',
      default: '#f5f7fa',
      paperOnDefault: '#FFFFFF',
      contrastText: `rgba(0, 0, 0, ${highEmphasisOpacity})`,
      contrastTextBackground: `#dee2e8`,
    },
    border: {
      light: 'rgba(0, 0, 0, 0.38)',
      lightest: 'rgba(0, 0, 0, 0.10)',
      dark: 'rgba(0, 0, 0, 0.87)',
    },
    action: {
      hover: 'rgba(0, 0, 0, 0.08)',
      hoverOpacity: 0.08,
      selected: 'rgba(0, 0, 0, 0.16)',
      selectedOpacity: 0.16,
      focus: 'rgba(0, 0, 0, 0.2)',
      focusOpacity: 0.2,
      active: 'rgba(0, 0, 0, 0.2)',
      activatedOpacity: 0.2,
    },
    text: {
      light: 'rgba(0, 0, 0, 0.38)',
      medium: 'rgba(0, 0, 0, 0.6)',
      main: `rgba(0, 0, 0, ${highEmphasisOpacity})`,
      dark: 'rgba(0, 0, 0, 1)',
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
    MuiDivider: {
      root: {
        margin: `6px 0`,
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

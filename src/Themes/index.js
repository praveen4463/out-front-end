import {unstable_createMuiStrictModeTheme as createMuiTheme} from '@material-ui/core/styles';

const highEmphasisOpacity = 0.87;

const defTheme = createMuiTheme();

const lightTheme = createMuiTheme({
  palette: {
    type: 'light',
    background: {
      contrastText: `rgba(0, 0, 0, ${highEmphasisOpacity})`,
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
    MuiInputBase: {
      input: {
        color: defTheme.palette.text.primary,
        fontSize: '0.875rem',
      },
    },
    MuiButton: {
      root: {
        textTransform: 'unset',
      },
    },
  },
});

export default lightTheme;

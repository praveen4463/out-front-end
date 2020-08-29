import {unstable_createMuiStrictModeTheme as createMuiTheme} from '@material-ui/core/styles';

const highEmphasisOpacity = 0.87;

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
});

export default lightTheme;

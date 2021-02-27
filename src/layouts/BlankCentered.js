import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import Link from '@material-ui/core/Link';
import {getLocation, getZyliticsLogo} from '../common';
import {PageUrl} from '../Constants';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    width: '100vw',
    height: '100vh',
  },
  contentBox: {
    border: `1px solid ${theme.palette.border.light}`,
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    padding: `${theme.spacing(4)}px ${theme.spacing(2)}px`,
  },
}));

const BlankCentered = ({width, linkOnLogo, children}) => {
  const location = useLocation();
  const classes = useStyles();
  return (
    <>
      <CssBaseline />
      <Container classes={{root: classes.root}}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box pt={5} pb={3}>
            {linkOnLogo ? (
              <Link
                component={RouterLink}
                to={getLocation(PageUrl.HOME, location.search)}
                aria-label="Home"
                title="Home">
                {getZyliticsLogo()}
              </Link>
            ) : (
              getZyliticsLogo()
            )}
          </Box>
          <Box className={classes.contentBox} width={width}>
            {children}
          </Box>
        </Box>
      </Container>
    </>
  );
};

BlankCentered.propTypes = {
  width: PropTypes.string.isRequired,
  linkOnLogo: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

BlankCentered.defaultProps = {
  linkOnLogo: false,
};

export default BlankCentered;

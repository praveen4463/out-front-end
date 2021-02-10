import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import {makeStyles} from '@material-ui/styles';
import PropTypes from 'prop-types';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import Link from '@material-ui/core/Link';
import {getLocation, getStaticImageUrl} from '../common';
import {PageUrl} from '../Constants';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
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

const BlankCentered = ({width, children}) => {
  const location = useLocation();
  const classes = useStyles();
  return (
    <>
      <CssBaseline />
      <Container classes={{root: classes.root}}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box pt={5} pb={3}>
            <Link
              component={RouterLink}
              to={getLocation(PageUrl.HOME, location.search)}
              aria-label="Home"
              title="Home">
              <img
                src={getStaticImageUrl('zylitics_logo.svg')}
                alt="Zylitics Logo"
                style={{width: '120px', height: '36px'}}
              />
            </Link>
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
  children: PropTypes.node.isRequired,
};

export default BlankCentered;

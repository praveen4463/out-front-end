import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import Link from '@material-ui/core/Link';
import {getLocation} from '../common';
import logo from '../assets/logo.svg';
import {PageUrl} from '../Constants';
import Application from '../config/application';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1280px',
  },
}));

const BlankCentered = ({linkOnLogo, children}) => {
  const location = useLocation();
  const classes = useStyles();

  const getZyliticsLogo = () => <img src={logo} alt="Outomated Logo" />;

  return (
    <>
      <CssBaseline />
      <Box classes={{root: classes.root}}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width="100%"
          style={{margin: '0 auto'}}>
          <Box py={5}>
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
          <Box className={classes.contentBox}>
            {children}
            <Box pt={2} fontWeight={500} fontSize="body2.fontSize">
              <Link
                href={Application.ABOUT_ZYLITICS_URL}
                aria-label="About zylitics"
                title="About zylitics">
                About
              </Link>
              {'  .  '}
              <Link
                href={`${Application.ABOUT_ZYLITICS_URL}/contact`}
                aria-label="Contact zylitics"
                title="Contact zylitics">
                Contact
              </Link>
              {'  .  '}
              <Link
                href={Application.COMMUNITY_ZYLITICS_URL}
                aria-label="Community"
                title="Community">
                Community
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

BlankCentered.propTypes = {
  linkOnLogo: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

BlankCentered.defaultProps = {
  linkOnLogo: false,
};

export default BlankCentered;

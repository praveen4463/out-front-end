import React from 'react';
import Box from '@material-ui/core/Box';
import {Link as RouterLink} from 'react-router-dom';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {Helmet} from 'react-helmet-async';
import {PageUrl} from './Constants';
import {composePageTitle} from './common';

const NotFound = () => {
  return (
    <Box display="flex" flexDirection="column" width="100%" alignItems="center">
      <Helmet title={composePageTitle('404 not found')} />
      <Box pt={6}>
        <Typography variant="h3">404</Typography>
      </Box>
      <Box pt={8}>
        <Typography variant="h6">Page Not Found</Typography>
      </Box>
      <Box pt={1}>
        <Typography variant="body1" color="textSecondary">
          Make sure the address is correct
        </Typography>
      </Box>
      <Box pt={1}>
        <Typography variant="body1" color="textSecondary">
          Please contact us if you think this is a mistake
        </Typography>
      </Box>
      <Box pt={3}>
        <Button
          component={RouterLink}
          to={PageUrl.HOME}
          aria-label="Home"
          variant="contained"
          color="primary">
          Take me to home
        </Button>
      </Box>
    </Box>
  );
};

export default NotFound;

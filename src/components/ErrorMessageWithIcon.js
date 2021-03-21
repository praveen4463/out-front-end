import React from 'react';
import Box from '@material-ui/core/Box';
import ErrorIcon from '@material-ui/icons/Error';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

const ErrorMessageWithIcon = ({msg}) => {
  return (
    <Box
      mt="10%"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flex={1}
      color="error.main">
      <ErrorIcon color="error" style={{marginRight: '4px'}} />
      <Typography variant="body1">{msg}</Typography>
    </Box>
  );
};

ErrorMessageWithIcon.propTypes = {
  msg: PropTypes.string.isRequired,
};

export default ErrorMessageWithIcon;

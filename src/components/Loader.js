import React from 'react';
import MuiSkeleton from '@material-ui/lab/Skeleton';
import {withStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import {getNumSeqArray} from '../utils';

const Skeleton = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.contrastText,
    margin: theme.spacing(1),
  },
}))(MuiSkeleton);

const Loader = ({rows, key}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      flex={1}
      key={key ?? ''}>
      {getNumSeqArray(rows).map((k) => (
        <Skeleton variant="text" width="80%" height={15} key={k} />
      ))}
    </Box>
  );
};

Loader.propTypes = {
  rows: PropTypes.number.isRequired,
  key: PropTypes.string,
};

Loader.defaultProps = {
  key: null,
};

export default Loader;

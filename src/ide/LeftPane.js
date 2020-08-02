import React, {useMemo} from 'react';
import {useTheme} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Explorer from './Explorer';
import {LeftNavs} from './Constants';

// Not making this component pure as it doesn't do much, will make child's pure
// so that they can have custom logic if required.
const LeftPane = ({closeHandler, selected}) => {
  const theme = useTheme();

  const closeButton = useMemo(
    () => (
      <IconButton
        aria-label="Close Panel"
        onClick={closeHandler}
        title="Close Panel"
        style={{
          padding: theme.spacing(0.5),
          opacity: theme.textOpacity.highEmphasis,
        }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    ),
    [closeHandler, theme] // closeHandler doesn't change
  );
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'scroll',
      }}>
      <Box flex={1}>
        {selected === LeftNavs.EXPLORER && (
          <Explorer closeButton={closeButton} />
        )}
      </Box>
    </div>
  );
};

LeftPane.propTypes = {
  closeHandler: PropTypes.func.isRequired,
  selected: PropTypes.string.isRequired,
};

export default LeftPane;

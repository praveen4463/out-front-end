import React from 'react';
import {useTheme} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Explorer from './Explorer';
import {LeftNavs} from './Constants';

const LeftPane = ({closeHandler, selected, files}) => {
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <Box
        display="flex"
        justifyContent="flex-end"
        boxShadow={3}
        style={{backgroundColor: theme.palette.background.panelClose}}>
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
      </Box>
      <Box flex={1}>
        {selected === LeftNavs.EXPLORER && <Explorer files={files} />}
      </Box>
    </div>
  );
};

LeftPane.propTypes = {
  closeHandler: PropTypes.func.isRequired,
  selected: PropTypes.string.isRequired,
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default LeftPane;

import React from 'react';
import {useTheme} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Explorer from './Explorer';
import {LeftNavs} from './NavigationEnum';

const LeftPane = (props) => {
  const {closeHandler, selected} = props;
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'row-reverse',
      }}>
      <Box top={0} right={0} display="inline-block">
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
      <Box flex={1}>{selected === LeftNavs.Explorer && <Explorer />}</Box>
    </div>
  );
};

LeftPane.propTypes = {
  closeHandler: PropTypes.func.isRequired,
  selected: PropTypes.number.isRequired,
};

export default LeftPane;

import React from 'react';
import {useTheme} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Editor from './Editor';

const MidContent = (props) => {
  const {lineColContainerRef} = props;
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.default,
        height: '100%',
        width: '100%',
      }}>
      <Editor lineColContainerRef={lineColContainerRef} />
    </div>
  );
};

MidContent.propTypes = {
  lineColContainerRef: PropTypes.exact({
    current: PropTypes.any,
  }).isRequired,
};

export default MidContent;

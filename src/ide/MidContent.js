import React from 'react';
import {useTheme} from '@material-ui/core/styles';
import Editor from './Editor';

const MidContent = () => {
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.default,
        height: '100%',
        width: '100%',
      }}>
      <Editor />
    </div>
  );
};

export default MidContent;

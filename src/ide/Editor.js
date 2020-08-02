import React from 'react';
import {useTheme} from '@material-ui/core/styles';

const Editor = () => {
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.default,
        height: '100%',
        width: '100%',
      }}>
      This is editor
    </div>
  );
};

export default Editor;

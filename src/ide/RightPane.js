import React from 'react';
import {useTheme} from '@material-ui/core/styles';

const RightPane = () => {
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        width: '100%',
      }}
    />
  );
};

export default RightPane;

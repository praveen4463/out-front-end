import React, {useState, useCallback} from 'react';
import SnackbarTypeInfo from '../components/SnackbarTypeInfo';

const useSnackbarTypeInfo = (key) => {
  const [snackbarInfoMsg, setSnackbarInfoMsg] = useState(null);

  const handleOnClose = useCallback(() => {
    setSnackbarInfoMsg(null);
  }, []);

  const snackbarTypeInfo = (
    <SnackbarTypeInfo
      key={key ?? snackbarInfoMsg ?? ''}
      message={snackbarInfoMsg}
      open={Boolean(snackbarInfoMsg)}
      onClose={handleOnClose}
    />
  );

  return [setSnackbarInfoMsg, snackbarTypeInfo];
};

export default useSnackbarTypeInfo;

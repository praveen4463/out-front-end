import React, {useState, useCallback} from 'react';
import SnackbarTypeError from '../components/SnackbarTypeError';

const useSnackbarTypeError = (key) => {
  const [snackbarErrorMsg, setSnackbarErrorMsg] = useState(null);

  const setSnackbarErrorClose = useCallback(() => {
    setSnackbarErrorMsg(null);
  }, []);

  const snackbarTypeError = (
    <SnackbarTypeError
      key={key ?? snackbarErrorMsg ?? ''}
      error={snackbarErrorMsg}
      errorOn={Boolean(snackbarErrorMsg)}
      setErrorClose={setSnackbarErrorClose}
    />
  );

  return [setSnackbarErrorMsg, snackbarTypeError];
};

export default useSnackbarTypeError;

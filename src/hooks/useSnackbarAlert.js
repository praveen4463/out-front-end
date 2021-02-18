import React, {useState, useCallback} from 'react';
import SnackbarAlert from '../components/SnackbarAlert';
import {SnackbarHorPos, SnackbarType, SnackbarVerPos} from '../Constants';
import {SnackbarAlertProps} from '../model';

const useSnackbarAlert = () => {
  const [snackbarAlertProps, setSnackbarAlertProps] = useState(
    new SnackbarAlertProps()
  );

  const handleOnClose = useCallback(() => {
    setSnackbarAlertProps(new SnackbarAlertProps());
  }, []);

  // convenience function to set an error message without having to specify
  // type and instantiate SnackbarAlertProps
  const setSnackbarAlertError = useCallback((errorMsg) => {
    setSnackbarAlertProps(new SnackbarAlertProps(errorMsg, SnackbarType.ERROR));
  }, []);

  const snackbarAlert = (
    <SnackbarAlert
      key={snackbarAlertProps.message ?? ''}
      message={snackbarAlertProps.message}
      open={Boolean(snackbarAlertProps.message)}
      onClose={handleOnClose}
      type={snackbarAlertProps.type}
      verPos={snackbarAlertProps.verPos || SnackbarVerPos.BOTTOM}
      horPos={snackbarAlertProps.horPos || SnackbarHorPos.RIGHT}
    />
  );

  return [setSnackbarAlertProps, snackbarAlert, setSnackbarAlertError];
};

export default useSnackbarAlert;

import React, {useState, useCallback} from 'react';
import SnackbarAlert from '../components/SnackbarAlert';
import {SnackbarHorPos, SnackbarType, SnackbarVerPos} from '../Constants';
import {SnackbarAlertProps} from '../model';

const useSnackbarAlert = () => {
  const [snackbarAlertProps, setSnackbarAlertProps] = useState(
    new SnackbarAlertProps()
  );
  const normalizedProps = snackbarAlertProps ?? new SnackbarAlertProps();

  const handleOnClose = useCallback(() => {
    setSnackbarAlertProps(null);
  }, []);

  // convenience function to set an error message without having to specify
  // type and instantiate SnackbarAlertProps
  const setSnackbarAlertError = useCallback((errorMsg) => {
    setSnackbarAlertProps(new SnackbarAlertProps(errorMsg, SnackbarType.ERROR));
  }, []);

  const snackbarAlert = (
    <SnackbarAlert
      key={normalizedProps.message ?? ''}
      message={normalizedProps.message}
      open={Boolean(normalizedProps.message)}
      onClose={handleOnClose}
      type={normalizedProps.type}
      verPos={normalizedProps.verPos || SnackbarVerPos.BOTTOM}
      horPos={normalizedProps.horPos || SnackbarHorPos.RIGHT}
      autoHideDuration={normalizedProps.autoHideDuration}
    />
  );

  return [setSnackbarAlertProps, snackbarAlert, setSnackbarAlertError];
};

export default useSnackbarAlert;

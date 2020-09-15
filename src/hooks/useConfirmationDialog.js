import React, {useState, useCallback} from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

const useConfirmationDialog = (onAccept, acceptText, dlgContent, ariaDesc) => {
  const [show, setShow] = useState(false);

  const cancelHandler = useCallback((e) => {
    e.stopPropagation();
    setShow(false);
  }, []);

  const confirmationDialog = (
    <ConfirmationDialog
      showDlg={show}
      setShowDlg={setShow}
      cancelHandler={cancelHandler}
      onAccept={onAccept}
      acceptText={acceptText}
      dlgContent={dlgContent}
      ariaDesc={ariaDesc}
    />
  );

  return [setShow, confirmationDialog];
};

export default useConfirmationDialog;

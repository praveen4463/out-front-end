import React, {useState} from 'react';
import Pricing from '../components/Pricing';
import TitleDialog from '../components/TitleDialog';

const usePricingDialog = () => {
  const [show, setShow] = useState(false);
  const [onSelectCallback, setOnSelectCallback] = useState(null);

  const setPricingDlg = (callback) => {
    setShow(true);
    setOnSelectCallback(() => callback); // use a function to set another func
  };

  const onSelect = (plan) => {
    onSelectCallback(plan);
    setShow(false);
  };

  const pricingDialog = (
    <TitleDialog showDialog={show} closeDialog={() => null}>
      <Pricing onSelect={onSelect} />
    </TitleDialog>
  );

  return [setPricingDlg, pricingDialog];
};

export default usePricingDialog;

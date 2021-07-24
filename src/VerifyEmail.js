import React, {useEffect, useContext} from 'react';
import {useParams, useHistory, useLocation} from 'react-router-dom';
import axios from 'axios';
import {AppSnackbarContext} from './contexts';
import {SnackbarAlertProps} from './model';
import useRequiredAuth from './hooks/useRequiredAuth';
import {
  PageUrl,
  SnackbarHorPos,
  SnackbarType,
  SnackbarVerPos,
} from './Constants';
import {
  getValidateEmailVerificationEndpoint,
  getLocation,
  handleApiError,
} from './common';
import PageLoadingIndicator from './components/PageLoadingIndicator';

const VerifyEmail = () => {
  const {code} = useParams();
  const history = useHistory();
  const location = useLocation();
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    AppSnackbarContext
  );
  const auth = useRequiredAuth(() => {
    setSnackbarAlertProps(
      new SnackbarAlertProps(
        'Email verification requires you to be logged in. Please login.',
        SnackbarType.INFO,
        SnackbarVerPos.TOP,
        SnackbarHorPos.CENTER,
        20000
      )
    );
    history.push(getLocation(PageUrl.LOGIN, location.search, {location}));
  });

  useEffect(() => {
    if (!auth.user) {
      return;
    }
    axios
      .patch(getValidateEmailVerificationEndpoint(code))
      .then(() => {
        setSnackbarAlertProps(
          new SnackbarAlertProps(
            'Thanks for verifying your email!',
            SnackbarType.SUCCESS,
            SnackbarVerPos.TOP,
            SnackbarHorPos.CENTER,
            10000
          )
        );
      })
      .catch((ex) => handleApiError(ex, setSnackbarAlertError))
      .finally(() => history.replace(PageUrl.HOME));
  }, [auth, code, history, setSnackbarAlertError, setSnackbarAlertProps]);

  return <PageLoadingIndicator />;
};

export default VerifyEmail;

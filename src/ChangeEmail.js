import React, {useState, useEffect, useRef, useContext} from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import {useParams, useHistory} from 'react-router-dom';
import axios from 'axios';
import BlankCentered from './layouts/BlankCentered';
import {
  PageUrl,
  SnackbarHorPos,
  SnackbarType,
  SnackbarVerPos,
} from './Constants';
import {
  getChangeEmailEndpoint,
  getValidateEmailChangeEndpoint,
  handleApiError,
} from './common';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {AppSnackbarContext} from './contexts';
import {SnackbarAlertProps} from './model';
import useRequiredAuth from './hooks/useRequiredAuth';

const useStyles = makeStyles((theme) => ({
  alert: {
    padding: `0 ${theme.spacing(2)}px`,
  },
}));

const ChangeEmail = () => {
  const {code} = useParams();
  const [setSnackbarAlertProps] = useContext(AppSnackbarContext);
  const auth = useRequiredAuth(() =>
    setSnackbarAlertProps(
      new SnackbarAlertProps(
        'You need to be logged in before email change proceeds, please login with your current email.',
        SnackbarType.INFO,
        SnackbarVerPos.TOP,
        SnackbarHorPos.CENTER,
        10000
      )
    )
  );
  const [changeValidationResponse, setChangeValidationResponse] = useState(
    null
  );
  const [error, setError] = useState(null);
  const validationCallInitiatedRef = useRef(false);
  const emailChangeCallInitiatedRef = useRef(false);
  const history = useHistory();

  const classes = useStyles();

  useEffect(() => {
    if (!auth.user || validationCallInitiatedRef.current) {
      return;
    }
    validationCallInitiatedRef.current = true;
    axios
      .patch(getValidateEmailChangeEndpoint(code))
      .then(({data}) => setChangeValidationResponse(data))
      .catch((ex) => handleApiError(ex, setError));
  }, [auth, code]);

  useEffect(() => {
    if (!changeValidationResponse || emailChangeCallInitiatedRef.current) {
      return;
    }
    emailChangeCallInitiatedRef.current = true;
    // response contains only emailChangeId no object
    axios
      .patch(getChangeEmailEndpoint(changeValidationResponse))
      .then(() => {
        // When email is changed, ask user to login again
        auth.signOut(() => {
          setSnackbarAlertProps(
            new SnackbarAlertProps(
              'Your email has been changed, please login with the new email.',
              SnackbarType.SUCCESS,
              SnackbarVerPos.TOP,
              SnackbarHorPos.CENTER,
              30000
            )
          );
          history.replace(PageUrl.LOGIN);
        });
      })
      .catch((ex) => handleApiError(ex, setError));
  }, [auth, history, changeValidationResponse, setSnackbarAlertProps]);

  if (!error) {
    return (
      <PageLoadingIndicator loadingText="Verifying request, it may take a few seconds" />
    );
  }
  return (
    <BlankCentered width="35%">
      <Box width="100%">
        <Alert variant="filled" className={classes.alert} severity="error">
          <Typography variant="body1">{error}</Typography>
        </Alert>
      </Box>
    </BlankCentered>
  );
};

export default ChangeEmail;

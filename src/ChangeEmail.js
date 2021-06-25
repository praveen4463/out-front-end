import React, {useState, useEffect, useRef, useContext} from 'react';
import {useParams, useHistory, useLocation} from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
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
  getLocation,
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
  root: {
    border: `1px solid ${theme.palette.border.light}`,
    backgroundColor: '#FFFFFF',
    [theme.breakpoints.up('lg')]: {
      width: '35%',
      padding: theme.spacing(4, 2),
    },
    [theme.breakpoints.only('md')]: {
      width: '50%',
      padding: theme.spacing(4, 2),
    },
    [theme.breakpoints.only('sm')]: {
      width: '60%',
      padding: theme.spacing(2, 1),
    },
    [theme.breakpoints.only('xs')]: {
      width: '95%',
      padding: theme.spacing(1, 0.5),
    },
  },
}));

const ChangeEmail = () => {
  const {code} = useParams();
  const history = useHistory();
  const location = useLocation();
  const cancelRequiredAuthRef = useRef(false);
  const [setSnackbarAlertProps] = useContext(AppSnackbarContext);
  const auth = useRequiredAuth(() => {
    if (cancelRequiredAuthRef.current) {
      return;
    }
    setSnackbarAlertProps(
      new SnackbarAlertProps(
        'You need to be logged in before email change proceeds, please login with your current email.',
        SnackbarType.INFO,
        SnackbarVerPos.TOP,
        SnackbarHorPos.CENTER,
        20000
      )
    );
    history.push(getLocation(PageUrl.LOGIN, location.search, {location}));
  });
  const [changeValidationResponse, setChangeValidationResponse] = useState(
    null
  );
  const [error, setError] = useState(null);
  const validationCallInitiatedRef = useRef(false);
  const emailChangeCallInitiatedRef = useRef(false);

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
        cancelRequiredAuthRef.current = true; // cancel redirection triggered by
        // the hook so that when we sign out, we have complete control over redirection
        // and any messages shown to user.
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
    <BlankCentered>
      <Box className={classes.root}>
        <Alert variant="filled" className={classes.alert} severity="error">
          <Typography variant="body1">{error}</Typography>
        </Alert>
      </Box>
    </BlankCentered>
  );
};

export default ChangeEmail;

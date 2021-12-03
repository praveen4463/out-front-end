import React, {useState, useEffect} from 'react';
import {useParams, useHistory, useLocation} from 'react-router-dom';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import BlankCentered from './layouts/BlankCentered';
import {PageUrl, SignupUserType} from './Constants';
import {
  getLocation,
  getValidateTeamInviteEndpoint,
  handleApiError,
  invokeApiWithAnonymousAuth,
} from './common';
import PageLoadingIndicator from './components/PageLoadingIndicator';
import {useAuthContext} from './Auth';

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

const FinishTeamInvite = () => {
  const {code} = useParams();
  const auth = useAuthContext();
  const history = useHistory();
  const location = useLocation();
  const [error, setError] = useState(null);

  const classes = useStyles();

  useEffect(() => {
    invokeApiWithAnonymousAuth(
      auth,
      {
        url: getValidateTeamInviteEndpoint(code),
        method: 'patch',
      },
      ({data}) => {
        const {emailVerificationId, email, organizationName} = data;
        history.push(
          getLocation(PageUrl.FINISH_SIGNUP, location.search, {
            userType: SignupUserType.TEAM_MEMBER,
            email,
            emailVerificationId,
            organizationName,
          })
        );
      },
      (ex) => handleApiError(ex, setError)
    );
  }, [auth, code, history, location]);

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

export default FinishTeamInvite;

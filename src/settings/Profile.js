import React, {useState, useContext, useEffect} from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import axios from 'axios';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {HomeLinearProgressContext, SettingsSnackbarContext} from '../contexts';
import {
  getRoleDisplayName,
  handleApiError,
  storeUserToLocalStorage,
  getLocation,
  fromJson,
  keyUpHandler,
} from '../common';
import {SnackbarAlertProps, UserInLocalStorage} from '../model';
import {
  Endpoints,
  PageUrl,
  QueryKeys,
  Role,
  SnackbarHorPos,
  SnackbarType,
  SnackbarVerPos,
} from '../Constants';
import {userInStorageFetch} from '../api/fetches';

const FNAME = 'First name';
const LNAME = 'Last name';
const ORG = 'Organization';
const EMAIL = 'Email';
const PWD = 'Password';
const ROLE = 'Role';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  buttonSave: {
    padding: theme.spacing(1, 4),
  },
  label: {
    fontWeight: 600,
    paddingBottom: theme.spacing(1),
  },
  textField: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: '1rem',
  },
}));

function Input(fn = '', ln = '', email = '', org = '', role = '') {
  this[FNAME] = fn;
  this[LNAME] = ln;
  this[EMAIL] = email;
  this[ORG] = org;
  this[ROLE] = role;
  this[PWD] = 'encrypted'; // anything to show some dots
}

const initialError = {
  [FNAME]: null,
  [LNAME]: null,
  [ORG]: null,
};

const Profile = () => {
  const [input, setInput] = useState(new Input());
  const [error, setError] = useState(initialError);
  const setProgressAtTopBar = useContext(HomeLinearProgressContext);
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    SettingsSnackbarContext
  );
  const location = useLocation();
  const {data, isLoading} = useQuery(
    QueryKeys.USER_IN_STORAGE,
    userInStorageFetch
  );
  const queryClient = useQueryClient();
  const classes = useStyles();

  useEffect(() => {
    if (!data) {
      return;
    }
    const {firstName, lastName, email, organizationName, role} = data;
    setInput(
      new Input(
        firstName,
        lastName,
        email,
        organizationName,
        getRoleDisplayName(role)
      )
    );
  }, [data]);

  const saveMutation = useMutation(
    async (payload) => {
      await axios.patch(Endpoints.UPDATE_USER_PROFILE, payload);
    },
    {
      onSuccess: (apiData, payload) => {
        // set into storage and invalidate query
        storeUserToLocalStorage(
          fromJson(UserInLocalStorage, {
            ...data,
            ...payload,
          }),
          () => queryClient.invalidateQueries(QueryKeys.USER_IN_STORAGE)
        );
        setSnackbarAlertProps(
          new SnackbarAlertProps(
            'Your changes have been saved',
            SnackbarType.SUCCESS,
            SnackbarVerPos.TOP,
            SnackbarHorPos.CENTER
          )
        );
      },
      onError: (err) => {
        handleApiError(
          err,
          setSnackbarAlertError,
          "Couldn't update your profile"
        );
      },
    }
  );

  useEffect(() => {
    setProgressAtTopBar(isLoading || saveMutation.isLoading);
  }, [isLoading, saveMutation.isLoading, setProgressAtTopBar]);

  const validateOnSubmit = (keysSkipValidate = []) => {
    const errors = {};
    Object.keys(input)
      .filter((k) => !keysSkipValidate.includes(k))
      .forEach((key) => {
        const value = input[key].trim();
        if (!value) {
          errors[key] = `${key} is required`;
        }
      });
    return errors;
  };

  const handleChange = (column) => ({target}) => {
    const {value} = target;
    setInput({
      ...input,
      [column]: value,
    });
    // even if some error is currently shown due to some other cause than the checks
    // in validate(), we will clear that error upon value change in this element.
    if (error[column]) {
      setError({...error, [column]: null});
    }
  };

  const handleSave = () => {
    const errors = validateOnSubmit([EMAIL, ROLE, PWD]);
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    const payload = {};
    const fn = input[FNAME].trim();
    const ln = input[LNAME].trim();
    const on = input[ORG].trim();
    const {firstName, lastName, organizationName} = data;
    if (fn !== firstName || ln !== lastName) {
      // send both when one changed to assist with updating displayName in firebase
      // as we need both names to construct full name
      payload.firstName = fn;
      payload.lastName = ln;
    }
    if (on !== organizationName) {
      payload.organizationName = on;
    }
    if (!Object.keys(payload).length) {
      setSnackbarAlertProps(
        new SnackbarAlertProps('No changes were made!', SnackbarType.INFO)
      );
      return;
    }
    saveMutation.mutate(payload);
  };

  const getLabel = (label, forId) => (
    <Typography
      variant="body2"
      component="label"
      htmlFor={forId}
      className={classes.label}>
      {label}
    </Typography>
  );

  const getText = (name, key, disabled = false, type = 'text') => (
    <TextField
      name={name}
      id={name}
      variant="outlined"
      margin="none"
      fullWidth
      InputProps={{
        classes: {input: classes.textField},
        inputProps: {tabIndex: '0'},
      }}
      value={input[key]}
      onChange={handleChange(key)}
      error={Boolean(error[key])}
      helperText={error[key] ?? ''}
      onKeyUp={keyUpHandler(handleSave)}
      disabled={disabled}
      type={type}
    />
  );

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Box pb={4}>
        <Typography variant="h4">My Profile</Typography>
      </Box>
      <Box
        className={classes.content}
        p={6}
        boxShadow={3}
        width="60%"
        display="flex"
        flexDirection="column">
        <Box pb={2} display="flex" flexDirection="column">
          {getLabel('Email', 'email')}
          {getText('email', EMAIL, true)}
          <Link
            component={RouterLink}
            to={getLocation(
              `${PageUrl.SETTINGS}${PageUrl.EMAIL}`,
              location.search
            )}
            aria-label="Change email"
            variant="body2"
            style={{marginLeft: '8px'}}>
            Change email
          </Link>
        </Box>
        <Box pb={2} display="flex" flexDirection="column">
          {getLabel('Password', 'password')}
          {getText('password', PWD, true, 'password')}
          <Link
            component={RouterLink}
            to={getLocation(
              `${PageUrl.SETTINGS}${PageUrl.PASSWORD}`,
              location.search
            )}
            aria-label="Change password"
            variant="body2"
            style={{marginLeft: '8px'}}>
            Change password
          </Link>
        </Box>
        <Box pb={2} display="flex" flexDirection="column">
          {getLabel('First name', 'firstName')}
          {getText('firstName', FNAME)}
        </Box>
        <Box pb={2} display="flex" flexDirection="column">
          {getLabel('Last name', 'lastName')}
          {getText('lastName', LNAME)}
        </Box>
        <Box pb={2} display="flex" flexDirection="column">
          {getLabel('Organization', 'organization')}
          {getText('organization', ORG, data && data.role !== Role.ADMIN)}
        </Box>
        <Box pb={2} display="flex" flexDirection="column">
          {getLabel('Role', 'role')}
          {getText('role', ROLE, true)}
        </Box>
      </Box>
      <Box pt={2}>
        <Button
          variant="contained"
          color="secondary"
          disabled={saveMutation.isLoading || isLoading}
          className={classes.buttonSave}
          onClick={handleSave}>
          {saveMutation.isLoading ? 'Saving changes...' : 'Save changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default Profile;

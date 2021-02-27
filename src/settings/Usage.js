import React, {useContext, useEffect} from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import TeamIcon from '@material-ui/icons/GroupOutlined';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import {useQuery} from 'react-query';
import Loader from '../components/Loader';
import {SettingsSnackbarContext} from '../contexts';
import {PlanType, QueryKeys} from '../Constants';
import {userInStorageFetch, userPlanFetch} from '../api/fetches';
import {handleApiError} from '../common';
import {formatTimestamp} from '../utils';

// TODO: this page is incomplete and built for just free plans. Once we enter
// paid plans, put a button to upgrade plan (only admin), show extra minutes incurred,
// and the pricing incurred for extra minutes etc. See gitlab or zapier for ref.
const dateFormat = 'MMM dd, yyyy';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  barSecondaryNormal: {
    backgroundColor: theme.palette.secondary.main,
  },
  barSecondaryOverflow: {
    backgroundColor: theme.palette.error.main,
  },
}));

const Usage = () => {
  const {data: userPlan, error, isLoading: userPlanLoading} = useQuery(
    QueryKeys.USER_PLAN,
    userPlanFetch
  );
  const {data: userInStorage, isLoading: userInStorageLoading} = useQuery(
    QueryKeys.USER_IN_STORAGE,
    userInStorageFetch
  );
  const [, setSnackbarAlertError] = useContext(SettingsSnackbarContext);
  const {
    planType,
    displayName,
    consumedMinutes,
    totalParallel,
    totalMinutes,
    billingCyclePlannedEnd,
  } = userPlan || {};
  const classes = useStyles();

  useEffect(() => {
    if (error) {
      handleApiError(error, setSnackbarAlertError, 'Usage failed to load');
    }
  }, [error, setSnackbarAlertError]);

  const getPercentConsumed = () =>
    Math.floor((consumedMinutes / totalMinutes) * 100);

  const getPercentConsumedBar = () => {
    const percent = getPercentConsumed();
    return (
      <LinearProgress
        variant="determinate"
        value={percent > 100 ? 100 : percent}
        color="primary"
      />
    );
  };

  const getText = (value, light = false, variant = 'body1') => (
    <Typography
      variant={variant}
      color={light ? 'textSecondary' : 'textPrimary'}>
      {value}
    </Typography>
  );

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Box>{getText('Usage', false, 'h4')}</Box>
      <Box pb={4}>
        {getText(
          'Usage of resources across your projects and team',
          true,
          'body2'
        )}
      </Box>
      <Box
        className={classes.content}
        p={6}
        boxShadow={3}
        width="60%"
        display="flex"
        flexDirection="column">
        {userPlanLoading || userInStorageLoading ? (
          <Box width="100%">
            <Loader rows={4} />
          </Box>
        ) : null}
        {userPlan && userInStorage ? (
          <>
            <Box display="flex" alignItems="center">
              <Box display="flex">
                <TeamIcon fontSize="large" style={{marginRight: '4px'}} />
                <Box display="flex" flexDirection="column">
                  <Typography variant="body1" style={{fontWeight: 600}}>
                    {userInStorage.organizationName}
                  </Typography>
                  {getText(displayName, true)}
                </Box>
              </Box>
              <Box flex={1} />
              <Box display="flex" flexDirection="column">
                {getText(
                  `${
                    planType === PlanType.FREE ? 'Plan ends on' : 'Usage reset'
                  }`
                )}
                {getText(
                  formatTimestamp(billingCyclePlannedEnd, dateFormat),
                  true
                )}
              </Box>
            </Box>
            <Divider />
            <Box display="flex" flexDirection="column" pt={3}>
              {getText('Total parallel builds')}
              {getText(totalParallel, true)}
            </Box>
            <Box display="flex" pt={1}>
              {getText('Current period usage')}
              <Box flex={1} />
              {getText(`${getPercentConsumed()}%`, true)}
            </Box>
            <Box display="flex" alignItems="center">
              {getText(`${consumedMinutes} / ${totalMinutes} minutes`, true)}
              <Box ml={2} flex={1}>
                {getPercentConsumedBar()}
              </Box>
            </Box>
          </>
        ) : null}
      </Box>
    </Box>
  );
};

export default Usage;

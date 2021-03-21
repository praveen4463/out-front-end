import React, {
  useState,
  useMemo,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {makeStyles} from '@material-ui/core/styles';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import {useQuery} from 'react-query';
import axios from 'axios';
import {
  addInSearchQuery,
  fromJson,
  getLocation,
  getNumberParamFromUrl,
  getRunningBuildsEndpoint,
  handleApiError,
} from '../common';
import {PageUrl, QueryKeys, SearchKeys} from '../Constants';
import {BuildsSnackbarContext} from '../contexts';
import Loader from '../components/Loader';
import {RunningBuildObj} from '../model';
import RunningBuild from './RunningBuild';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    overflow: 'auto',
  },
  buildContainer: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
    minHeight: 250,
    maxHeight: 400,
  },
}));

const RunningBuilds = () => {
  const location = useLocation();
  const projectId = useMemo(
    () => getNumberParamFromUrl(SearchKeys.PROJECT_QS, location.search),
    [location.search]
  );
  const separatePageQuery = useMemo(
    () => addInSearchQuery('', SearchKeys.PROJECT_QS, projectId),
    [projectId]
  );
  const [, setSnackbarAlertError] = useContext(BuildsSnackbarContext);
  // array of RunningBuildObj
  const [builds, setBuilds] = useState([]);
  const runningBuildsFetch = useCallback(async () => {
    const params = {};
    if (builds.length) {
      params.after = builds[0].buildId;
    }
    const {data} = await axios(getRunningBuildsEndpoint(projectId), {params});
    const buildIds = data.map((b) => b.buildId);
    if (buildIds.length && builds.some((b) => buildIds.includes(b.buildId))) {
      throw new Error(
        "Api returned a build that was already in running list, this shouldn't have happened"
      );
    }
    return data.map((b) => fromJson(RunningBuildObj, b));
  }, [projectId, builds]);
  const {data, error, isLoading} = useQuery(
    // altho our query use builds array but it's not added into the key
    // because we change it on every fetch and if it's added into key, query will
    // refetch which will create a recursive loop if every fetch yields new data.
    // Altho it may not be possible that every fetch will yield new data, we don't
    // want query to refetch immediately after a fetch, we've a fetch interval defined.
    // Thus keeping it out of query and using a callback function which changes
    // when builds is changed.
    [QueryKeys.RUNNING_BUILDS, projectId],
    runningBuildsFetch,
    {
      refetchInterval: 5000,
    }
  );
  const classes = useStyles();

  useEffect(() => {
    if (error) {
      handleApiError(error, setSnackbarAlertError, 'Builds failed to load');
    }
  }, [error, setSnackbarAlertError]);

  useEffect(() => {
    // data will be null initially
    if (!data?.length) {
      return;
    }
    // push the new builds on top of array
    setBuilds((b) => [...data, ...b]);
  }, [data]);

  const removeBuild = useCallback(
    (buildId) => {
      if (!builds.length) {
        throw new Error(
          `Can't remove ${buildId} from running list as the list is empty`
        );
      }
      if (!builds.some((b) => b.buildId === buildId)) {
        throw new Error(
          `Can't remove ${buildId} from running list as it's not there`
        );
      }
      const filtered = builds.filter((b) => b.buildId !== buildId);
      setBuilds(filtered);
    },
    [builds]
  );

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Box pb={2} display="flex" alignItems="center">
        <Typography variant="h4">Running Builds</Typography>
        <Box flex={1} />
        <Button
          variant="contained"
          color="secondary"
          component={RouterLink}
          to={getLocation(
            `${PageUrl.BUILDS}${PageUrl.CREATE}`,
            separatePageQuery,
            {
              location,
            }
          )}>
          Create New Build
        </Button>
      </Box>
      {isLoading ? (
        <Box width="100%">
          <Loader rows={4} />
        </Box>
      ) : null}
      {!isLoading && !builds.length ? (
        <Box textAlign="center" fontSize="body1.fontSize" p={10}>
          No builds are running.
        </Box>
      ) : (
        builds.map((b) => (
          <Box
            p={1}
            mb={2}
            flex={1}
            boxShadow={3}
            display="flex"
            flexDirection="column"
            position="relative"
            key={b.buildId}
            className={classes.buildContainer}>
            <RunningBuild
              key={b.buildId}
              runningBuildObj={b}
              removeHandler={removeBuild}
            />
          </Box>
        ))
      )}
    </Box>
  );
};

export default RunningBuilds;

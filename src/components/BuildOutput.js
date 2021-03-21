import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {useQuery} from 'react-query';
import {QueryKeys} from '../Constants';
import {buildOutputFetch} from '../api/fetches';
import Loader from './Loader';
import {handleApiError} from '../common';
import ErrorMessageWithIcon from './ErrorMessageWithIcon';

const useStyles = makeStyles((theme) => ({
  outputPanelContent: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'scroll',
  },
  output: {
    fontFamily: "'Fira Mono', 'Courier New', Courier, monospace",
    fontSize: '.875rem',
    fontWeight: 'normal',
    lineHeight: 1.5,
    color: theme.palette.background.contrastText,
    margin: theme.spacing(1, 0),
  },
  outputError: {
    color: theme.palette.error.light,
    marginTop: 0,
  },
  noOutput: {
    color: theme.palette.background.contrastText,
  },
}));

const BuildOutput = ({buildId, versionId, fetchInterval}) => {
  const {data: buildOutputDetailsByVersionList, error, isLoading} = useQuery(
    [QueryKeys.BUILD_OUTPUT, buildId, versionId],
    buildOutputFetch,
    {
      refetchInterval: fetchInterval || false,
    }
  );
  const classes = useStyles();

  if (isLoading) {
    return <Loader rows={6} />;
  }

  if (error) {
    <ErrorMessageWithIcon
      msg={handleApiError(error, null, "Couldn't fetch output")}
    />;
  }

  const anyOutput = buildOutputDetailsByVersionList.some(
    (bod) => bod.outputsWithLineBreak || bod.error
  );

  return (
    <>
      <Box className={classes.outputPanelContent} flex={1}>
        {buildOutputDetailsByVersionList.map((bod) => (
          <Box display="flex" flexDirection="column" px={1} key={bod.versionId}>
            <pre className={classes.output}>
              {bod.outputsWithLineBreak || ''}
            </pre>
            <pre className={clsx(classes.output, classes.outputError)}>
              {bod.error || ''}
            </pre>
          </Box>
        ))}
      </Box>
      {!anyOutput ? (
        <Box mt="10%" display="flex" justifyContent="center">
          <Typography variant="body1" className={classes.noOutput}>
            No Output recorded
          </Typography>
        </Box>
      ) : null}
    </>
  );
};

BuildOutput.propTypes = {
  buildId: PropTypes.number.isRequired,
  versionId: PropTypes.number,
  fetchInterval: PropTypes.number,
};

BuildOutput.defaultProps = {
  versionId: null,
  fetchInterval: null,
};

export default BuildOutput;

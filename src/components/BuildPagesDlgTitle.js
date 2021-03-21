import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {TestVersionDetails} from '../model';
import {getVersionNamePath} from '../common';

const useStyles = makeStyles((theme) => ({
  marginL16: {
    marginLeft: theme.spacing(2),
  },
}));

const BuildPagesDlgTitle = ({
  buildId,
  title,
  testVersionDetails: tvd,
  closeDlg,
}) => {
  const classes = useStyles();

  return (
    <Box display="flex" alignItems="center" color="text.medium">
      {title ? (
        <Typography variant="body1" style={{fontWeight: 600}}>
          {title}
        </Typography>
      ) : null}
      <Typography
        variant="body1"
        className={clsx(
          title && classes.marginL16
        )}>{`# ${buildId}`}</Typography>
      {tvd ? (
        <Typography variant="body1" className={classes.marginL16}>
          {getVersionNamePath(tvd.fileName, tvd.testName, tvd.versionName)}
        </Typography>
      ) : null}
      <Box flex={1} />
      <IconButton
        aria-label="Close"
        onClick={closeDlg}
        title="Close"
        color="inherit">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

BuildPagesDlgTitle.propTypes = {
  buildId: PropTypes.number.isRequired,
  title: PropTypes.string,
  testVersionDetails: PropTypes.instanceOf(TestVersionDetails),
  closeDlg: PropTypes.func.isRequired,
};

BuildPagesDlgTitle.defaultProps = {
  title: null,
  testVersionDetails: null,
};

export default BuildPagesDlgTitle;

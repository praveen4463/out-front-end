import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import {TestStatus} from '../Constants';
import BuildStatusIcon from './BuildStatusIcon';

const useStyles = makeStyles((theme) => ({
  iconsIndication: {
    marginRight: theme.spacing(0.5),
  },
  marginR2: {
    marginRight: theme.spacing(2),
  },
}));

const BuildStatusIconSet = ({
  totalSuccess,
  totalError,
  totalStopped,
  totalAborted,
}) => {
  const classes = useStyles();

  return (
    <Box
      display="flex"
      alignItems="center"
      color="text.secondary"
      fontSize="body2.fontSize"
      fontWeight={600}>
      <BuildStatusIcon
        status={TestStatus.SUCCESS}
        className={classes.iconsIndication}
      />
      <span className={classes.marginR2}>{totalSuccess}</span>
      <BuildStatusIcon
        status={TestStatus.ERROR}
        className={classes.iconsIndication}
      />
      <span className={classes.marginR2}>{totalError}</span>
      <BuildStatusIcon
        status={TestStatus.STOPPED}
        className={classes.iconsIndication}
      />
      <span className={classes.marginR2}>{totalStopped}</span>
      <BuildStatusIcon
        status={TestStatus.ABORTED}
        className={classes.iconsIndication}
      />
      <span className={classes.marginR2}>{totalAborted}</span>
    </Box>
  );
};

BuildStatusIconSet.propTypes = {
  totalSuccess: PropTypes.number.isRequired,
  totalError: PropTypes.number.isRequired,
  totalStopped: PropTypes.number.isRequired,
  totalAborted: PropTypes.number.isRequired,
};

export default BuildStatusIconSet;

import React from 'react';
import {useTheme} from '@material-ui/core/styles';
import SuccessIcon from '@material-ui/icons/Check';
import FailureIcon from '@material-ui/icons/HighlightOff';
import StopIcon from '@material-ui/icons/Stop';
import AbortedIcon from '@material-ui/icons/NotInterested';
import PropTypes from 'prop-types';
import {TestStatus} from '../Constants';

const BuildStatusIcon = ({status, className}) => {
  const theme = useTheme();

  const getIconPerStatus = () => {
    switch (status) {
      case TestStatus.SUCCESS:
        return (
          <SuccessIcon
            titleAccess="Passed"
            style={{color: '#4caf50'}}
            className={className}
          />
        );
      case TestStatus.ERROR:
        return (
          <FailureIcon
            titleAccess="Failed"
            style={{color: theme.palette.error.main}}
            className={className}
          />
        );
      case TestStatus.ABORTED:
        return (
          <AbortedIcon
            titleAccess="Aborted"
            style={{color: '#868686'}}
            className={className}
          />
        );
      case TestStatus.STOPPED:
        return (
          <StopIcon
            titleAccess="Stopped"
            style={{color: '#868686'}}
            className={className}
          />
        );
      default:
        throw new Error(`Unrecognized status ${status}`);
    }
  };

  return getIconPerStatus();
};

BuildStatusIcon.propTypes = {
  status: PropTypes.oneOf(Object.values(TestStatus)).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  className: PropTypes.string,
};

BuildStatusIcon.defaultProps = {
  className: '',
};

export default BuildStatusIcon;

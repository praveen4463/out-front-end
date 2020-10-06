import React, {useMemo} from 'react';
import {useTheme} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import BuildRun from './BuildRun';
import DryRun from './DryRun';
import Parse from './Parse';
import {BottomNavs} from './Constants';
import '../react-split-pane.css';

const BottomPane = (props) => {
  const {closeHandler, selected} = props;
  const theme = useTheme();

  const closeButton = useMemo(
    () => (
      <IconButton
        aria-label="Close Panel"
        onClick={closeHandler}
        title="Close Panel"
        style={{
          padding: theme.spacing(0.5),
          opacity: theme.textOpacity.highEmphasis,
        }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    ),
    [closeHandler, theme] // closeHandler doesn't change
  );
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        width: '100%',
      }}>
      {selected === BottomNavs.BUILD_RUN && (
        <BuildRun closeButton={closeButton} />
      )}
      {selected === BottomNavs.DRY_RUN && <DryRun closeButton={closeButton} />}
      {selected === BottomNavs.PARSE && <Parse closeButton={closeButton} />}
    </div>
  );
};

BottomPane.propTypes = {
  closeHandler: PropTypes.func.isRequired,
  selected: PropTypes.string.isRequired,
};

export default BottomPane;

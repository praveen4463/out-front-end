import React from 'react';
import {useTheme} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import BuildRun from './BuildRun';
import DryRun from './DryRun';
import Parse from './Parse';
import {BottomNavs} from './Constants';
import '../react-split-pane.css';

const BottomPane = (props) => {
  const {closeHandler, selected} = props;
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        width: '100%',
      }}>
      {selected === BottomNavs.BUILD_RUN && (
        <BuildRun closeHandler={closeHandler} />
      )}
      {selected === BottomNavs.DRY_RUN && (
        <DryRun closeHandler={closeHandler} />
      )}
      {selected === BottomNavs.PARSE && <Parse closeHandler={closeHandler} />}
    </div>
  );
};

BottomPane.propTypes = {
  closeHandler: PropTypes.func.isRequired,
  selected: PropTypes.string.isRequired,
};

export default BottomPane;

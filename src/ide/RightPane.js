import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import CompletedBuilds from './CompletedBuilds';
import LivePreview from './LivePreview';
import Documentation from './Documentation';
import {RightNavs} from './Constants';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
    width: '100%',
    height: '100%',
  },
}));

const RightPane = (props) => {
  const {closeHandler, selected} = props;
  const classes = useStyles(props);

  return (
    <div className={classes.root}>
      {selected === RightNavs.COMPLETED_BUILDS && (
        <CompletedBuilds closeHandler={closeHandler} />
      )}
      {selected === RightNavs.LIVE_PREVIEW && (
        <LivePreview closeHandler={closeHandler} />
      )}
      {selected === RightNavs.DOCUMENTATION && (
        <Documentation closeHandler={closeHandler} />
      )}
    </div>
  );
};

RightPane.propTypes = {
  closeHandler: PropTypes.func.isRequired,
  selected: PropTypes.string.isRequired,
};

export default RightPane;

import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import CompletedBuilds from './CompletedBuilds';
import LivePreview from './LivePreview';
import ApiRef from './ApiRef';
import {RightNavs} from './Constants';

const useStyles = makeStyles((theme) => ({
  themeBackground: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  whiteBackground: {
    backgroundColor: '#fff',
    color: '#000',
  },
  closeIcon: {
    padding: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: (props) =>
        props.selected === RightNavs.LIVE_PREVIEW
          ? 'rgba(0, 0, 0, 0.28)'
          : theme.palette.action.hover,
    },
  },
}));

const RightPane = (props) => {
  const {closeHandler, selected} = props;
  const classes = useStyles(props);

  let rendered;
  switch (selected) {
    case RightNavs.COMPLETED_BUILDS:
      rendered = <CompletedBuilds />;
      break;
    case RightNavs.LIVE_PREVIEW:
      rendered = <LivePreview />;
      break;
    case RightNavs.API_REF:
      rendered = <ApiRef />;
      break;
    default:
      rendered = <div />;
      break;
  }
  return (
    <div
      className={
        selected === RightNavs.LIVE_PREVIEW
          ? classes.whiteBackground
          : classes.themeBackground
      }
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}>
      <Box top={0} left={0} display="inline-block">
        <IconButton
          aria-label="Close Panel"
          onClick={closeHandler}
          title="Close Panel"
          color="inherit"
          className={classes.closeIcon}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box flex={1}>{rendered}</Box>
    </div>
  );
};

RightPane.propTypes = {
  closeHandler: PropTypes.func.isRequired,
  selected: PropTypes.string.isRequired,
};

export default RightPane;

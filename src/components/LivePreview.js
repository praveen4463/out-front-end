import React, {useState, useRef, useCallback, useEffect} from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {getShotName, getShotUri} from '../common';
import {
  SHOT_ID_TMPL,
  startPreview,
  LivePreviewConstants,
} from '../buildsCommon';
import ErrorMessageWithIcon from './ErrorMessageWithIcon';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    backgroundColor: '#fff',
    color: '#000',
  },
  icons: {
    padding: theme.spacing(0.25),
    borderRadius: 'unset',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.28)',
    },
  },
  fullScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: theme.zIndex.modal,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    objectFit: 'contain',
    objectPosition: 'center',
    width: '100%',
    height: '100%',
  },
  previewBox: {
    overflow: 'hidden',
  },
}));

// closeHandler must use a useCallback
const LivePreview = ({
  shotBucket,
  sessionKey,
  buildKey,
  latestShotIdentifier,
  closeHandler,
  closeOnEnd,
}) => {
  const [fullScreen, setFullScreen] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const unmounted = useRef(false);
  const classes = useStyles();

  const getInfoTypeStatusMsg = (msg) => {
    return <Typography variant="body1">{msg}</Typography>;
  };

  const getErrorTypeStatusMsg = useCallback(
    (msg) => <ErrorMessageWithIcon msg={msg} />,
    []
  );

  const onPreviewEnd = useCallback(
    (errorText) => {
      if (unmounted.current) {
        return;
      }
      setImageSrc(null);
      setStatusMsg(
        errorText
          ? getErrorTypeStatusMsg(errorText)
          : getInfoTypeStatusMsg(LivePreviewConstants.COMPLETION_TEXT)
      );
      if (closeOnEnd) {
        setTimeout(
          () => {
            setStatusMsg(null);
            closeHandler();
          },
          errorText ? 5000 : 2000
        );
      }
    },
    [closeHandler, closeOnEnd, getErrorTypeStatusMsg, unmounted]
  );

  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    const shotName = getShotName(sessionKey, buildKey, SHOT_ID_TMPL);
    const shotUriTemplate = getShotUri(shotBucket, shotName);
    startPreview(
      unmounted,
      setStatusMsg,
      getErrorTypeStatusMsg,
      setImageSrc,
      onPreviewEnd,
      shotUriTemplate,
      latestShotIdentifier
    );
  }, [
    buildKey,
    getErrorTypeStatusMsg,
    latestShotIdentifier,
    onPreviewEnd,
    sessionKey,
    shotBucket,
  ]);

  const handleEnterFull = () => {
    setFullScreen(true);
  };

  const handleExitFull = () => {
    setFullScreen(false);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      className={clsx(classes.root, fullScreen && classes.fullScreen)}>
      <Box display="flex" alignItems="center">
        {!fullScreen ? (
          <IconButton
            aria-label="Full Screen"
            onClick={handleEnterFull}
            title="Full Screen"
            color="inherit"
            className={classes.icons}>
            <FullscreenIcon fontSize="small" />
          </IconButton>
        ) : null}
        {fullScreen ? (
          <>
            <IconButton
              aria-label="Close"
              onClick={closeHandler}
              title="Close"
              color="inherit"
              className={classes.icons}>
              <CloseIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Exit Full Screen"
              onClick={handleExitFull}
              title="Exit Full Screen"
              color="inherit"
              className={classes.icons}>
              <FullscreenExitIcon fontSize="small" />
            </IconButton>
          </>
        ) : null}
      </Box>
      <Box flex={1} className={classes.previewBox}>
        {imageSrc ? (
          <div className={classes.imageContainer}>
            <img
              src={imageSrc}
              alt="live preview frame"
              className={classes.image}
            />
          </div>
        ) : null}
        {!imageSrc ? (
          <Box mt="10%" display="flex" justifyContent="center">
            {statusMsg}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

LivePreview.propTypes = {
  shotBucket: PropTypes.string.isRequired,
  sessionKey: PropTypes.string.isRequired,
  buildKey: PropTypes.string.isRequired,
  latestShotIdentifier: PropTypes.number,
  closeHandler: PropTypes.func.isRequired,
  closeOnEnd: PropTypes.bool,
};

LivePreview.defaultProps = {
  closeOnEnd: false,
  latestShotIdentifier: null,
};

export default LivePreview;

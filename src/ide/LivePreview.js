import React, {
  useState,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import CloseIcon from '@material-ui/icons/Close';
import ErrorIcon from '@material-ui/icons/Error';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import axios from 'axios';
import {IdeBuildContext, IdeDispatchContext, IdeLPContext} from './Contexts';
import {LP_START, LP_END} from './actionTypes';
import {
  getLatestShotEndpoint,
  getShotName,
  getShotUri,
  getUserFromLocalStorage,
  handleApiError,
} from '../common';
import {
  SHOT_ID_TMPL,
  startPreview,
  getShotIdFromName,
  LivePreviewConstants,
} from '../buildsCommon';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    backgroundColor: '#fff',
    color: '#000',
  },
  icons: {
    padding: theme.spacing(0.25),
    borderRight: `1px solid ${theme.palette.border.light}`,
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
  error: {
    color: '#f44336',
  },
  statusIcon: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
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

// !! TODO: for now even when fullscreen, there are close and exit button that
// take up top space, change this to buttons over image just like in shotsviewer
const LivePreview = ({closeHandler}) => {
  const dispatch = useContext(IdeDispatchContext);
  const build = useContext(IdeBuildContext);
  const livePreview = useContext(IdeLPContext);
  const [fullScreen, setFullScreen] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const previewExistedRef = useRef(
    Boolean(livePreview.runId && livePreview.runId === build.runId)
  );
  const previewBegunRef = useRef(false);
  const unmounted = useRef(false);
  const classes = useStyles();

  const shotNameTemplate = useMemo(() => {
    return getShotName(
      livePreview.sessionId,
      livePreview.buildKey,
      SHOT_ID_TMPL
    );
  }, [livePreview.buildKey, livePreview.sessionId]);

  const getInfoTypeStatusMsg = (msg) => {
    return <Typography variant="body1">{msg}</Typography>;
  };

  const getErrorTypeStatusMsg = useCallback(
    (msg) => {
      return (
        <Box display="flex" alignItems="center">
          <ErrorIcon
            fontSize="small"
            color="error"
            className={classes.statusIcon}
          />
          <Typography variant="body1" className={classes.error}>
            {msg}
          </Typography>
        </Box>
      );
    },
    [classes.error, classes.statusIcon]
  );

  // set a status based on whether an error occurred in live preview or it went
  // fine. The status should remain on screen for few seconds before the live preview
  // screen closes down. When opened again it shows message to start new build.
  const onPreviewEnd = useCallback(
    (errorText) => {
      if (unmounted.current) {
        return;
      }
      // console.log('onPreviewEnd');
      dispatch({type: LP_END});
      setImageSrc(null);
      setStatusMsg(
        errorText
          ? getErrorTypeStatusMsg(errorText)
          : getInfoTypeStatusMsg(LivePreviewConstants.COMPLETION_TEXT)
      );
      setTimeout(
        () => {
          setStatusMsg(null);
          closeHandler();
        },
        errorText ? 5000 : 2000
      );
    },
    [closeHandler, dispatch, getErrorTypeStatusMsg, unmounted]
  );

  // !!Order of effect is precise based on sequence of events.
  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  // sometimes build may complete before live preview has finished and user may
  // trigger a new while preview panel is opened. In that case, we will have to
  // end the current preview so that once session is created, preview panel is
  // opened again normally.
  useEffect(() => {
    if (
      build.runOngoing &&
      !build.sessionId &&
      livePreview.runId &&
      !livePreview.completed &&
      livePreview.runId !== build.runId
    ) {
      // just mark completed and close immediately the panel without showing
      // any message. The preview function will detect panel unmount and stop
      // itself.
      // console.log('restarted build, closing current preview');
      dispatch({type: LP_END});
      closeHandler();
    }
  }, [
    build.runId,
    build.runOngoing,
    build.sessionId,
    livePreview.completed,
    livePreview.runId,
    dispatch,
    closeHandler,
  ]);

  // if build ends while preview is running, we run the preview until its finished,
  // during this if user closes the panel, we should mark the preview completed
  // so that when they reopen and no build is running, we don't start preview as
  // it doesn't make sense. This effect has cleanup function which will mark
  // preview completed.
  useEffect(() => {
    return () => {
      if (
        !build.runOngoing &&
        livePreview.runId &&
        !livePreview.completed &&
        previewBegunRef.current
      ) {
        // console.log('preview will now end');
        dispatch({type: LP_END});
      }
    };
  }, [build.runOngoing, dispatch, livePreview.completed, livePreview.runId]);

  // In contrast to the above, this runs when panel is opened after build ends.
  // we should mark it completed. This depends on checking that preview is not
  // running which is true when panel is opened when no build is running.
  useEffect(() => {
    if (
      !build.runOngoing &&
      !previewBegunRef.current &&
      livePreview.runId &&
      !livePreview.completed
    ) {
      // console.log('preview will now end');
      dispatch({type: LP_END});
    }
  }, [build.runOngoing, dispatch, livePreview.completed, livePreview.runId]);

  // create live preview for this build if not yet.
  useEffect(() => {
    if (!(build.runOngoing && build.sessionId)) {
      return;
    }
    // user can close preview panel while preview going on, when they reopen,
    // check whether preview started running so that we can fetch latest shot
    // upto which server has processed and start from that. If it wasn't yet
    // started we skip checking server and start from beginning.
    if (livePreview.runId === build.runId) {
      return; // live preview was already started for this run
    }
    // dispatch for livePreview running state.
    // console.log('new preview will now be created');
    dispatch({type: LP_START});
  }, [
    build.runId,
    build.runOngoing,
    build.sessionId,
    dispatch,
    livePreview.completed,
    livePreview.runId,
  ]);

  const gatherDataAndStartPreview = useCallback(
    (latestShotIdentifier) => {
      getUserFromLocalStorage().then((user) => {
        const shotUriTemplate = getShotUri(
          user.shotBucketSessionStorage,
          shotNameTemplate
        );
        startPreview(
          unmounted,
          setStatusMsg,
          getErrorTypeStatusMsg,
          setImageSrc,
          onPreviewEnd,
          shotUriTemplate,
          latestShotIdentifier
        );
      });
    },
    [getErrorTypeStatusMsg, onPreviewEnd, shotNameTemplate]
  );

  // start/resume preview for this build, this effect should run only on new
  // preview and resume preview (i.e user close and reopen panel while live
  // preview and build is running)
  useEffect(() => {
    // we should check whether preview is already going on for this preview
    // panel session and return if so. This is required because the dependency
    // on startPreview changes whenever image src or status state changes leading
    // to rerun of this effect, starting preview again.
    async function getLatestShot() {
      try {
        const {data} = await axios(getLatestShotEndpoint(build.buildId));
        // console.log('preview will start, data is ', data);
        gatherDataAndStartPreview(data ? getShotIdFromName(data) : null);
      } catch (error) {
        // For now just reject if error occurs on latest processed shot check.
        // TODO: later see if we need to retry based on logs.
        handleApiError(
          error,
          (errorMsg) => onPreviewEnd(errorMsg),
          'Unable to deliver live preview'
        );
      }
    }
    if (
      !(
        build.runOngoing &&
        livePreview.runId &&
        !livePreview.completed &&
        !previewBegunRef.current
      )
    ) {
      return;
    }
    previewBegunRef.current = true;
    if (previewExistedRef.current) {
      getLatestShot();
      setStatusMsg(getInfoTypeStatusMsg('Connecting live preview...'));
      return;
    }
    // console.log('preview will start');
    gatherDataAndStartPreview();
  }, [
    build.runOngoing,
    livePreview.completed,
    livePreview.runId,
    onPreviewEnd,
    build.buildId,
    gatherDataAndStartPreview,
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
        <IconButton
          aria-label="Close Panel"
          onClick={closeHandler}
          title="Close Panel"
          color="inherit"
          className={classes.icons}>
          <CloseIcon fontSize="small" />
        </IconButton>
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
          <IconButton
            aria-label="Exit Full Screen"
            onClick={handleExitFull}
            title="Exit Full Screen"
            color="inherit"
            className={classes.icons}>
            <FullscreenExitIcon fontSize="small" />
          </IconButton>
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
            {statusMsg ??
              ((livePreview.completed || !livePreview.runId) &&
                getInfoTypeStatusMsg(
                  'Live Preview will start on every new build.'
                ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

LivePreview.propTypes = {
  closeHandler: PropTypes.func.isRequired,
};

export default LivePreview;

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
import Cookies from 'js-cookie';
import {IdeBuildContext, IdeDispatchContext, IdeLPContext} from './Contexts';
import {LP_START, LP_END} from './actionTypes';
import {ShotIdentifiers, ApiStatuses} from '../Constants';
import {LivePreviewConstants} from './Constants';
import Application from '../config/application';

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

const SHOT_ID_TMPL = '##ID##';
const OFFLINE_MSG = "You're offline, waiting for network...";

// !! TODO: for now even when fullscreen, there are close and exit button that
// take up top space, ideally i should've just hid them on fullscreen and show
// a snackbar like 'hit esc to exit full screen', but for now keeping it this
// way. Will think about it in future.
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
    return `${livePreview.sessionId}-${livePreview.buildKey}-${SHOT_ID_TMPL}.png`;
  }, [livePreview.buildKey, livePreview.sessionId]);

  const getShotIdFromName = useCallback((shotName) => {
    return shotName.substring(
      shotName.lastIndexOf('-') + 1,
      shotName.lastIndexOf('.')
    );
  }, []);

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

  const fetchLatestShotId = useCallback(() => {
    const onSuccess = (response, resolve) => {
      let shotId = null;
      if (response.data) {
        shotId = getShotIdFromName(response.data.shotName);
      }
      resolve(shotId);
    };
    const onError = (response, reject) => {
      const error = `Unable to deliver live preview, ${response.error.reason}`;
      // For now just reject if error occurs on latest processed shot check.
      // TODO: later see if we need to retry based on logs.
      reject(new Error(error));
    };
    // panel is reopened while preview running, get latest shot from api (esdb)
    // send buildId and expect either a shotName or nothing (if no shot saved yet)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const response = {
          status: ApiStatuses.SUCCESS,
          data: {
            shotName: shotNameTemplate.replace(SHOT_ID_TMPL, 6),
            // change identifier per test requirement
            // such as ShotIdentifiers.EOS, ShotIdentifiers.ERROR or any other number
          },
        };
        /* // no data means no shot found
        const response = {
          status: ApiStatuses.SUCCESS,
        }; */
        /* const response = {
          status: ApiStatuses.FAILURE,
          error: {
            reason: 'Network error',
          },
        }; */

        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess(response, resolve);
        } else if (response.status === ApiStatuses.FAILURE) {
          onError(response, reject);
        }
      }, 1000);
    });
  }, [getShotIdFromName, shotNameTemplate]);

  const endIfLastShot = useCallback(
    (stringShotId) => {
      if (
        stringShotId === ShotIdentifiers.EOS ||
        stringShotId === ShotIdentifiers.ERROR
      ) {
        onPreviewEnd(
          stringShotId === ShotIdentifiers.ERROR
            ? LivePreviewConstants.ERROR_SHOT_FOUND_TEXT
            : ''
        );
        return true;
      }
      return false;
    },
    [onPreviewEnd]
  );

  // !! default null to latestShotIdentifier is important so that when conveting
  // to number we get a 0 rather than NaN
  const startPreview = useCallback(
    (latestShotIdentifier = null) => {
      const shotUriTemplate = `${Application.STORAGE_HOST}/${Cookies.get(
        Application.SESSION_ASSET_BUCKET_NAME_COOKIE
      )}/${shotNameTemplate}`;
      let numberShotId = Number(latestShotIdentifier);
      if (Number.isNaN(numberShotId) && endIfLastShot(latestShotIdentifier)) {
        return;
      }
      numberShotId += 1;

      // !!! TODO: currently the logic to detect an END depends on trying shots
      // that may be unavailable on storage which will lead to 404 errors on
      // browser console. Customer may worry what they are and complain, thus
      // it would be good to mention it somewhere to either ignore those 404 or
      // filter them out in console, tell this to user. Currently we're relying
      // on this method only, and fix later if possible.
      let totalPollsNotFound = 0;
      const show = async (stringShotId) => {
        if (unmounted.current) {
          return;
        }
        const img = new Image();
        // when image was in cache, onload doesn't invoke if src is mentioned
        // before that, but here in live preview, content can't be in cache as
        // all builds are unique.
        const src = shotUriTemplate.replace(
          SHOT_ID_TMPL,
          stringShotId ?? numberShotId
        );
        img.onload = () => {
          // console.log(`image ${src} loaded`);
          if (stringShotId && endIfLastShot(stringShotId)) {
            return;
          }
          if (totalPollsNotFound > 0) {
            totalPollsNotFound = 0;
          }
          setImageSrc(src);
          numberShotId += 1;
          // !! TODO: Lets keep the following timeout and test with real api, see
          // how fast or slow the preview is and the errors and optimize based on
          // the data. I am thinking we wait on each shot before moving to next
          // so that the next is readily available without having to poll it. Let's
          // evaluate this and decide later whether to keep timeout, remove it
          // or increase/decrease the time.
          if (unmounted.current) {
            return;
          }
          setTimeout(() => {
            show();
          }, 500);
        };
        img.src = src;
        img.onerror = () => {
          if (unmounted.current) {
            return;
          }
          // console.log(`image ${src} has error`);
          // error because we're offline
          if (!navigator.onLine) {
            // when offline, either preview will end of resume from current shot
            const offlineStart = Date.now();
            // show offline message, set image to null for showing a status
            setImageSrc(null);
            // console.log('set offline msg');
            setStatusMsg(getErrorTypeStatusMsg(OFFLINE_MSG));
            const offlineCheckInterval = setInterval(() => {
              if (navigator.onLine) {
                // console.log('back online');
                clearInterval(offlineCheckInterval);
                show(stringShotId); // we're online, try showing the current shot
                return;
              }
              if (
                Date.now() - offlineStart >
                LivePreviewConstants.OFFLINE_RECOVERY_TIME
              ) {
                clearInterval(offlineCheckInterval);
                // console.log('offline limit reached');
                onPreviewEnd(`Unable to deliver live preview, Network error.`);
              }
              // console.log('offline interval invoked');
            }, 500);
            return;
          }
          // error occurred when online, don't show any message as it may be an
          // end of shots.

          // if we couldn't find error or eos in storage, that indicate of some
          // storage or server error, let's just show generic error and fix that.
          // don't look into db for error shot, even if it's there we're going to
          // tell use the same error message.
          if (
            totalPollsNotFound === LivePreviewConstants.MAX_POLL_AFTER_NOT_FOUND
          ) {
            onPreviewEnd(LivePreviewConstants.ERROR_SHOT_FOUND_TEXT);
            return;
          }
          // let's try finding 'actual shot' > eos > error sequentially for
          // MAX_POLL_AFTER_NOT_FOUND times waiting for POLL_TIME_WHEN_NOT_FOUND
          // in between reattempts.
          if (!stringShotId) {
            // current shot is an actual shot, try if an eos shot is there
            show(ShotIdentifiers.EOS);
            return;
          }
          if (stringShotId === ShotIdentifiers.EOS) {
            // current shot is an eos, try if an error shot is there
            show(ShotIdentifiers.ERROR);
            return;
          }
          if (stringShotId === ShotIdentifiers.ERROR) {
            // current shot is an error, wait and try if the actual shot is now there
            setTimeout(() => {
              totalPollsNotFound += 1;
              return show();
            }, LivePreviewConstants.POLL_TIME_WHEN_NOT_FOUND);
          }
        };
      };
      show();
    },
    [
      shotNameTemplate,
      endIfLastShot,
      onPreviewEnd,
      getErrorTypeStatusMsg,
      unmounted,
    ]
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
    onPreviewEnd,
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

  // In contrast to the above, this runs when panel is opened after build ends,
  // mark it completed. This depends on checking that preview is not running which
  // is true when panel is opened when no build is running.
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

  // start/resume preview for this build, this effect should run only on new
  // preview and resume preview (i.e user close and reopen panel while live
  // preview and build is running)
  useEffect(() => {
    // we should check whether preview is already going on for this preview
    // panel session and return if so. This is required because the dependency
    // on startPreview changes whenever image src or status state changes leading
    // to rerun of this effect, starting preview again.
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
      fetchLatestShotId()
        .then((latestShotId) => {
          // console.log('preview will start, latest shot is', latestShotId);
          startPreview(latestShotId);
        })
        .catch((error) => {
          onPreviewEnd(error.message);
        });
      setStatusMsg(getInfoTypeStatusMsg('Connecting live preview...'));
      return;
    }
    // console.log('preview will start');
    startPreview();
  }, [
    build.runOngoing,
    fetchLatestShotId,
    livePreview.completed,
    livePreview.runId,
    startPreview,
    onPreviewEnd,
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

import React, {useState, useEffect, useRef, useCallback} from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import {makeStyles} from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';
import GetAppIcon from '@material-ui/icons/GetApp';
import ReplayIcon from '@material-ui/icons/Replay';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import axios from 'axios';
import {useHotkeys} from 'react-hotkeys-hook';
import {ShotIdentifiers} from '../Constants';
import {
  getShotNameParts,
  getShotName,
  getVersionNamePath,
  getShotBasicDetailsEndpoint,
  handleApiError,
} from '../common';
import Application from '../config/application';
import './no-spin-box.css';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    backgroundColor: '#fff',
    color: '#000',
    overflow: 'hidden',
  },
  fullScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: theme.zIndex.modal,
  },
  iconButton: {
    padding: 0,
    margin: `0 ${theme.spacing(1.5)}px`,
    background: 'none',
  },
  downloadLink: {
    height: '20px',
  },
  icon: {
    color: '#fff',
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
  controlStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: 'rgba(43, 51, 63, 0.7)',
    display: 'flex',
    alignItems: 'center',
    height: 40,
  },
  indexBox: {
    fontSize: '0.875rem',
    fontWeight: 600,
    width: theme.spacing(6),
    display: 'inline',
    color: '#fff',
  },
  indexProgress: {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginLeft: theme.spacing(0.5),
    color: '#fff',
  },
  filled: {
    padding: '15px 12px 14px',
  },
  input: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#fff',
    width: theme.spacing(5),
  },
  iconFilled: {
    right: '14px',
  },
  next: {
    position: 'absolute',
    right: 0,
    top: '40%',
  },
  previous: {
    position: 'absolute',
    left: 0,
    top: '40%',
  },
  fontSizeLarge: {
    fontSize: '5.00rem',
  },
  arrowButtonPrevious: {
    marginLeft: theme.spacing(1.5),
  },
  arrowButton: {
    color: 'rgba(0, 0, 0, 0.54)',
    padding: `0 ${theme.spacing(1.5)}px`,
    '&:hover': {
      color: '#337ab7',
      background: 'none',
    },
  },
  indexBoxContainer: {
    margin: `0 ${theme.spacing(1.5)}px`,
  },
  select: {
    margin: `0 ${theme.spacing(1.5)}px`,
  },
  msg: {
    color: '#000',
  },
  showRunDetails: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 600,
  },
  marginL16: {
    marginLeft: theme.spacing(2),
  },
}));

const Speeds = {
  '0.25x': 4,
  '0.5x': 2,
  '1x': 1,
  '1.5x': 0.75,
  '2x': 0.5,
  '4x': 0.25,
};

const AUTO_SLIDE_INTERVAL = 500;
const SHOT_ID_TMPL = '##ID##';
const DEFAULT_SPEED = Speeds['1x'];

/*
  Example of a shot url
  'https://storage.googleapis.com/zl-session-assets-mum/8dfc821ba1ef804ae2aba62f8bf160c2-a5MadQuvxz-10.png'
  Currently shot viewer doesn't have option to filter shots by line no in code where
  it was taken at as it will increase te complexity of this component. In future if we
  may need to implement this, here is how I would do it
  Filter by line in code should be done only when a version is given. A box will show
  line no of current shot and text next to it shows total lines taken from the last shot in
  version not from it's raw code. Use can enter any line no to jump to shot associated
  with it and if there is no shot at a line, shot won't change.
  When version is not given, we move shots starting 1 to total shots and when given,
  all shotName, lineNo will be fetched from api at once.
*/
// !! remove below ignore statement once api is there and buildId is used.
// eslint-disable-next-line no-unused-vars
const ShotsViewer = ({
  buildId,
  shotBucket,
  versionId,
  fileName,
  testName,
  versionName,
}) => {
  const [fullScreen, setFullScreen] = useState(false);
  const [msg, setMsg] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [autoPlay, setAutoPlay] = useState(false);
  const [index, setIndex] = useState(0); // not a 0 based index
  const [indexBoxValue, setIndexBoxValue] = useState(0);
  const [total, setTotal] = useState(0);
  // the shotId from where shots should be displayed, for example when viewing for
  // entire build, it will be 1 (if there are shots) and when viewing for tests, it will
  // be the id from where that test started, such as 30 or 60
  // We don't show this to user, for them the first shot is at index 1 and last
  // at index 'total'. To get current shot using index, add index - 1 to the value of
  // shotIdStartRef, i.e shotId at index 1 will be shotIdStartRef + (1 - 0), at index 3,
  // shotIdStartRef + (3 - 1), -1 is used to make index a 0 based index. For instance,
  // if shotIdStartRef = 1 and index = 1, to view first shot shotIdStartRef + (index - 1) = 1
  const shotIdStartRef = useRef(null);
  const buildKeyRef = useRef(null);
  const sessionIdRef = useRef(null);
  const shotUriTemplateRef = useRef(null);
  const autoPlayRef = useRef(false);
  const indexRef = useRef(0);
  const speedRef = useRef(DEFAULT_SPEED);
  const unmountedRef = useRef(false);
  const classes = useStyles();

  autoPlayRef.current = autoPlay;
  indexRef.current = index;
  speedRef.current = speed;

  // !!Order of effect is precise based on sequence of events.
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    const noShotExistMsg = `No screenshot exist for this build ${
      versionId !== null ? ' and test' : ''
    }`;
    async function getShotBasicDetails() {
      try {
        const {data} = await axios(getShotBasicDetailsEndpoint(buildId), {
          params: {
            versionId,
          },
        });
        // when no shots, api doesn't sends anything
        const ts = data.totalShots;
        if (!ts) {
          setMsg(noShotExistMsg);
          return;
        }
        const {firstShot, lastShot} = data;
        const [sId, bKey, firstShotId] = getShotNameParts(firstShot);
        // if first shot was EOS, we have nothing to show.
        if (firstShotId === ShotIdentifiers.EOS) {
          setMsg(noShotExistMsg);
          return;
        }
        const [, , lastShotId] = getShotNameParts(lastShot);
        let totalShots = ts;
        // if last shot is an EOS, total shots displayable are one less
        if (lastShotId === ShotIdentifiers.EOS) {
          totalShots -= 1;
        }
        sessionIdRef.current = sId;
        buildKeyRef.current = bKey;
        shotIdStartRef.current = Number(firstShotId);
        if (Number.isNaN(shotIdStartRef.current)) {
          throw new TypeError(`Shot id ${firstShotId} looks invalid`);
        }
        shotUriTemplateRef.current = `${
          Application.STORAGE_HOST
        }/${shotBucket}/${getShotName(sId, bKey, SHOT_ID_TMPL)}`;
        setIndex(1); // show shot at first index
        setTotal(totalShots);
        setMsg(null);
      } catch (error) {
        handleApiError(
          error,
          (errorMsg) => setMsg(errorMsg),
          "Couldn't fetch screenshot details"
        );
      }
    }
    getShotBasicDetails();
    setMsg('Loading...');
  }, [versionId, shotBucket, buildId]);

  useEffect(() => {
    if (unmountedRef.current || index <= 0) {
      return;
    }
    const img = new Image();
    const src = shotUriTemplateRef.current.replace(
      SHOT_ID_TMPL,
      shotIdStartRef.current + (index - 1)
    );
    img.onload = () => {
      if (unmountedRef.current) {
        return;
      }
      // console.log(`image ${src} loaded`);
      setImageSrc(src);
      setIndexBoxValue(index);
    };
    img.src = src;
    img.onerror = () => {
      if (unmountedRef.current) {
        return;
      }
      setImageSrc(null);
      setAutoPlay(false); // These set states without checking existing are fine
      // as same value won't re render everything. I don't want this effect to
      // have any other dependency than 'index'.
      setMsg("Screenshot couldn't be loaded");
    };
  }, [index]);

  // start playback when autoPlay changes.
  // Note that refs rather than state values are used in recursive function cause
  // it will create a closure in the beginning and can't see state changes. 'total'
  // is from state as is won't change.
  // !! autoPlay is taken for a check and dependency rather than it's ref so that
  // this effect can run on changes in autoPlay.
  useEffect(() => {
    const startPlay = () => {
      if (unmountedRef.current) {
        return;
      }
      if (indexRef.current === total) {
        setAutoPlay(false);
        return;
      }
      setIndex((i) => i + 1);
      if (!unmountedRef.current && autoPlayRef.current) {
        setTimeout(() => startPlay(), AUTO_SLIDE_INTERVAL * speedRef.current);
      }
    };
    if (!autoPlay) {
      return;
    }
    startPlay();
  }, [autoPlay, total]);

  const onIndexBoxCommit = () => {
    let boxValue = indexBoxValue;
    // normalize boxValue
    // boxValue could be string if user change it being coming from text field
    if (typeof boxValue === 'string') {
      if (boxValue.length === 0) {
        boxValue = 1; // make it start index if left empty
      }
      boxValue = Number(boxValue);
    }
    if (Number.isNaN(boxValue) || boxValue < 1) {
      boxValue = 1;
    }
    if (
      !Number.isFinite(boxValue) ||
      boxValue > Number.MAX_SAFE_INTEGER ||
      boxValue > total
    ) {
      boxValue = total;
    }
    boxValue = Math.round(boxValue);
    setIndexBoxValue(boxValue);
    setIndex(boxValue);
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      onIndexBoxCommit();
    }
  };

  const blurHandler = () => {
    onIndexBoxCommit();
  };

  const handleIndexBoxChange = (e) => {
    setIndexBoxValue(e.target.value);
  };

  const handleSpeedChange = (e) => {
    setSpeed(e.target.value);
  };

  const autoPlayOn = () => {
    setAutoPlay(true);
  };

  const autoPlayOff = () => {
    setAutoPlay(false);
  };

  const replay = () => {
    setIndex(1);
    setAutoPlay(true);
  };

  const toggleFullScreen = () => {
    setFullScreen((f) => !f);
  };

  const handleNextIndex = useCallback(() => {
    if (index < total) {
      setIndex((i) => i + 1);
    }
  }, [index, total]);

  const handlePreviousIndex = useCallback(() => {
    if (index > 1) {
      setIndex((i) => i - 1);
    }
  }, [index]);

  useHotkeys('right', handleNextIndex, {}, [handleNextIndex]);
  useHotkeys('left', handlePreviousIndex, {}, [handlePreviousIndex]);

  const showRunDetails = () => {
    return (
      <Box flex={1} display="flex" alignItems="center" px={1}>
        {fullScreen ? (
          <Typography variant="body2" className={classes.showRunDetails}>
            {`# ${buildId}`}
          </Typography>
        ) : null}
        {fullScreen && versionId ? (
          <Typography
            variant="body2"
            className={clsx(classes.showRunDetails, classes.marginL16)}>
            {getVersionNamePath(fileName, testName, versionName)}
          </Typography>
        ) : null}
      </Box>
    );
  };

  return (
    <Box className={clsx(classes.root, fullScreen && classes.fullScreen)}>
      {imageSrc ? (
        <div className={classes.imageContainer}>
          <img
            src={imageSrc}
            alt="build screenshot"
            className={classes.image}
          />
          {!autoPlay ? (
            <>
              {index < total ? (
                <IconButton
                  aria-label="Next"
                  onClick={handleNextIndex}
                  title="Next"
                  color="inherit"
                  className={classes.next}>
                  <ArrowForwardIosIcon
                    fontSize="large"
                    className={classes.arrowButton}
                    classes={{fontSizeLarge: classes.fontSizeLarge}}
                  />
                </IconButton>
              ) : null}
              {index > 1 ? (
                <IconButton
                  aria-label="Previous"
                  onClick={handlePreviousIndex}
                  title="Previous"
                  color="inherit"
                  className={classes.previous}>
                  <ArrowBackIosIcon
                    fontSize="large"
                    className={clsx(
                      classes.arrowButton,
                      classes.arrowButtonPrevious
                    )}
                    classes={{fontSizeLarge: classes.fontSizeLarge}}
                  />
                </IconButton>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      {!imageSrc && msg ? (
        <Box mt="10%" display="flex" justifyContent="center">
          <Typography variant="body1" className={classes.msg}>
            {msg}
          </Typography>
        </Box>
      ) : null}
      <Box className={classes.controlStrip}>
        {imageSrc ? (
          <>
            {!autoPlay && index === total ? (
              <IconButton
                aria-label="Replay"
                onClick={replay}
                title="Replay"
                color="inherit"
                className={classes.iconButton}>
                <ReplayIcon fontSize="small" className={classes.icon} />
              </IconButton>
            ) : null}
            {!autoPlay && index < total ? (
              <IconButton
                aria-label="Play"
                onClick={autoPlayOn}
                title="Play"
                color="inherit"
                className={classes.iconButton}>
                <PlayArrowIcon fontSize="small" className={classes.icon} />
              </IconButton>
            ) : null}
            {autoPlay ? (
              <IconButton
                aria-label="Pause"
                onClick={autoPlayOff}
                title="Pause"
                color="inherit"
                className={classes.iconButton}>
                <PauseIcon fontSize="small" className={classes.icon} />
              </IconButton>
            ) : null}
            {showRunDetails()}
            <Box
              className={classes.indexBoxContainer}
              display="flex"
              alignItems="center">
              {/* Shown all the time cause it displays current index */}
              <TextField
                type="number"
                size="small"
                value={indexBoxValue}
                onChange={handleIndexBoxChange}
                onBlur={blurHandler}
                onKeyUp={keyUpHandler}
                margin="none"
                InputProps={{classes: {root: classes.indexBox}}}
                disabled={autoPlay}
              />
              <Typography variant="body2" className={classes.indexProgress}>
                of {total}
              </Typography>
            </Box>
            {autoPlay ? (
              <Select
                value={speed}
                onChange={handleSpeedChange}
                className={classes.select}
                classes={{
                  root: classes.input,
                  filled: classes.filled,
                  iconFilled: classes.iconFilled,
                }}
                disableUnderline>
                {Object.keys(Speeds).map((k) => (
                  <MenuItem value={Speeds[k]} key={k}>
                    {k}
                  </MenuItem>
                ))}
              </Select>
            ) : null}
            {!autoPlay ? (
              <Link
                href={imageSrc}
                aria-label="Download current screenshot"
                title="Download current screenshot"
                color="inherit"
                className={clsx(classes.iconButton, classes.downloadLink)}>
                <GetAppIcon
                  fontSize="small"
                  className={classes.icon}
                  style={{verticalAlign: 'middle'}}
                />
              </Link>
            ) : null}
          </>
        ) : null}
        {!imageSrc ? showRunDetails() : null}
        {!fullScreen ? (
          <IconButton
            aria-label="Full Screen"
            onClick={toggleFullScreen}
            title="Full Screen"
            color="inherit"
            className={classes.iconButton}>
            <FullscreenIcon fontSize="small" className={classes.icon} />
          </IconButton>
        ) : null}
        {fullScreen ? (
          <IconButton
            aria-label="Exit Full Screen"
            onClick={toggleFullScreen}
            title="Exit Full Screen"
            color="inherit"
            className={classes.iconButton}>
            <FullscreenExitIcon fontSize="small" className={classes.icon} />
          </IconButton>
        ) : null}
      </Box>
    </Box>
  );
};

ShotsViewer.propTypes = {
  buildId: PropTypes.number.isRequired,
  shotBucket: PropTypes.string.isRequired,
  versionId: PropTypes.number,
  fileName: PropTypes.string,
  testName: PropTypes.string,
  versionName: PropTypes.string,
};

ShotsViewer.defaultProps = {
  versionId: null,
  fileName: null,
  testName: null,
  versionName: null,
};

export default ShotsViewer;

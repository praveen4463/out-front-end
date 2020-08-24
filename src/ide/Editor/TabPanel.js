import React, {
  useEffect,
  useContext,
  useRef,
  useCallback,
  useReducer,
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import StopIcon from '@material-ui/icons/Stop';
import BuildIcon from '@material-ui/icons/Build';
import Portal from '@material-ui/core/Portal';
import {debounce} from 'lodash-es';
import CodeMirror from 'codemirror';
import clsx from 'clsx';
import produce, {immerable} from 'immer';
import {EDR_VERSION_CODE_UPDATED} from '../actionTypes';
import {IdeDispatchContext} from '../Contexts';
import Tooltip from '../../TooltipCustom';
import {RunType} from '../Constants';
import 'codemirror/lib/codemirror.css';
import './material-darker.css';
import './modes/zwl';

const useStyle = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
  },
  breadcrumb: {
    fontSize: '0.75rem',
  },
  accordionDetails: {
    height: theme.spacing(25),
    overflowY: 'scroll',
    borderTop: `1px solid ${theme.palette.border.light}`,
  },
  fontSizeSmall: {
    fontSize: '1rem',
  },
  fontSizeXSmall: {
    fontSize: '0.8rem',
  },
  iconButton: {
    padding: `${theme.spacing(0.25)}px ${theme.spacing(2)}px ${theme.spacing(
      0.25
    )}px ${theme.spacing(2)}px`,
    '&:hover': {
      backgroundColor: 'unset',
    },
  },
  statusMessage: {
    width: '100%',
    textAlign: 'center',
  },
  statusMessageError: {
    color: theme.palette.error.main,
  },
  statusMessageSuccess: {
    color: theme.palette.success.main,
  },
}));

const useSummaryStyle = makeStyles((theme) => ({
  root: {
    opacity: theme.textOpacity.highEmphasis,
    alignItems: 'center',
    minHeight: 0,
    '&$expanded': {
      minHeight: 0,
    },
  },
  expanded: {
    minHeight: 0,
  },
  content: {
    minHeight: 0,
    margin: 0,
    '&$expanded': {
      margin: 0,
    },
  },
  expandIcon: {
    padding: 0,
  },
}));

const actionTypes = {
  VERSION_CHANGED: 'VERSION_CHANGED',
  CURSOR_POS_CHANGED: 'CURSOR_POS_CHANGED',
  SCROLL_POS_CHANGED: 'SCROLL_POS_CHANGED',
  OUTPUT_PANEL_TOGGLED: 'OUTPUT_PANEL_TOGGLED',
  UPDATE_STATUS_MESSAGE: 'UPDATE_STATUS_MESSAGE',
};

// keeps version wise state used in uncontrolled components here, saved in a ref
// not in state.
function VersionLocalStateUncontrolled(
  versionId,
  cursorPos = {line: 0, ch: 0},
  scrollPos = {x: 0, y: 0}
) {
  this.versionId = versionId;
  this.cursorPos = cursorPos;
  this.scrollPos = scrollPos;
}

// keeps version wise state used in controlled components here, saved in state.
function VersionLocalStateControlled(
  versionId,
  outputPanelExpanded = false,
  statusMessage = {message: '', messageType: ''}
) {
  this.versionId = versionId;
  this.outputPanelExpanded = outputPanelExpanded;
  this.statusMessage = statusMessage;
  this[immerable] = true;
}

const StatusMessageType = {
  NORMAL: 'NORMAL',
  ERROR: 'ERROR',
  SUCCESS: 'ERROR',
};

// reducer for controlled state.
const reducer = (state, action) => {
  const {type, payload} = action;
  if (payload.versionId === undefined) {
    throw new Error(`Insufficient arguments to ${type}`);
  }
  const {versionId} = payload;
  switch (type) {
    case actionTypes.OUTPUT_PANEL_TOGGLED:
      if (payload.outputPanelExpanded === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      return produce(state, (draft) => {
        if (draft[versionId] === undefined) {
          draft[versionId] = new VersionLocalStateControlled(versionId);
        }
        draft[versionId].outputPanelExpanded = payload.outputPanelExpanded;
      });
    case actionTypes.UPDATE_STATUS_MESSAGE:
      if (payload.statusMessage === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      return produce(state, (draft) => {
        if (draft[versionId] === undefined) {
          draft[versionId] = new VersionLocalStateControlled(versionId);
        }
        draft[versionId].statusMessage = payload.statusMessage;
      });
    default:
      return state;
  }
};

const TabPanel = React.memo(
  ({version, testName, fileName, lineColContainerRef}) => {
    console.log('re rendering..');
    const dispatchGlobal = useContext(IdeDispatchContext);
    /* state looks like following:
    {
      versionId: VersionLocalStateControlled,
      versionId: VersionLocalStateControlled,
      ...
    } */
    const [versionsStateControlled, dispatchControlled] = useReducer(
      reducer,
      {}
    );
    /*
    Together with a controlled state, an uncontrolled version wise state is also
    kept in a ref rather than using a reducer cause
    we're not using controlled code editor and don't require a re render on
    state change, we just need to remember changed done for a version when it
    is opened in editor so that when it is switched back, those changes could
    be applied such as cursor, scroll position and bottom panel expand state.
    State will be mutated directly and it's not a react state. We'll use reducer
    like actions to update state from various locations.
    */
    /* state looks like following:
    {
      versionId: VersionLocalStateUncontrolled,
      versionId: VersionLocalStateUncontrolled,
      ...
    } */
    const versionsStateUncontrolled = useRef({});
    const textAreaRef = useRef();
    const editorRef = useRef();
    const lineColTextRef = useRef();
    const classes = useStyle();
    const summary = useSummaryStyle();

    const dispatchUncontrolled = useCallback((action) => {
      const state = versionsStateUncontrolled.current;
      const {type, payload} = action;
      if (payload.versionId === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      const {versionId} = payload;
      switch (type) {
        case actionTypes.VERSION_CHANGED: {
          // if this version is already in state, don't do anything.
          if (
            state[versionId] &&
            state[versionId].constructor === VersionLocalStateUncontrolled
          ) {
            return state;
          }
          state[versionId] = new VersionLocalStateUncontrolled(versionId);
          break;
        }
        case actionTypes.CURSOR_POS_CHANGED: {
          if (payload.cursorPos === undefined) {
            throw new Error(`Insufficient arguments to ${type}`);
          }
          state[versionId].cursorPos.line = payload.cursorPos.line;
          state[versionId].cursorPos.ch = payload.cursorPos.ch;
          break;
        }
        case actionTypes.SCROLL_POS_CHANGED:
          if (payload.scrollPos === undefined) {
            throw new Error(`Insufficient arguments to ${type}`);
          }
          state[versionId].scrollPos.x = payload.scrollPos.left;
          state[versionId].scrollPos.y = payload.scrollPos.top;
          break;
        default:
          break;
      }
      return null;
    }, []);

    const writeStatusMessage = useCallback(
      (message, messageType = StatusMessageType.NORMAL) => {
        dispatchControlled({
          type: actionTypes.UPDATE_STATUS_MESSAGE,
          payload: {
            versionId: version.id,
            statusMessage: {message, messageType},
          },
        });
      },
      [version.id]
    );

    const handleAfterChange = useCallback(
      (editor) => {
        const value = editor.getValue();
        if (value === version.code) {
          return;
        }
        console.log('going to save code');
        writeStatusMessage('Saving changes...');
        dispatchGlobal({
          type: EDR_VERSION_CODE_UPDATED,
          payload: {versionId: version.id, versionCode: value},
        });
        // send api request, if fails show user error in status bar and ask
        // them to save code locally until problem is resolved.
        // if saved successfully
        // remove following timeout when api is here.
        setTimeout(() => writeStatusMessage('All changes saved.'), 200);
      },
      [version.id, version.code, writeStatusMessage, dispatchGlobal]
    );

    const getLineColText = (line, col) => {
      return `Ln ${line}, Col ${col}`;
    };

    const handleCursor = useCallback(
      (editor) => {
        const cursor = editor.getDoc().getCursor();
        if (lineColTextRef.current) {
          lineColTextRef.current.textContent = getLineColText(
            cursor.line + 1,
            cursor.ch + 1
          );
        }
        if (cursor.sticky) {
          // sticky: https://codemirror.net/doc/manual.html#api
          // whenever events are added to editor, cursor change fires with 0, 0
          // and sticky null, we don't want to listen to that particular event,
          // as it rewrites previously saved state of version, thus checking
          // whether it's null prevents running the state change code during
          // mount and tab changes.
          console.log('cursor change invoked with', cursor);
          dispatchUncontrolled({
            type: actionTypes.CURSOR_POS_CHANGED,
            payload: {
              versionId: version.id,
              cursorPos: cursor,
            },
          });
        }
      },
      [dispatchUncontrolled, version.id]
    );

    const handleScroll = useCallback(
      (editor) => {
        console.log('handleScroll invoked', editor.getScrollInfo());
        dispatchUncontrolled({
          type: actionTypes.SCROLL_POS_CHANGED,
          payload: {
            versionId: version.id,
            scrollPos: editor.getScrollInfo(),
          },
        });
      },
      [dispatchUncontrolled, version.id]
    );

    // !!! Order of following effects matter.
    useEffect(() => {
      console.log('effect to instantiate editor run');
      editorRef.current = CodeMirror.fromTextArea(textAreaRef.current, {
        mode: 'zwl',
        lineNumbers: true,
        theme: 'material-darker',
        tabSize: 2,
        indentUnit: 2,
        extraKeys: {
          Tab: (cm) => {
            const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
            cm.replaceSelection(spaces);
          },
        },
        spellcheck: true,
      });
      return () => {
        const editor = editorRef.current;
        if (editor) {
          editor.toTextArea();
        }
      };
    }, []);

    useEffect(() => {
      console.log('effect to attach editor events run');
      const manageEvents = (shouldRegister) => {
        const editor = editorRef.current;
        const fn = shouldRegister ? CodeMirror.on : CodeMirror.off;
        fn(
          editor,
          'change',
          debounce(handleAfterChange, 1000, {
            leading: false,
            trailing: true,
          })
        );
        fn(editor, 'cursorActivity', handleCursor);
        fn(editor, 'scroll', handleScroll);
      };
      manageEvents(true);
      return () => manageEvents(false);
    }, [handleAfterChange, handleCursor, handleScroll]);

    useEffect(() => {
      dispatchUncontrolled({
        type: actionTypes.VERSION_CHANGED,
        payload: {
          versionId: version.id,
        },
      });
      console.log(
        'effect to update version changed state run',
        versionsStateUncontrolled.current
      );
    }, [dispatchUncontrolled, version.id]);

    // When code changes, apply it. This is separate because code is taken from
    // props.
    useEffect(() => {
      const editor = editorRef.current;
      if (editor.getValue() === version.code) {
        return;
      }
      editor.setValue(version.code);
      console.log('editor value is set');
    }, [version.code]);

    // When a version is changed, apply version's state.
    useEffect(() => {
      const editor = editorRef.current;
      const state = versionsStateUncontrolled.current;
      console.log(
        'effect run to apply editor state on version change',
        state[version.id]
      );
      editor.setCursor(state[version.id].cursorPos);
      const {scrollPos} = state[version.id];
      editor.scrollTo(scrollPos.x, scrollPos.y);
      editor.focus();
    }, [dispatchUncontrolled, version.id]);

    const toggleOutputPanel = (isExpanded) => {
      dispatchControlled({
        type: actionTypes.OUTPUT_PANEL_TOGGLED,
        payload: {versionId: version.id, outputPanelExpanded: isExpanded},
      });
    };

    const handleAccordionToggle = (event, isExpanded) => {
      toggleOutputPanel(isExpanded);
    };

    const getStatusMsgStyle = () => {
      const state = versionsStateControlled[version.id];
      if (!state) {
        return null;
      }
      if (state.statusMessage.messageType === StatusMessageType.ERROR) {
        return classes.statusMessageError;
      }
      if (state.statusMessage.messageType === StatusMessageType.SUCCESS) {
        return classes.statusMessageSuccess;
      }
      return null;
    };

    return (
      <>
        <Box
          display="flex"
          flexDirection="column"
          flex={1}
          id={`scrollable-auto-tabpanel-${version.id}`}
          aria-labelledby={`scrollable-auto-tab-${version.id}`}
          className={classes.root}>
          <Box boxShadow={3}>
            <Typography
              variant="caption"
              className={classes.breadcrumb}
              data-testid="tab-panel-breadcrumb">
              {`${fileName} > ${testName} > ${version.name}`}
            </Typography>
          </Box>
          <Box display="flex" flexDirection="column" flex={1}>
            <textarea ref={textAreaRef} />
          </Box>
          <Box>
            {/* TODO: Right now accordion can't be resized, later if neeeded we
        can do this using bokuweb/re-resizable lib */}
            <Accordion
              expanded={
                versionsStateControlled[version.id]
                  ? versionsStateControlled[version.id].outputPanelExpanded
                  : false
              }
              onChange={handleAccordionToggle}
              square>
              <AccordionSummary
                expandIcon={<ExpandLessIcon />}
                id={`build-section-tabpanel-${version.id}`}
                classes={{
                  root: summary.root,
                  expanded: summary.expanded,
                  content: summary.content,
                  expandIcon: summary.expandIcon,
                }}>
                <Tooltip title="Run Build For This Version">
                  <IconButton
                    aria-label="Run Build For This Version"
                    className={classes.iconButton}
                    disableFocusRipple
                    disableRipple>
                    <PlayArrowIcon
                      fontSize="small"
                      classes={{fontSizeSmall: classes.fontSizeSmall}}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Stop Build">
                  <IconButton
                    aria-label="Stop Build For This Version"
                    className={classes.iconButton}
                    disableFocusRipple
                    disableRipple>
                    <StopIcon
                      color="disabled"
                      fontSize="small"
                      classes={{fontSizeSmall: classes.fontSizeSmall}}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Parse This Version">
                  <IconButton
                    aria-label="Parse This Version"
                    className={classes.iconButton}
                    disableFocusRipple
                    disableRipple>
                    <BuildIcon
                      fontSize="small"
                      classes={{fontSizeSmall: classes.fontSizeXSmall}}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Dry Run This Version">
                  <IconButton
                    aria-label="Dry Run This Version"
                    className={classes.iconButton}
                    disableFocusRipple
                    disableRipple>
                    <CheckCircleIcon
                      fontSize="small"
                      classes={{fontSizeSmall: classes.fontSizeXSmall}}
                    />
                  </IconButton>
                </Tooltip>
                <Typography
                  variant="caption"
                  aria-label="Status"
                  className={clsx(classes.statusMessage, getStatusMsgStyle())}
                  data-testid="editorStatusMessage">
                  {versionsStateControlled[version.id]
                    ? versionsStateControlled[version.id].statusMessage.message
                    : null}
                </Typography>
              </AccordionSummary>
              <AccordionDetails classes={{root: classes.accordionDetails}}>
                <Typography variant="caption" />
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
        <Portal container={lineColContainerRef.current}>
          <Typography
            variant="caption"
            data-testid="lineColContainer"
            ref={lineColTextRef}>
            {getLineColText(1, 1)}
          </Typography>
        </Portal>
      </>
    );
  }
);

TabPanel.propTypes = {
  version: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    testId: PropTypes.number,
    code: PropTypes.string,
    isCurrent: PropTypes.bool,
    hasError: PropTypes.bool,
    lastRunOutput: PropTypes.string,
    runType: PropTypes.oneOf(Object.keys(RunType)),
  }).isRequired,
  testName: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  lineColContainerRef: PropTypes.exact({
    current: PropTypes.any,
  }).isRequired,
};

export default TabPanel;

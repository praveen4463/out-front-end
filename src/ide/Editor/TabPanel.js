import React, {
  useEffect,
  useContext,
  useRef,
  useCallback,
  useReducer,
  useState,
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import BuildIcon from '@material-ui/icons/Build';
import Portal from '@material-ui/core/Portal';
import {debounce, uniq} from 'lodash-es';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/dialog/dialog.css';
import './show-hint.css';
import './cm.css';
import CodeMirror from 'codemirror';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/trailingspace';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/selection/active-line';
import clsx from 'clsx';
import produce, {immerable} from 'immer';

import allHints from './addons/all-hints';
import {BATCH_ACTIONS, EDR_VERSION_CODE_UPDATED} from '../actionTypes';
import {IdeDispatchContext, IdeVarsContext} from '../Contexts';
import Tooltip from '../../TooltipCustom';
import {LastRun, LastRunError} from '../Explorer/model';
import {ApiStatuses, RunType, ZwlLexer} from '../Constants';
import batchActions, {getLastRunAction} from '../actionCreators';
import './material-darker.css';
import './modes/zwl';

const useStyle = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
  },
  breadcrumb: {
    fontSize: '0.75rem',
    opacity: theme.textOpacity.mediumEmphasis,
  },
  accordionDetails: {
    display: 'flex',
    flexDirection: 'column',
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
  output: {
    fontFamily: "'Fira Mono', 'Courier New', Courier, monospace",
    fontSize: '0.875rem',
    fontWeight: 'normal',
    lineHeight: 1.5,
    color: theme.palette.background.contrastText,
    margin: `${theme.spacing(1)}px 0px`,
  },
  outputError: {
    color: theme.palette.error.main,
    marginTop: 0,
  },
  link: {
    cursor: 'pointer',
    padding: '0 5px',
    height: '100%',
    display: 'inline-block',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    backgroundColor: theme.palette.linkTab.background,
    '&:hover': {
      backgroundColor: theme.palette.linkTab.hoverBackground,
      textDecoration: 'none',
    },
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

const CODE_SAVE_WAIT_TIME = 5000;
const SAVE_MSG = 'All changes saved';

const actionTypes = {
  VERSION_CHANGED: 'VERSION_CHANGED',
  CURSOR_POS_CHANGED: 'CURSOR_POS_CHANGED',
  SCROLL_POS_CHANGED: 'SCROLL_POS_CHANGED',
  OUTPUT_PANEL_TOGGLED: 'OUTPUT_PANEL_TOGGLED',
  UPDATE_STATUS_MESSAGE: 'UPDATE_STATUS_MESSAGE',
  SET_OUTPUT_NORMAL: 'SET_OUTPUT_NORMAL',
  SET_OUTPUT_ERROR: 'SET_OUTPUT_ERROR',
  CLEAR_OUTPUT: 'CLEAR_OUTPUT',
};

// keeps version wise state used in uncontrolled components here, saved in a ref
// not in state.
// TODO: add selection to keep selections of ranges in state.
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
  statusMessage = {message: null, messageType: null},
  outputNormal = null,
  outputError = null
) {
  this.versionId = versionId;
  this.outputPanelExpanded = outputPanelExpanded;
  this.statusMessage = statusMessage;
  this.outputNormal = outputNormal;
  this.outputError = outputError;
  this[immerable] = true;
}

const StatusMessageType = {
  NORMAL: 'NORMAL',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
};

// reducer for controlled state.
const reducerInner = produce((draft, action) => {
  const {type, payload} = action;
  if (payload.versionId === undefined) {
    throw new Error(`Insufficient arguments to ${type}`);
  }
  const {versionId} = payload;
  if (draft[versionId] === undefined) {
    draft[versionId] = new VersionLocalStateControlled(versionId);
  }
  switch (type) {
    case actionTypes.OUTPUT_PANEL_TOGGLED:
      if (payload.outputPanelExpanded === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      draft[versionId].outputPanelExpanded = payload.outputPanelExpanded;
      break;
    case actionTypes.UPDATE_STATUS_MESSAGE: {
      if (payload.statusMessage === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      const msg = payload.statusMessage;
      if (msg.message === undefined || msg.messageType === undefined) {
        throw new Error(`Invalid arguments to ${type}`);
      }
      draft[versionId].statusMessage = msg;
      break;
    }
    case actionTypes.SET_OUTPUT_NORMAL:
      if (payload.outputNormal === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      draft[versionId].outputNormal = payload.outputNormal;
      break;
    case actionTypes.SET_OUTPUT_ERROR:
      if (payload.outputError === undefined) {
        throw new Error(`Insufficient arguments to ${type}`);
      }
      draft[versionId].outputError = payload.outputError;
      break;
    case actionTypes.CLEAR_OUTPUT:
      draft[versionId].outputNormal = null;
      draft[versionId].outputError = null;
      break;
    default:
      break;
  }
});

// !! This component mounts once a tab is opened and kept mounted until all tabs
// are closed, so if there is one tab, and another replaces it, it will keep mounted.
// All tabs share this same component instance, which means it re renders on each
// tab change and has to show everything specific to the selected tab. To maintain
// this specificity, we should keep state by versionId which uniquely identifies
// a tab. A state that is not kept by versionId will be treated as global to this
// component and will reflect in all tabs.
// effect are written very precisely here to keep the uncontrolled code editor's
// state in sync with tab changes and user actions. Pay special attention to the
// dependency list while changing/adding anything and measure that component is
// re rendering just about right time.
// Re rendering due to context/local state changes don't affect uncontrolled
// component but we should make sure effect don't run unnecessarily by keeping
// their dependency list exact what is required for them.
const TabPanel = React.memo(
  ({version, testName, fileName, lineColContainerRef}) => {
    // console.log('re rendering..');
    const dispatchGlobal = useContext(IdeDispatchContext);
    const vars = useContext(IdeVarsContext);
    const unmounted = useRef(false);

    function reducer(state, action) {
      if (unmounted.current) {
        // if this component is unmounted, don't change local state.
        return state;
      }
      switch (action.type) {
        case BATCH_ACTIONS:
          return action.actions.reduce(reducer, state);
        default:
          return reducerInner(state, action);
      }
    }

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
    // this is a global state for component, setting it reflects in all tabs
    const [runOngoing, setRunOngoing] = useState(false);
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
    const editorStatusMessageRef = useRef(); // used in checking the current message in status
    const afterChangeDebounceRef = useRef(); // used in flushing or cancelling changes from anywhere
    const classes = useStyle();
    const summary = useSummaryStyle();

    // !! should remain dependency free like any other dispatch.
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

    // This function is debounced and runs after some code is written.
    // If user tries to navigate away from current tab, debounced is flushed
    // so any pending invocation is run immediately, in that case, as far as
    // I understand react may run certain things more that once so they
    // behave as expected, such as dispatch call which runs twice
    // in that case. Since changing state with the same thing again has no
    // effect we don't need any change in it, but if some code here may be
    // affected by more than one invocation in a row, protect it with some
    // condition.
    // TODO: see doc.changeGeneration for a better way to track 'real' changes.
    const handleAfterChange = useCallback(
      (editor, changeObj) => {
        if (changeObj.origin === 'setValue') {
          // this change is coming as part of the setValue api that changes
          // editor's text.
          return;
        }
        const value = editor.getValue();
        const codeUpdateAction = {
          type: EDR_VERSION_CODE_UPDATED,
          payload: {versionId: version.id, versionCode: value},
        };

        const onSuccess = (response) => {
          const actions = [codeUpdateAction];
          const parseRes = response.parseResult;
          if (parseRes) {
            const lastRunAction = getLastRunAction(
              version.id,
              RunType.PARSE_RUN,
              parseRes.status === ApiStatuses.FAILURE
                ? null
                : 'Parsing completed, no problems found',
              parseRes.status === ApiStatuses.FAILURE
                ? new LastRunError(
                    parseRes.error.msg,
                    parseRes.error.from,
                    parseRes.error.to
                  )
                : null,
              false
            );
            actions.push(lastRunAction);
          }
          dispatchGlobal(batchActions(actions));
          writeStatusMessage(SAVE_MSG);
          // When changes saved messages is printed, we want it to disappear
          // after sometime so that user know exactly when their code is getting
          // saved rather than showing it forever.
          if (!parseRes || parseRes.status === ApiStatuses.SUCCESS) {
            setTimeout(() => {
              const statusMsgRef = editorStatusMessageRef.current;
              if (
                statusMsgRef &&
                statusMsgRef.textContent &&
                statusMsgRef.textContent.trim() === SAVE_MSG
              ) {
                writeStatusMessage('');
              }
            }, 5000);
          }
        };

        const onError = (response) => {
          // when version couldn't save, no parsing is done.
          // save the code in state even if it's not saved to db.
          dispatchGlobal(codeUpdateAction);
          writeStatusMessage(
            `Couldn't save changes, ${response.error.reason}`,
            StatusMessageType.ERROR
          );
        };
        // TODO: Replace following timeout and sample values with real api call
        // and results.
        setTimeout(() => {
          const response = value.includes('FAIL_TEST')
            ? {
                status: ApiStatuses.SUCCESS,
                parseResult: {
                  status: ApiStatuses.FAILURE,
                  error: {
                    msg: "no viable alternative at input 'a+' line 2:2",
                    from: {line: 2, ch: 1},
                    to: {line: 2, ch: 2}, // !!Note: api should always send the 'to' column that is after the 'to' char
                  },
                },
              }
            : {
                status: ApiStatuses.SUCCESS,
                parseResult:
                  value && value.replace(/[\s\n\r\t]*/, '').length
                    ? {
                        status: ApiStatuses.SUCCESS,
                      }
                    : null, // TODO: !!if there was no real code, api shouldn't do any parsing
              };
          /* sample response when save fails
          const response = {
            status: ApiStatuses.FAILURE,
            parseResult: null,
            error: {
              reason: 'Network error',
            },
          }; */
          // console.log('going to save code', changeObj);
          if (response.status === ApiStatuses.SUCCESS) {
            onSuccess(response);
          } else {
            onError(response);
          }
        }, 200);
      },
      [version.id, dispatchGlobal, writeStatusMessage]
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
        if (cursor.sticky === null && cursor.line === 0 && cursor.ch === 0) {
          // sticky: https://codemirror.net/doc/manual.html#api
          // whenever events are added to editor, cursor change fires with 0, 0
          // and sticky null, we don't want to listen to that particular event,
          // as it rewrites previously saved state of version, thus checking
          // whether it's null prevents running the state change code during
          // mount and tab changes.
          // this condition seems safe as when cursor is manually moves to 0, 0
          // sticky is not null.
          return;
        }
        dispatchUncontrolled({
          type: actionTypes.CURSOR_POS_CHANGED,
          payload: {
            versionId: version.id,
            cursorPos: cursor,
          },
        });
      },
      [dispatchUncontrolled, version.id]
    );

    const handleScroll = useCallback(
      (editor) => {
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
    // !! should remain dependency free
    useEffect(() => {
      // console.log('effect to instantiate editor run');
      editorRef.current = CodeMirror.fromTextArea(textAreaRef.current, {
        mode: 'zwl',
        lineNumbers: true,
        theme: 'material-darker',
        tabSize: 2,
        indentUnit: 2,
        // key map order must be Shift-Cmd-Ctrl-Alt when combination keys are
        // used, see key-maps. Function names are taken from add-on's files
        // Note: don't put key property as multiple key, repeat entries if more
        // than one key needs to be mapped to same function.
        extraKeys: {
          Tab: (cm) => {
            const spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
            cm.replaceSelection(spaces);
          },
          'Cmd-F': 'findPersistent',
          'Ctrl-F': 'findPersistent',
        },
        spellcheck: true,
        autoCloseBrackets: '()[]{}\'\'""``',
        matchBrackets: true,
        showTrailingSpace: true,
        highlightSelectionMatches: true,
        styleActiveLine: true,
      });
      return () => {
        const editor = editorRef.current;
        if (editor) {
          editor.toTextArea();
        }
        unmounted.current = true;
      };
    }, []);

    useEffect(() => {
      // console.log('effect to attach editor events run');
      // !! Note that debounce shouldn't re create during the the time a version
      // is opened in editor and focused (means it's tab selected). So, every
      // dependency of this effect shouldn't re create until a version is
      // changed. If we change debounce, it's own state that keeps last invoke
      // time will reset.
      afterChangeDebounceRef.current = debounce(
        handleAfterChange,
        CODE_SAVE_WAIT_TIME,
        {
          leading: false,
          trailing: true,
        }
      );
      const manageEvents = (shouldRegister) => {
        const editor = editorRef.current;
        const fn = shouldRegister ? CodeMirror.on : CodeMirror.off;
        // !! don't use blur for flushing debounce when something else is going to run
        // like a dry run because it will have to use latest code. Using blur can
        // trigger flushing on anything like mouse clicking on hints. invoke flush
        // method on the debounce ref instead from wherever we need it.
        fn(editor, 'change', afterChangeDebounceRef.current);
        fn(editor, 'cursorActivity', handleCursor);
        fn(editor, 'scroll', handleScroll);
      };
      manageEvents(true);
      return () => {
        afterChangeDebounceRef.current.flush();
        manageEvents(false);
      };
    }, [handleAfterChange, handleCursor, handleScroll]);

    // auto complete event depends on vars context, thus it's kept separate.
    useEffect(() => {
      const handleAutoComplete = (editor, event) => {
        // The key should be either a-z 0-9 or a dot char
        if (!event.isTrusted || !/(^\w|\.)$/.test(event.key)) {
          return;
        }
        // send only keys that are valid identifiers, otherwise accessing non
        // identifiers will result in parse error, users need to use non
        // identifiers as string like age = globals["åjumen"]
        // TODO: write in docs that hint would only hint valid identifiers for
        // global variables.
        editor.showHint({
          hint: allHints,
          completeSingle: false,
          globals: vars.global
            ? vars.global.result
                .map((r) => vars.global.entities.globalVars[r].key)
                .filter((k) => ZwlLexer.IDENTIFIER_WITH_START_END.test(k))
            : [],
          buildVars: vars.build
            ? uniq(
                vars.build.result
                  .map((r) => vars.build.entities.buildVars[r].key)
                  .filter((k) => ZwlLexer.IDENTIFIER_WITH_START_END.test(k))
              )
            : [],
        });
      };

      const manageEvents = (shouldRegister) => {
        const editor = editorRef.current;
        const fn = shouldRegister ? CodeMirror.on : CodeMirror.off;
        fn(editor, 'keyup', handleAutoComplete);
      };
      manageEvents(true);
      return () => {
        manageEvents(false);
      };
    }, [vars.build, vars.global]);

    useEffect(() => {
      dispatchUncontrolled({
        type: actionTypes.VERSION_CHANGED,
        payload: {
          versionId: version.id,
        },
      });
      /* console.log(
        'effect to update version changed state run',
        versionsStateUncontrolled.current
      ); */
    }, [dispatchUncontrolled, version.id]);

    // When code changes, apply it. This is separate because code is taken from
    // props.
    useEffect(() => {
      const editor = editorRef.current;
      // effect should set code only on version change.
      if (editor.getValue() === version.code) {
        return;
      }
      editor.setValue(version.code);
      // console.log('editor value is set');
    }, [version.code]);

    // When a version is changed, apply version's state.
    useEffect(() => {
      const editor = editorRef.current;
      const state = versionsStateUncontrolled.current;
      /* console.log(
        'effect run to apply editor state on version change',
        state[version.id]
      ); */
      editor.setCursor(state[version.id].cursorPos);
      const {scrollPos} = state[version.id];
      editor.scrollTo(scrollPos.x, scrollPos.y);
      editor.focus();
    }, [dispatchUncontrolled, version.id]);

    // When a version's lastRun is changed, i.e something has just run, show the
    // results. When a version is changed, show it's last completed run if any.
    // This last run loading effect runs when some version loads and has lastRun and
    // on completion of an ongoing run.
    /*
    TODO: write following in site docs
    The output panel with editor is meant to show recent run information and won't
    keep previous runs expect the most recent. For example if you dry run from within
    the tab, it's result will show up in tab's own panel, but as soon as you edit
    something, the auto parser runs, overwrite the result of dry run and show result
    of parsing. This is intentional to keep tab's output panel focused on the most
    recent run and it's output.
    When you run using controls at header panel, the run information is kept at
    bottom panel until any other run is requested.
    */
    useEffect(() => {
      const getRunTypeShort = (runType) => {
        switch (runType) {
          case RunType.PARSE_RUN:
            return 'parsing';
          case RunType.DRY_RUN:
            return 'dry run';
          case RunType.BUILD_RUN:
            return 'build run';
          default:
            throw new Error('Unrecognized run type');
        }
      };

      const getStatusMsg = (runType, success = false) => {
        return `${getRunTypeShort(runType)} ${
          success ? 'passed' : 'failed'
        }, expand for ${success ? 'output' : 'error'}`;
      };

      if (!version.lastRun || runOngoing) {
        // if something is running, don't load lastRun for any tab. We're treating
        // editor as frozen once something is running and don't want to load any
        // previously completed runs to prevent following bug.
        // Imagine user has completed a dry run and the result of that is in
        // editor's output panel. They start another dry run after making some
        // change. While it's being running, they opened another tab but immediately
        // moved to the one where second dry run is running. Since that version has
        // already completed a dry run, it's result loads into panel replacing the
        // dry run running.. loading message and after sometime the result of currently
        // running dry run appears. If previous and current results were same, user
        // may not know when their dry run completed. So, we should not load any last
        // run detail if something is running.
        // I could have kept ongoing run per version but that will require version wise
        // storage of it together with a single session storage, also since we're freezing
        // editor while something is running, I feel it is ok if we don't load last run in
        // midst while anything running, it makes sense because user can't interact with
        // editor anyway.
        // TODO: write this behaviour in site docs.
        return;
      }
      const editor = editorRef.current;
      const doc = editor.getDoc();
      const allMarks = doc.getAllMarks();
      if (Array.isArray(allMarks)) {
        allMarks.forEach((m) => {
          m.clear();
        });
      }
      const actions = [
        {
          type: actionTypes.CLEAR_OUTPUT,
          payload: {versionId: version.id},
        },
      ];
      const run = version.lastRun;
      const {error} = run;
      if (error || run.showSuccessMsgInStatus) {
        actions.push({
          type: actionTypes.UPDATE_STATUS_MESSAGE,
          payload: {
            versionId: version.id,
            statusMessage: {
              message: getStatusMsg(run.runType, !error),
              messageType: error
                ? StatusMessageType.ERROR
                : StatusMessageType.SUCCESS,
            },
          },
        });
      }
      // Don't open output panel
      // when some version has lastRun and its tab is loaded, just write status
      // and let them see it and open on their will.
      if (error) {
        actions.push({
          type: actionTypes.SET_OUTPUT_ERROR,
          payload: {versionId: version.id, outputError: error.msg},
        });
        // markText requires 0 index based line:ch whereas api returns actual
        // line:ch, thus need to -1 and create new objects.
        const from = {line: error.fromPos.line - 1, ch: error.fromPos.ch - 1};
        const to = {line: error.toPos.line - 1, ch: error.toPos.ch - 1};
        doc.markText(from, to, {
          className: 'cm-errorText',
        });
        editor.scrollIntoView({from, to});
        // scroll to the mark but don't change cursor position.
      }
      if (run.output) {
        actions.push({
          type: actionTypes.SET_OUTPUT_NORMAL,
          payload: {versionId: version.id, outputNormal: run.output},
        });
      }
      dispatchControlled(batchActions(actions));
    }, [version.id, version.lastRun, runOngoing]);

    const toggleOutputPanel = (isExpanded) => {
      dispatchControlled({
        type: actionTypes.OUTPUT_PANEL_TOGGLED,
        payload: {versionId: version.id, outputPanelExpanded: isExpanded},
      });
    };

    const isOutputPanelOpened = () => {
      const state = versionsStateControlled[version.id];
      if (!state) {
        return false;
      }
      return state.outputPanelExpanded;
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

    // uses state rather than state by version because at a time only
    // one version could be in running state. So once a run request initiated
    // from any version, editor becomes readonly and run controls disabled for
    // all versions in editor, since the run feature with editor is meant to
    // run one version only. If user wants more than one version running, they
    // can use top icons.
    // TODO: find way to invoke this from outside so that 'run all' can use it
    // to freeze editor contents.
    const toggleRunOngoing = (running) => {
      setRunOngoing(running);
      editorRef.current.setOption('readOnly', running);
    };

    const stopRunWhenNoCode = () => {
      const error = 'Want to write some code before trying to build it?';
      const code = editorRef.current.getValue();
      if (!(code && code.replace(/[\s\n\r\t]*/, '').length)) {
        dispatchControlled(
          batchActions([
            {
              type: actionTypes.CLEAR_OUTPUT,
              payload: {versionId: version.id},
            },
            {
              type: actionTypes.SET_OUTPUT_ERROR,
              payload: {versionId: version.id, outputError: error},
            },
          ])
        );
        return true;
      }
      return false;
    };

    const handleBuild = (event) => {
      // when panel is closed, and any action buttons are clicked, we want it to
      // open so that when the output arrives, we don't have to explicitly open
      // it and decide whether to open and not (for example when parsing together
      // with saving, we don't open.). We want to open only when explicitly some
      // action is triggered.
      // So if user clicks on an opened panel, don't close it.
      if (isOutputPanelOpened()) {
        event.stopPropagation();
      }
      if (stopRunWhenNoCode()) {
        return;
      }
      afterChangeDebounceRef.current.flush();
      // TODO: trigger a build run the normal way, i.e open the build config
      // and select this version only, then all should work normally. This works
      // as just a shortcut. While build is running, continuous output appears
      // in bottom panel, it makes sense to not put that here because when live
      // preview panel is expanded fully, this panel will get hidden behind it.
      // Once build is started, api is polled to fetch the output and once one
      // version completes, it gets updated globally in 'files' i.e version.lastRun
      // is updated. This will trigger a re render of this current component only if
      // the currently opened version is the one that was updated after completion,
      // on re render, effect runs which will set the final output here in the
      // panel and point to the error if any.

      // We can simulate this sending the same version's lastRun dispatch to
      // global reducer, but it will work same as this component doing for dry
      // run, so no need to replicate.

      // set text 'build running', set toggleRunOngoing(true), trigger a build run,
      // pass toggleRunOngoing(false) that should be called back once build run
      // completes/stopped/cancelled.
    };

    const handleParse = (event) => {
      // when panel is closed, and any action buttons are clicked, we want it to
      // open so that when the output arrives, we don't have to explicitly open
      // it and decide whether to open and not (for example when parsing together
      // with saving, we don't open.). We want to open only when explicitly some
      // action is triggered.
      // So if user clicks on an opened panel, don't close it.
      if (isOutputPanelOpened()) {
        event.stopPropagation();
      }
      if (stopRunWhenNoCode()) {
        return;
      }
      afterChangeDebounceRef.current.flush();
      const onSuccess = () => {
        const lastRunAction = getLastRunAction(
          version.id,
          RunType.PARSE_RUN,
          'Parsing completed, no problems found'
        );
        dispatchGlobal(lastRunAction);
      };

      const onError = (response) => {
        const {error} = response;
        const lastRunAction = getLastRunAction(
          version.id,
          RunType.PARSE_RUN,
          null,
          new LastRunError(error.msg, error.from, error.to)
        );
        dispatchGlobal(lastRunAction);
      };
      // TODO: Replace following timeout and sample values with real api call
      // and results. This api will just parse using a versionId.
      setTimeout(() => {
        const response = editorRef.current.getValue().includes('FAIL_TEST')
          ? {
              status: ApiStatuses.FAILURE,
              error: {
                msg: "token recognition error at: '@' line 3:12",
                from: {line: 3, ch: 12},
                // !!Note: api should always send the 'to' column that is after the 'to' char
                to: {line: 3, ch: 13},
              },
            }
          : {
              status: ApiStatuses.SUCCESS,
            };
        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess();
        } else {
          onError(response);
        }
        toggleRunOngoing(false);
      }, 1000);
      dispatchControlled(
        batchActions([
          {type: actionTypes.CLEAR_OUTPUT, payload: {versionId: version.id}},
          {
            type: actionTypes.SET_OUTPUT_NORMAL,
            payload: {versionId: version.id, outputNormal: 'Parsing...'},
          },
        ])
      );
      toggleRunOngoing(true);
    };

    // TODO: write this as notes in docs for dry run:
    // When dry run is initiated from within editor, it doesn't open up dry run
    // config before running to save time and focus more on the tests. Users have
    // to setup dry run config beforehand if their tests use any of following
    // variables:
    // build, browser, platform (from ZwlDryRunProperties.java)
    // browser and platform is usually determined when a build is run using
    // selected browser/platform but we don't know them while dry running that's why
    // we need users to select them in config. build variables needs to be assigned
    // so that user's desired build time value is taken.
    // Dry run makes it easier to also skip these by giving a default value to
    // these as well, browser = chrome, version = 70, platform = Windows are defaults
    // for browser and platform. For build variables, the first found is used.
    const handleDryRun = (event) => {
      // when panel is closed, and any action buttons are clicked, we want it to
      // open so that when the output arrives, we don't have to explicitly open
      // it and decide whether to open and not (for example when parsing together
      // with saving, we don't open.). We want to open only when explicitly some
      // action is triggered.
      // So if user clicks on an opened panel, don't close it.
      if (isOutputPanelOpened()) {
        event.stopPropagation();
      }
      if (stopRunWhenNoCode()) {
        return;
      }
      afterChangeDebounceRef.current.flush();
      const onSuccess = (response) => {
        const lastRunAction = getLastRunAction(
          version.id,
          RunType.DRY_RUN,
          response.output
        );
        dispatchGlobal(lastRunAction);
      };

      const onError = (response) => {
        const {error} = response;
        const lastRunAction = getLastRunAction(
          version.id,
          RunType.DRY_RUN,
          response.output,
          new LastRunError(error.msg, error.from, error.to)
        );
        dispatchGlobal(lastRunAction);
      };
      // TODO: Replace following timeout and sample values with real api call
      // and results. This api will dry run using versionId and dry run config,
      // before sending request, set this versionId in dry run config so it
      // always point to latest run version(s).
      setTimeout(() => {
        // this is done to support tests until api is integrated
        const response = editorRef.current.getValue().includes('FAIL_TEST')
          ? {
              status: ApiStatuses.FAILURE,
              error: {
                msg:
                  "function: findElement with parameters count: 4 isn't defined. at line 2:1 to 7:2",
                from: {line: 2, ch: 1},
                to: {line: 7, ch: 2}, // api should send the to column that is after the char
              },
              output: `Starting dry run...
Executing function findElement with arguments .some-selector, Push Me, TEXT, true at line 2:1 to line 7:2`,
            }
          : {
              status: ApiStatuses.SUCCESS,
              output: `Starting dry run...
Everything run just fine`,
            };
        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess(response);
        } else {
          onError(response);
        }
        toggleRunOngoing(false);
      }, 3000);
      dispatchControlled(
        batchActions([
          {type: actionTypes.CLEAR_OUTPUT, payload: {versionId: version.id}},
          {
            type: actionTypes.SET_OUTPUT_NORMAL,
            payload: {
              versionId: version.id,
              outputNormal:
                'Dry running, output will appear post completion...',
            },
          },
        ])
      );
      toggleRunOngoing(true);
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
          <Box
            display="flex"
            flexDirection="column"
            flex={1}
            data-testid="codeEditor">
            {/* https://github.com/codemirror/CodeMirror/issues/4895#issuecomment-320521498 */}
            <Box position="relative" flex={1}>
              <textarea ref={textAreaRef} />
            </Box>
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
                {/* Note that this is just a shortcut way to trigger a build
                run for this particular version. Continuous output appears
                in bottom panel, and once done then only the final output
                appears here. */}
                <Tooltip title="Run Build For This Version">
                  <IconButton
                    aria-label="Run Build For This Version"
                    className={classes.iconButton}
                    disabled={runOngoing}
                    onClick={handleBuild}
                    data-testid="outputPanelRunBuild">
                    <PlayArrowIcon
                      fontSize="small"
                      classes={{fontSizeSmall: classes.fontSizeSmall}}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Parse This Version">
                  <IconButton
                    aria-label="Parse This Version"
                    className={classes.iconButton}
                    disabled={runOngoing}
                    onClick={handleParse}
                    data-testid="outputPanelParse">
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
                    disabled={runOngoing}
                    onClick={handleDryRun}
                    data-testid="outputPanelDryRun">
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
                  data-testid="editorStatusMessage"
                  ref={editorStatusMessageRef}>
                  {versionsStateControlled[version.id]
                    ? versionsStateControlled[version.id].statusMessage.message
                    : null}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                classes={{root: classes.accordionDetails}}
                data-testid="editorOutput">
                <pre className={classes.output}>
                  {versionsStateControlled[version.id]
                    ? versionsStateControlled[version.id].outputNormal
                    : null}
                </pre>
                <pre className={clsx(classes.output, classes.outputError)}>
                  {versionsStateControlled[version.id]
                    ? versionsStateControlled[version.id].outputError
                    : null}
                </pre>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>
        <Portal container={lineColContainerRef.current}>
          <Typography variant="caption">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <Link
              color="inherit"
              onClick={() => CodeMirror.commands.jumpToLine(editorRef.current)}
              className={classes.link}
              ref={lineColTextRef}
              data-testid="lineColContainer">
              {getLineColText(1, 1)}
            </Link>
          </Typography>
          <Typography variant="caption" style={{marginLeft: '16px'}}>
            ZWL
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
    lastRun: PropTypes.instanceOf(LastRun),
    showAsErrorInExplorer: PropTypes.bool,
  }).isRequired,
  testName: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  lineColContainerRef: PropTypes.exact({
    current: PropTypes.any,
  }).isRequired,
};

export default TabPanel;

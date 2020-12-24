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
import {
  BATCH_ACTIONS,
  EDR_VERSION_CODE_UPDATED,
  CLEAR_VERSION_LAST_RUN,
  VERSION_CODE_SAVE_IN_PROGRESS,
  VERSION_CODE_SAVE_COMPLETED,
} from '../actionTypes';
import {BUILD_NEW_RUN} from '../../actions/actionTypes';
import {
  IdeDispatchContext,
  IdeVarsContext,
  IdeBuildRunOngoingContext,
  IdeDryRunOngoingContext,
  IdeParseRunOngoingContext,
  IdeVersionIdsCodeSaveInProgressContext,
} from '../Contexts';
import Tooltip from '../../TooltipCustom';
import {LastRun, LastRunError} from '../Explorer/model';
import {ApiStatuses, RunType, TestStatus} from '../../Constants';
import {ZwlLexer, PARSE_SUCCESS_MSG} from '../Constants';

import batchActions, {getLastRunAction} from '../actionCreators';
import {fillLastParseStatusAndGetFailed} from '../common';
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
    color: theme.palette.error.light,
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
    color: theme.palette.error.light,
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

const CODE_SAVE_WAIT_TIME = 3000;
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

const OutputType = {
  NORMAL: 'NORMAL',
  ERROR: 'ERROR',
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
    const buildRunOngoing = useContext(IdeBuildRunOngoingContext);
    const dryRunOngoing = useContext(IdeDryRunOngoingContext);
    const parseRunOngoing = useContext(IdeParseRunOngoingContext);
    const versionIdsCodeSaveProgress = useContext(
      IdeVersionIdsCodeSaveInProgressContext
    );
    const hasRunInvokedPostSaveProgressRef = useRef(false);
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
    // TODO: we're missing a stop button to stop parse/dry-run (we don't need a
    // stop for build cause it use bottom output panel for status where there will
    // be a button) but not doing that currently. For now let's assume user's won't
    // really need to stop for single version, and try to put later.
    // this is a global state for component, setting it reflects in all tabs
    const [runOngoing, setRunOngoing] = useState({
      runType: null,
      versionId: null,
      isGlobalRun: false,
    });
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
    const editorVersionIdRef = useRef();
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

    /**
     * write to output console after clearing it.
     * @param {Message to write} msg
     * @param {Type of output, defaults to OutputType.NORMAL} outputType
     */
    const writeOutput = useCallback(
      (msg, outputType = OutputType.NORMAL) => {
        const payloadWrite = {versionId: version.id};
        if (outputType === OutputType.NORMAL) {
          payloadWrite.outputNormal = msg;
        } else {
          payloadWrite.outputError = msg;
        }
        dispatchControlled(
          batchActions([
            {
              type: actionTypes.CLEAR_OUTPUT,
              payload: {versionId: version.id},
            },
            {
              type:
                outputType === OutputType.NORMAL
                  ? actionTypes.SET_OUTPUT_NORMAL
                  : actionTypes.SET_OUTPUT_ERROR,
              payload: payloadWrite,
            },
          ])
        );
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
        // code save in progress starts
        const actionInProgress = {
          type: VERSION_CODE_SAVE_IN_PROGRESS,
          payload: {versionId: version.id},
        };
        const actionCompleted = {
          type: VERSION_CODE_SAVE_COMPLETED,
          payload: {versionId: version.id},
        };
        dispatchGlobal(actionInProgress);
        const value = editor.getValue();
        const codeUpdateAction = {
          type: EDR_VERSION_CODE_UPDATED,
          payload: {versionId: version.id, versionCode: value},
        };

        const onSuccess = (response) => {
          const actions = [codeUpdateAction, actionCompleted];
          const parseRes = response.parseResult;
          if (parseRes && parseRes.status === ApiStatuses.FAILURE) {
            // Parsing failed means api couldn't parse due to some internal error
            // when parsing failed, clear last run status if there is any parse
            // status already so that runs don't take into account the invalid
            // last run information and trigger a new parse.
            actions.push({
              type: CLEAR_VERSION_LAST_RUN,
              payload: {versionId: version.id, runType: RunType.PARSE_RUN},
            });
            dispatchGlobal(batchActions(actions));
            writeStatusMessage(
              `Changes saved but there was a problem in parsing, ${parseRes.error.reason}`,
              StatusMessageType.ERROR
            );
            return;
          }
          const parseError =
            parseRes && parseRes.data ? parseRes.data.error : null;
          if (parseRes) {
            const lastRunAction = getLastRunAction(
              version.id,
              RunType.PARSE_RUN,
              parseError ? null : PARSE_SUCCESS_MSG,
              parseError
                ? new LastRunError(
                    parseError.msg,
                    parseError.from,
                    parseError.to
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
          if (!parseRes || !parseError) {
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
          const actions = [codeUpdateAction, actionCompleted];
          // when version couldn't save, no parsing is done.
          // save the code in state even if it's not saved to db.
          dispatchGlobal(batchActions(actions));
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
                status: ApiStatuses.SUCCESS, // api status for save, success means saved.
                parseResult: {
                  status: ApiStatuses.SUCCESS, // api status for parse, success means parsed.
                  // failure means problem in parsing.
                  data: {
                    // when parse errors, data is there, otherwise no data
                    error: {
                      msg: "no viable alternative at input 'a+' line 2:2",
                      from: {line: 2, ch: 1},
                      to: {line: 2, ch: 2}, // !!Note: api should always send the 'to' column that is after the 'to' char
                    },
                  },
                },
              }
            : {
                status: ApiStatuses.SUCCESS,
                parseResult:
                  value && value.replace(/[\s\n\r\t]*/, '').length
                    ? {
                        status: ApiStatuses.SUCCESS, // no data means parse succeeded.
                      }
                    : null, // TODO: !!if there was no real code, api shouldn't do any parsing
                // Don't assume we don't run change function when no code, because user may
                // delete all code form version and want to save.
              };
          /* Save failure, no parsing is done
          const response = {
            status: ApiStatuses.FAILURE,
            error: {
              reason: 'Network error',
            },
          }; */
          /* Parse failure
          const response = {
            status: ApiStatuses.SUCCESS,
            parseResult: {
              status: ApiStatuses.FAILURE,
              error: {
                reason: 'Network error',
              },
            },
          }; */
          // console.log('going to save code', changeObj);
          if (response.status === ApiStatuses.SUCCESS) {
            onSuccess(response);
          } else if (response.status === ApiStatuses.FAILURE) {
            onError(response);
          }
        }, 2000);
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
      if (editorVersionIdRef.current === version.id) {
        return;
      }
      editor.setValue(version.code);
      // set versionId
      editorVersionIdRef.current = version.id;
      // console.log('editor value is set');
    }, [version.code, version.id]);

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
    bottom panel separately for all type of runs.
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
        // markText requires 0 index based line:ch and api returns the same.
        const from = error.fromPos;
        const to = error.toPos;
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

    // uses state rather than state by version because at a time only
    // one version could be in running state. So once a run request initiated
    // from any version, editor becomes readonly and run controls disabled for
    // all versions in editor, since the run feature with editor is meant to
    // run one version only. If user wants more than one version running, they
    // can use top icons.
    const toggleRunOngoing = useCallback(
      (running, runType) => {
        setRunOngoing((r) =>
          !running ? null : {...r, runType, versionId: version.id}
        );
        if (!running) {
          // reset run invoke state on every new run
          hasRunInvokedPostSaveProgressRef.current = false;
        }
        editorRef.current.setOption('readOnly', running);
      },
      [version.id]
    );

    // make sure this runs only when global run changes, any external dependency
    // shouldn't change on any other factor.
    useEffect(() => {
      const globalRunOngoing =
        buildRunOngoing || dryRunOngoing || parseRunOngoing;
      setRunOngoing((r) =>
        !globalRunOngoing ? null : {...r, isGlobalRun: true}
      );
      if (globalRunOngoing) {
        afterChangeDebounceRef.current.flush();
      }
    }, [buildRunOngoing, dryRunOngoing, parseRunOngoing]);

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

    const stopRunWhenNoCode = () => {
      const error = 'Want to write some code before trying to run it?';
      const code = editorRef.current.getValue();
      if (!(code && code.replace(/[\s\n\r\t]*/, '').length)) {
        writeOutput(error, OutputType.ERROR);
        writeStatusMessage('');
        return true;
      }
      return false;
    };

    const triggerBuildRunOnSave = useCallback(() => {
      writeOutput(''); // clear output in case a save message was appearing
      toggleRunOngoing(false); // make run ongoing false, this is done so that
      // if build run skips, we won't have running state true here because skipping
      // doesn't change global run ongoing. By making this true, we can be sure
      // all situations are safe. If build doesn't run due to error, we have
      // no running state, if build runs and goes on to start, the global state
      // change will toggle to running state true, and if build run skips, we
      // have false running state here. So this works for all cases. We're in
      // fact releasing running state as the control is transferred to global
      // build run.
      // validate whether there is a parse error in this version, if so build run
      // won't do anything.
      if (version.lastParseRun && version.lastParseRun.error) {
        return;
      }
      // While build is running, continuous output appears
      // in bottom panel, it makes sense to not put that here because when live
      // preview panel is expanded fully, this panel will get hidden behind it.
      // Once build is started, api is polled to fetch the output and once one
      // version completes, it gets updated globally in 'files' i.e version.lastRun
      // is updated. This will trigger a re render of this current component only if
      // the currently opened version is the one that was updated after completion,
      // on re render, effect runs which will set the final output here in the
      // panel and point to the error if any.
      dispatchGlobal({
        type: BUILD_NEW_RUN,
        payload: {versionIds: [version.id]},
      });
    }, [
      dispatchGlobal,
      version.id,
      version.lastParseRun,
      writeOutput,
      toggleRunOngoing,
    ]);

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
      toggleRunOngoing(true, RunType.BUILD_RUN);
    };

    // TODO: delete it once api is there
    const getParseResponseData = useCallback(
      (isError) => {
        return isError
          ? [
              {
                versionId: version.id,
                error: {
                  msg: "token recognition error at: '@' line 3:12",
                  from: {line: 3, ch: 12},
                  // !!Note: api should always send the 'to' column that is after the 'to' char
                  to: {line: 3, ch: 13},
                },
              },
            ]
          : null;
      },
      [version.id]
    );

    const triggerParseOnSave = useCallback(() => {
      if (version.lastParseRun) {
        // when last parse status is error, lastRun is error too as we don't allow
        // a failed parsing version to do any other run. In this case no action needed
        // cause error is already shown.
        // Otherwise if last run is parse, we're already showing the result, no action.
        if (
          version.lastParseRun.error ||
          version.lastRun.runType === RunType.PARSE_RUN
        ) {
          toggleRunOngoing(false);
          return;
        }
        // when last run isn't parse, make it successful parse as we've parse result
        // available.
        const lastRunAction = getLastRunAction(
          version.id,
          RunType.PARSE_RUN,
          version.lastParseRun.output
        );
        dispatchGlobal(lastRunAction);
        toggleRunOngoing(false);
        return;
      }
      // send api request as either code has changed or no last parse available.
      fillLastParseStatusAndGetFailed(
        [version.id],
        dispatchGlobal,
        getParseResponseData(editorRef.current.getValue().includes('FAIL_TEST'))
      )
        .then() // no action when parsed, effect will read global state change.
        .catch((error) => {
          writeOutput(`Can't parse, ${error.message}`, OutputType.ERROR);
        })
        .finally(() => toggleRunOngoing(false));
      writeOutput('Parsing...');
    }, [
      dispatchGlobal,
      getParseResponseData,
      toggleRunOngoing,
      version.id,
      version.lastParseRun,
      version.lastRun,
      writeOutput,
    ]);

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
      toggleRunOngoing(true, RunType.PARSE_RUN);
    };

    const dryRun = useCallback(() => {
      const onSuccess = (response) => {
        const {data} = response;
        let lastRunError = null;
        if (data.status === TestStatus.ERROR) {
          const {error} = data;
          lastRunError = new LastRunError(error.msg, error.from, error.to);
        }
        dispatchGlobal(
          getLastRunAction(
            version.id,
            RunType.DRY_RUN,
            data.output,
            lastRunError
          )
        );
      };
      const onError = (response) => {
        writeOutput(
          `Can't complete dry run, ${response.error.reason}.`,
          OutputType.ERROR
        );
      };
      setTimeout(() => {
        // send version.id and dry config to api and expect results in following format
        const response = editorRef.current.getValue().includes('FAIL_DRY')
          ? {
              status: ApiStatuses.SUCCESS,
              data: {
                status: TestStatus.ERROR,
                timeTaken: 1000,
                output: `Starting dry run...
Executing function findElement with arguments .some-selector, Push Me, TEXT, true at line 2:1 to line 7:2`,
                error: {
                  msg:
                    "function: findElement with parameters count: 4 isn't defined. at line 2:1 to 7:2",
                  from: {line: 2, ch: 1},
                  to: {line: 7, ch: 2}, // api should send the to column that is after the char
                },
              },
            }
          : {
              status: ApiStatuses.SUCCESS,
              data: {
                status: TestStatus.SUCCESS,
                timeTaken: 1000, // timeTaken will be in millis
                output: `Starting dry run...
Everything run just fine`,
              },
            };
        /*
        const response = {
          status: ApiStatuses.ERROR,
          error: {
            reason: 'Network error',
          },
        };
        */
        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess(response);
        } else if (response.status === ApiStatuses.ERROR) {
          onError(response);
        }
        toggleRunOngoing(false);
      }, 3000);
      writeOutput('Dry running, output will appear post completion...');
    }, [dispatchGlobal, toggleRunOngoing, version.id, writeOutput]);

    const triggerDryRunOnSave = useCallback(() => {
      // check parse status
      if (version.lastParseRun) {
        if (version.lastParseRun.error) {
          toggleRunOngoing(false);
          return;
        }
        dryRun();
        return;
      }
      // send api request as either code has changed or no last parse available.
      fillLastParseStatusAndGetFailed(
        [version.id],
        dispatchGlobal,
        getParseResponseData(editorRef.current.getValue().includes('FAIL_TEST'))
      )
        .then((errorVersions) => {
          if (!errorVersions.length) {
            dryRun();
            return;
          }
          toggleRunOngoing(false);
        })
        .catch((error) => {
          writeOutput(`Couldn't parse, ${error.message}`, OutputType.ERROR);
          toggleRunOngoing(false); // don't use finally as when dryRun start, this shouldn't reset.
        });
      writeOutput('Parsing...');
    }, [
      dispatchGlobal,
      dryRun,
      getParseResponseData,
      toggleRunOngoing,
      version.id,
      version.lastParseRun,
      writeOutput,
    ]);

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
      toggleRunOngoing(true, RunType.DRY_RUN);
    };

    // check if there is any pending code update in progress, if so wait for it,
    // and once done invoke the run that triggered this effect. This is done so
    // that any ongoing change in last parse status is first reflect before we
    // decide whether to proceed with the run. For example if current parse state
    // is error, user fixed code and initiate run immediately, we'd first let the
    // code to commit so that it's parse state changes to success before checking
    // its parse state. This is done in global runs as well.
    useEffect(() => {
      if (
        !runOngoing ||
        runOngoing.isGlobalRun ||
        runOngoing.versionId !== version.id
      ) {
        return;
      }
      if (versionIdsCodeSaveProgress.has(runOngoing.versionId)) {
        writeOutput('Saving changes...');
        return;
      }
      if (hasRunInvokedPostSaveProgressRef.current) {
        return;
      }
      hasRunInvokedPostSaveProgressRef.current = true;
      const {runType} = runOngoing;
      switch (runType) {
        case RunType.BUILD_RUN:
          triggerBuildRunOnSave();
          break;
        case RunType.DRY_RUN:
          triggerDryRunOnSave();
          break;
        case RunType.PARSE_RUN:
          triggerParseOnSave();
          break;
        default:
          throw new TypeError(`Unrecognized runType ${runType}`);
      }
    }, [
      triggerBuildRunOnSave,
      triggerDryRunOnSave,
      triggerParseOnSave,
      runOngoing,
      versionIdsCodeSaveProgress,
      writeOutput,
      version.id,
    ]);

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
                  <span>
                    <IconButton
                      aria-label="Run Build For This Version"
                      className={classes.iconButton}
                      disabled={Boolean(runOngoing)}
                      onClick={handleBuild}
                      data-testid="outputPanelRunBuild">
                      <PlayArrowIcon
                        fontSize="small"
                        classes={{fontSizeSmall: classes.fontSizeSmall}}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Parse This Version">
                  <span>
                    <IconButton
                      aria-label="Parse This Version"
                      className={classes.iconButton}
                      disabled={Boolean(runOngoing)}
                      onClick={handleParse}
                      data-testid="outputPanelParse">
                      <BuildIcon
                        fontSize="small"
                        classes={{fontSizeSmall: classes.fontSizeXSmall}}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Dry Run This Version">
                  <span>
                    <IconButton
                      aria-label="Dry Run This Version"
                      className={classes.iconButton}
                      disabled={Boolean(runOngoing)}
                      onClick={handleDryRun}
                      data-testid="outputPanelDryRun">
                      <CheckCircleIcon
                        fontSize="small"
                        classes={{fontSizeSmall: classes.fontSizeXSmall}}
                      />
                    </IconButton>
                  </span>
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
    lastParseRun: PropTypes.instanceOf(LastRun),
    showAsErrorInExplorer: PropTypes.bool,
  }).isRequired,
  testName: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
  lineColContainerRef: PropTypes.exact({
    current: PropTypes.any,
  }).isRequired,
};

export default TabPanel;

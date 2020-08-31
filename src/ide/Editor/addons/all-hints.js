import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/anyword-hint';
import wdFunctions from '../../../config/all-wd-func';
import langFunctions from '../../../config/all-lang-func';
import * as Constants from '../../../config/all-zwl-constants';

const FUNC_NAME = /\w+(?=\()/;
// selects just function name from a function with syntax foo(?param...)
const RANGE = 500;

// TODO: somehow this runs twice on each keyup, find out later.
// Note: if we ever need Ctrl+Space to open hints, convert this function to a
// helper using Codemirror.registerHelper.
const allHints = (editor, options) => {
  const {maps} = Constants;
  const cur = editor.getCursor();
  const tok = editor.getTokenAt(cur);
  if (tok.string === '.' && tok.start > 0) {
    const tokBeforeDot = editor.getTokenAt({...cur, ch: tok.start});
    if (
      tokBeforeDot.type !== 'variable' ||
      !Object.keys(maps).includes(tokBeforeDot.string)
    ) {
      return null;
    }
    let hints;
    switch (tokBeforeDot.string) {
      case maps.browser:
        hints = Constants.browser;
        break;
      case maps.browsers:
        hints = Constants.browsers;
        break;
      case maps.buildVars:
        hints = options.buildVars;
        break;
      case maps.by:
        hints = Constants.by;
        break;
      case maps.colors:
        hints = Constants.colors;
        break;
      case maps.exceptions:
        hints = Constants.exceptions;
        break;
      case maps.globals:
        hints = options.globals;
        break;
      case maps.keys:
        hints = Constants.keys;
        break;
      case maps.platforms:
        hints = Constants.platforms;
        break;
      case maps.timeouts:
        hints = Constants.timeouts;
        break;
      default:
        throw new Error(`Could not hint on ${tokBeforeDot.string}`);
    }
    return {
      list: hints,
      from: CodeMirror.Pos(cur.line, tok.start + 1),
      // + 1 cause we don't want to complete the dot but put the completion after
      // dot, if +1 is not given, completion replaced dot.
      to: CodeMirror.Pos(cur.line, tok.end + 1),
    };
  }

  if (tok.type !== 'variable') {
    return null;
  }
  const curVariable = tok.string;
  const list = [];
  const seen = {};

  // zwl functions are not overloaded, so we can safely condition on unique
  // names.
  const hintZwlFunctions = (functions) => {
    functions.forEach((fn) => {
      const name = fn.match(FUNC_NAME);
      if (
        name &&
        name[0].lastIndexOf(curVariable, 0) === 0 &&
        seen[name[0]] === undefined
      ) {
        seen[name[0]] = true;
        list.push(fn);
      }
    });
  };

  hintZwlFunctions(wdFunctions);
  hintZwlFunctions(langFunctions);

  const addElements = (elements) => {
    elements.forEach((el) => {
      if (el.lastIndexOf(curVariable, 0) === 0 && seen[el] === undefined) {
        seen[el] = true;
        list.push(el);
      }
    });
  };

  addElements(Constants.readOnlyVars);

  // find variables from above the current line
  let {line} = cur;
  const endLine =
    Math.min(
      Math.max(line + -1 * RANGE, editor.firstLine()),
      editor.lastLine()
    ) - 1;
  for (; line !== endLine; line -= 1) {
    const tokens = editor.getLineTokens(line);
    const variableTokens =
      tokens && tokens.filter((t) => t.type === 'variable');
    if (Array.isArray(variableTokens)) {
      for (let i = 0; i < variableTokens.length; i += 1) {
        const text = variableTokens[i].string;
        if (
          text.lastIndexOf(curVariable, 0) === 0 &&
          seen[text] === undefined
        ) {
          if (line !== cur.line || text !== curVariable) {
            seen[text] = true;
            list.push(text);
          }
        }
      }
    }
  }
  return {
    list,
    from: CodeMirror.Pos(cur.line, tok.start),
    to: CodeMirror.Pos(cur.line, tok.end),
  };
};

export default allHints;

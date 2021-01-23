import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/anyword-hint';
import wdFunctions from '../../../config/all-wd-func';
import langFunctions from '../../../config/all-lang-func';
import * as Constants from '../../../config/all-zwl-constants';

// TODO: write a unit test for this entire functionality.
// TODO: I changed this earlier so that only the code above is hinted and not below,
// but we will required code below in hint too, make this change.
const FUNC_NAME = /\w+(?=\()/;
// selects just function name from a function with syntax foo(?param...)
const RANGE = 500;

const matches = (textToMatch, matcher) => {
  return textToMatch.toLowerCase().includes(matcher.toLowerCase());
};

const getConstantHints = (constant, options, toFilterStartingValue = '') => {
  const filter = (values) => {
    if (toFilterStartingValue === '') {
      return values;
    }
    const preciseMatchList = values.filter(
      (v) => v.lastIndexOf(toFilterStartingValue, 0) === 0
    );
    const fuzzyMatchList = values.filter(
      (v) => !preciseMatchList.includes(v) && matches(v, toFilterStartingValue)
    );
    return preciseMatchList.concat(fuzzyMatchList);
  };
  const {maps} = Constants;
  let hints;
  switch (constant) {
    case maps.browser:
      hints = filter(Constants.browser);
      break;
    case maps.browsers:
      hints = filter(Constants.browsers);
      break;
    case maps.buildVars:
      hints = filter(options.buildVars);
      break;
    case maps.by:
      hints = filter(Constants.by);
      break;
    case maps.colors:
      hints = filter(Constants.colors);
      break;
    case maps.exceptions:
      hints = filter(Constants.exceptions);
      break;
    case maps.globals:
      hints = filter(options.globals);
      break;
    case maps.keys:
      hints = filter(Constants.keys);
      break;
    case maps.platforms:
      hints = filter(Constants.platforms);
      break;
    case maps.timeouts:
      hints = filter(Constants.timeouts);
      break;
    case maps.timeUnit:
      hints = filter(Constants.timeUnit);
      break;
    default:
      throw new Error(`Could not hint on ${constant}`);
  }
  return hints;
};

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
    return {
      list: getConstantHints(tokBeforeDot.string, options),
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

  // find out if user is typing after getting hints on constants means after dot operator
  // if so, filter constant hints by what they typed
  if (tok.start > 0) {
    const dotToken = editor.getTokenAt({...cur, ch: tok.start});
    if (dotToken.string === '.' && dotToken.start > 0) {
      const tokBeforeDot = editor.getTokenAt({...cur, ch: dotToken.start});
      if (
        tokBeforeDot.type === 'variable' &&
        Object.keys(maps).includes(tokBeforeDot.string)
      ) {
        return {
          list: getConstantHints(tokBeforeDot.string, options, tok.string),
          from: CodeMirror.Pos(cur.line, tok.start),
          to: CodeMirror.Pos(cur.line, tok.end),
        };
      }
    }
  }

  const preciseList = new Set();
  const fuzzyList = new Set();
  // zwl functions are not overloaded, so we can safely condition on unique
  // names.
  const hintZwlFunctions = (functions) => {
    functions.forEach((fn) => {
      const name = fn.match(FUNC_NAME);
      if (name && name[0].lastIndexOf(curVariable, 0) === 0) {
        preciseList.add(fn);
      }
    });
    functions.forEach((fn) => {
      const name = fn.match(FUNC_NAME);
      if (name && matches(name[0], curVariable) && !preciseList.has(fn)) {
        fuzzyList.add(fn);
      }
    });
  };

  hintZwlFunctions(wdFunctions);
  hintZwlFunctions(langFunctions);

  const addElements = (elements) => {
    elements.forEach((el) => {
      if (el.lastIndexOf(curVariable, 0) === 0) {
        preciseList.add(el);
      }
    });
    elements.forEach((el) => {
      if (matches(el, curVariable) && !preciseList.has(el)) {
        fuzzyList.add(el);
      }
    });
  };

  addElements(Constants.readOnlyVars);

  // TODO: there is bug here. value after period operator is taken as variable
  // and suggested. It should be excluded
  // no fuzzy matches for variables as they are present in the editor
  for (let dir = -1; dir <= 1; dir += 2) {
    let {line} = cur;
    const endLine =
      Math.min(
        Math.max(line + dir * RANGE, editor.firstLine()),
        editor.lastLine()
      ) + dir;
    for (; line !== endLine; line += dir) {
      const tokens = editor.getLineTokens(line);
      const variableTokens =
        tokens && tokens.filter((t) => t.type === 'variable');
      if (Array.isArray(variableTokens)) {
        for (let i = 0; i < variableTokens.length; i += 1) {
          const text = variableTokens[i].string;
          if (text.lastIndexOf(curVariable, 0) === 0) {
            if (line !== cur.line || text !== curVariable) {
              preciseList.add(text);
            }
          }
        }
      }
    }
  }
  return {
    list: [...preciseList, ...fuzzyList],
    from: CodeMirror.Pos(cur.line, tok.start),
    to: CodeMirror.Pos(cur.line, tok.end),
  };
};

export default allHints;

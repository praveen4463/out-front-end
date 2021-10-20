import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/anyword-hint';
import wdFunctions from '../../../config/all-wd-func';
import langFunctions from '../../../config/all-lang-func';
import * as Constants from '../../../config/all-zwl-constants';

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
    case maps.duration:
      hints = filter(Constants.duration);
      break;
    default:
      throw new Error(`Could not hint on ${constant}`);
  }
  return hints;
};

// files [[f, t, v], [f, t, v],...]
const suggestFiles = (files, filter = '') => {
  const prepareFilePath = (f) => {
    const s = `${f[0]}/${f[1]}/${f[2]}`.replace("'", "\\'");
    return `'${s}'`;
  };

  const filterNormalized = filter.trim().toLocaleLowerCase();
  if (filterNormalized === '') {
    return files.map(prepareFilePath);
  }
  const preciseList = [];
  const fuzzyList = [];
  files.forEach((f) => {
    const fn = f[0].toLocaleLowerCase();
    const tn = f[1].toLocaleLowerCase();
    if (fn.startsWith(filter) || tn.startsWith(filter)) {
      preciseList.push(f);
    } else if (fn.includes(filter) || tn.includes(filter)) {
      fuzzyList.push(f);
    }
  });

  return [...preciseList, ...fuzzyList].map(prepareFilePath);
};

// TODO: somehow this runs twice on each keyup, find out later.
// Note: if we ever need Ctrl+Space to open hints, convert this function to a
// helper using Codemirror.registerHelper.
const allHints = (editor, options) => {
  const {maps} = Constants;
  const cur = editor.getCursor();
  const tok = editor.getTokenAt(cur);
  const tokText = tok.string;
  const allCurTokens = editor.getLineTokens(cur.line);
  if (allCurTokens[0].string === 'callTest') {
    const files = options.filesForSuggestion;
    if (!files.length) {
      return null;
    }
    const isVarToken = tok.type === 'variable';
    if (tokText !== '(' && !isVarToken) {
      return null;
    }
    const filter = isVarToken ? tokText : '';
    return {
      list: suggestFiles(files, filter),
      from: CodeMirror.Pos(cur.line, tok.start + (tokText === '(' ? 1 : 0)),
      to: CodeMirror.Pos(cur.line, tok.end),
    };
  }

  if (tokText === '.' && tok.start > 0) {
    const tokBeforeDot = editor.getTokenAt({...cur, ch: tok.start});
    if (
      tokBeforeDot.type !== 'variable' ||
      !Object.keys(maps).includes(tokBeforeDot.string)
    ) {
      return null;
    }
    return {
      list: getConstantHints(tokBeforeDot.string, options),
      // + 1 cause we don't want to complete the dot but put the completion after
      // dot, if +1 is not given, completion replaced dot.
      from: CodeMirror.Pos(cur.line, tok.start + 1),
      to: CodeMirror.Pos(cur.line, tok.end),
    };
  }

  if (tok.type !== 'variable') {
    return null;
  }

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
          list: getConstantHints(tokBeforeDot.string, options, tokText),
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
      if (name) {
        const nameOnly = name[0];
        if (nameOnly.lastIndexOf(tokText, 0) === 0) {
          preciseList.add({text: nameOnly, displayText: fn});
        } else if (matches(nameOnly, tokText)) {
          fuzzyList.add({text: nameOnly, displayText: fn});
        }
      }
    });
  };

  hintZwlFunctions(wdFunctions);
  hintZwlFunctions(langFunctions);

  const addElements = (elements) => {
    elements.forEach((el) => {
      if (el.lastIndexOf(tokText, 0) === 0) {
        preciseList.add(el);
      } else if (matches(el, tokText)) {
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
          if (text.lastIndexOf(tokText, 0) === 0) {
            if (line !== cur.line || text !== tokText) {
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

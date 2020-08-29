import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/anyword-hint';
import wdFunctions from '../../../config/all-wd-func';
import langFunctions from '../../../config/all-lang-func';

const WORD = /\w+/;
const FUNC_NAME = /\w+(?=\()/;
// selects just function name from a function with syntax foo(?param...)
const RANGE = 500;

CodeMirror.registerHelper('hint', 'allhints', (editor) => {
  const list = [];
  const cur = editor.getCursor();
  const tok = editor.getTokenAt(cur);
  if (tok.type !== 'variable' && tok.type !== 'def') {
    return null;
  }
  const curLine = editor.getLine(cur.line);
  const end = cur.ch;
  let start = end;
  while (start && WORD.test(curLine.charAt(start - 1))) {
    start -= 1;
  }
  if (start === end) {
    return null;
  }
  const curWord = curLine.slice(start, end);
  const seen = {};

  // zwl functions are not overloaded, so we can safely condition on unique
  // names.
  const hintZwlFunctions = (functions) => {
    functions.forEach((fn) => {
      const name = fn.match(FUNC_NAME);
      if (
        name &&
        name[0].lastIndexOf(curWord, 0) === 0 &&
        seen[name[0]] === undefined
      ) {
        seen[name[0]] = true;
        list.push(fn);
      }
    });
  };

  hintZwlFunctions(wdFunctions);
  hintZwlFunctions(langFunctions);

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
          if (text.lastIndexOf(curWord, 0) === 0 && seen[text] === undefined) {
            if (line !== cur.line || text !== curWord) {
              seen[text] = true;
              list.push(text);
            }
          }
        }
      }
    }
  }
  return {
    list,
    from: CodeMirror.Pos(cur.line, start),
    to: CodeMirror.Pos(cur.line, end),
  };
});

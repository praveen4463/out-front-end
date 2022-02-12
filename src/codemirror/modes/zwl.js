import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import {ZwlLexer} from '../../ide/Constants';

// Note: !! The same file is used at docs and marketing apps, replicate any changes
// there too.
CodeMirror.defineSimpleMode('zwl', {
  // The start state contains the rules that are intially used
  start: [
    // The regex matches the token, the token property contains the type
    {
      regex: /"(?:[^"\\\r\n]|\\[tnr"\\]|\\u[0-9a-fA-F]{4})*?"/,
      token: 'string',
    },
    {
      regex: /'(?:[^'\\\r\n]|\\[tnr'\\]|\\u[0-9a-fA-F]{4})*?'/,
      token: 'string',
    },
    {regex: /`/, token: 'string', next: 'rawString'},
    {regex: /\s+/, token: null},
    {
      regex: /(?:if|for|while|else|in|to|try|catch|finally)\b/,
      token: 'keyword',
    },
    {regex: /true|false/, token: 'atom'},
    {regex: /-?(?:(?:0|[1-9]\d*)(?:\.\d+)?)|\.\d+/, token: 'number'},
    {regex: /#.*/, token: 'comment'},
    // A next property will cause the mode to move to a different state
    {regex: /\/\*/, token: 'comment', next: 'comment'},
    {
      regex: /--|\+\+|\|\||&&|!=|>=|<=|==|\?\?|[-+/*=<>!%:]/,
      token: 'operator',
    },
    // indent and dedent properties guide autoindentation
    {regex: /[{[(]/, indent: true},
    {regex: /[}\])]/, dedent: true},
    {regex: /([a-zA-Z_]\w*)([(])/, token: ['def', null]},
    {regex: ZwlLexer.IDENTIFIER, token: 'variable'},
    // add any other token that is frequently used but not allowed in zwl
    {regex: /;/, token: 'error'},
  ],
  // multi line raw string state
  rawString: [
    {regex: /.*?`/, token: 'string', next: 'start'},
    {regex: /.*/, token: 'string'},
  ],
  // The multi-line comment state.
  comment: [
    {regex: /.*?\*\//, token: 'comment', next: 'start'},
    {regex: /.*/, token: 'comment'},
  ],
  // The meta property contains global information about the mode. It
  // can contain properties like lineComment, which are supported by
  // all modes, and also directives like dontIndentStates, which are
  // specific to simple modes.
  meta: {
    dontIndentStates: ['comment'],
    lineComment: '#',
  },
});

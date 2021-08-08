// !! Maintain the sort order while changing.
// !! All values must be a valid identifier, see Constants.ZwlLexer.IDENTIFIER
// !! Note that exceptions constant has been removed from here
//  as I didn't think they're required for users. They were primarily built for
//  internal testing.
import {Browsers, Platforms} from '../Constants';

export const by = [
  'altText',
  'ariaLabel',
  'className',
  'cssSelector',
  'id',
  'labelText',
  'linkText',
  'name',
  'partialLinkText',
  'placeholderText',
  'role',
  'tagName',
  'testId',
  'text',
  'title',
  'xPath',
];

export const colors = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'transparent',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
];

export const keys = [
  'add',
  'alt',
  'back',
  'cancel',
  'clear',
  'cmd',
  'ctrl',
  'decimal',
  'delete',
  'divide',
  'down',
  'end',
  'enter',
  'equals',
  'esc',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
  'f10',
  'f11',
  'f12',
  'help',
  'home',
  'insert',
  'left',
  'meta',
  'multiply',
  'null',
  'numpad0',
  'numpad1',
  'numpad2',
  'numpad3',
  'numpad4',
  'numpad5',
  'numpad6',
  'numpad7',
  'numpad8',
  'numpad9',
  'pagedown',
  'pageup',
  'pause',
  'return',
  'right',
  'semicolon',
  'separator',
  'shift',
  'space',
  'subtract',
  'tab',
  'up',
  'zenkakuhankaku',
];

export const timeouts = ['elemAccess', 'js', 'pageLoad'];

export const browser = ['name', 'version'];

export const browsers = Object.values(Browsers).map((o) => o.VALUE);

export const platforms = Object.values(Platforms).map((o) => o.VALUE);

export const timeUnit = ['microsecond', 'millisecond', 'second'];

export const duration = [
  'seconds',
  'minutes',
  'hours',
  'days',
  'weeks',
  'months',
  'years',
];

// variables those are maps
export const maps = {
  browser: 'browser',
  browsers: 'browsers',
  buildVars: 'buildVars',
  by: 'by',
  colors: 'colors',
  globals: 'globals',
  keys: 'keys',
  platforms: 'platforms',
  timeouts: 'timeouts',
  timeUnit: 'timeUnit',
  duration: 'duration',
};

export const readOnlyVars = [...Object.keys(maps), 'platform'];

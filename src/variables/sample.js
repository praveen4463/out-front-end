import {GlobalVars, BuildVars} from './model';

// no duplicate keys, maintain sort order in key
const globalVars = [
  new GlobalVars(3, 'SELECTOR_TAB_TEXT_NODE', '.tabText'),
  new GlobalVars(4, 'TEST_ID_TAB', "*[data-testid='tab']"),
  new GlobalVars(1, 'TEST_ID_TEST_TREE_ITEM', "*[data-testid='TEST-treeitem']"),
  new GlobalVars(
    2,
    'TEST_ID_VERSION_TREE_ITEM',
    "*[data-testid='VERSION-treeitem']"
  ),
  new GlobalVars(5, 'åjumen', 'unknown'), // shouldn't be suggested as non identifer
];

// no duplicate key/value pairs, maintain sort order in key
const buildVars = [
  new BuildVars(1, 'SITE_URL', 'https://dev.zylitics.io'),
  new BuildVars(2, 'SITE_URL', 'https://staging.zylitics.io'),
  new BuildVars(3, 'SITE_URL', 'https://prod.zylitics.io', true),
  new BuildVars(4, 'SITE_URL', 'https://ci.zylitics.io'),
  new BuildVars(5, 'SUPPORT_EMAIL', 'support@zylitics.io'),
  new BuildVars(
    6,
    'SUPPORT_EMAIL',
    `priority@zylitics.io priority@zylitics.io priority@zylitics.io priority@zylitics.io`,
    true
  ),
  new BuildVars(7, 'SUPPORT_EMAIL', 'emergency@zylitics.io'),
  new BuildVars(8, 'åjumen', 'unknown', true), // shouldn't be suggested as non identifer
];

export {globalVars, buildVars};

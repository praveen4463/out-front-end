import {Version, Test, File} from './model';
// Reflects the similar data structure we'd get from db.
// All data is in ascending order
/*
!! README:
- Before modification, make sure id's remain unique and ordering within groups
  are maintained.
*/
const versionsTestId1 = [
  new Version(
    1,
    'v1',
    1,
    `# when user doesn't give attention to previous offer, google tells to.
chromeHomePageOffer = findElements("div#gbw a.gb_Nd", true)
if size(chromeHomePageOffer) > 0 {
  click(chromeHomePageOffer[0])
  click("input[name='q']") # since we changed the focus, let's make search
}`,
    true
  ),
];
const versionsTestId2 = [
  new Version(
    2,
    'v1',
    2,
    `# 1. simple google search test
openUrl("https://google.com")
# sometime when IE opens, google tries to bully it by
chromeDownloadOffer = findElements("div#gbw a.gb_0", true)
if size(chromeDownloadOffer) > 0 {
  click(chromeDownloadOffer[0])
  click("input[name='q']") # since we changed the focus.
}`,
    false
  ),
  new Version(
    3,
    'v2',
    2,
    `# 1. simple google search test
openUrl("https://google.com")
# sometime when IE opens, google tries to bully it by
chromeDownloadOffer = findElements("div#gbw a.gb_0", true)
if size(chromeDownloadOffer) > 0 {
  click(chromeDownloadOffer[0])
}`,
    true
  ),
];
const versionsTestId3 = [
  new Version(
    4,
    'v1',
    3,
    `t = untilShown()
q = activeElement()
if browser.name == "chrome" {
  text = "hi buddy ♻, whats up ⚜"
} else {
  text = "hi buddy 😀 what's up 😆"
}
type(q, text)
assertTrue(getElementValue(q) == text)`,
    false
  ),
  new Version(
    5,
    'v2',
    3,
    `q = activeElement()
if browser.name == "chrome" {
  text = "hi buddy ♻, whats up ⚜"
} else {
  text = "hi buddy 😀 what's up 😆"
}
type(q, text)
assertTrue(getElementValue(q) == text)`,
    false
  ),
  new Version(
    6,
    'v3',
    3,
    `if browser.name == "chrome" {
  text = "hi buddy ♻, whats up ⚜"
} else {
  text = "hi buddy 😀 what's up 😆"
}
type(q, text)
assertTrue(getElementValue(q) == text)`,
    true
  ),
];
const versionsTestId11 = [
  new Version(
    11,
    'v1',
    7,
    `progress = findElements("*[role='progressbar']", true)
    # some comment
    # some comment
    # some comment
    # some comment
    # some comment`,
    true
  ),
];
const testsFileId1 = [
  new Test(1, 'debug button changes color on click', 1, versionsTestId1),
  new Test(2, 'start button begins running test', 1, versionsTestId2),
  new Test(3, 'stop halts the execution of test', 1, versionsTestId3),
  new Test(
    7,
    'until the tooltip is visible show progress',
    1,
    versionsTestId11
  ),
];

// Only files that user has explicitly asked to open will have a 'tests' field
// populated and 'loadToTree=true', other files will have 'loadToTree=false'
// and are here just to check a duplicate name when adding new file, but ALL
// the NON DELETED files should remain here.
const files = [
  new File(6, 'Anchor Validation Tests', null),
  new File(2, 'Build Run Tests', null),
  new File(4, 'IDE Debug Flow Tests', null),
  new File(3, 'IDE Output Tests', null),
  new File(1, 'IDE Tests', testsFileId1),
  new File(5, 'URL Validation Tests', null),
];

// These should mostly already exist in files array as we load all existing
// files initially for duplicate check.
const fileToLoad = [
  new File(6, 'Anchor Validation Tests', [
    new Test(6, 'anchor should change when i click on back button', 6, [
      new Version(
        10,
        'v2',
        6,
        `typeActive("apple.com", keys.enter)
      # this selector gives all results but findElement will return the first
      firstResult = findElement("div.r > a > h3")
      assertTrue(getElementText(firstResult) == "Apple")
      click(firstResult)
      untilTitleIs("Apple")`,
        true
      ),
      new Version(
        9,
        'v1',
        6,
        `typeActive("apple.com", keys.enter)
      # this selector gives all results but findElement will return the first
      firstResult = findElement("div.r > a > h3")
      assertTrue(getElementText(firstResult) == "Apple")
      # some comment`,
        false
      ),
    ]),
    new Test(5, 'check anchors at bottom pane', 6, [
      new Version(
        8,
        'v1',
        5,
        `sendKeysToPageF("r")
      assertTrue(trim(getElementText(".doc-click")) == "document clicked")
      # shift went up in last sendKeysToPage call, thus 'r' will print as is 
      assertTrue(trim(getElementText(".doc-keydown-key")) == "Shift R r")
      # key's code property isn't supported in IE, thus not asserting there.
      if browser.name != "IE" {
        assertTrue(trim(getElementText(".doc-keydown-code")) == "ShiftLeft")
      }`,
        true
      ),
    ]),
  ]),
  new File(5, 'URL Validation Tests', [
    new Test(4, 'url should change when i click on back button', 5, [
      new Version(
        7,
        'v1',
        4,
        `openUrl(staticSitePrefix + "wd_document_click_and_keydown_c.html")
      switchFrame("iframe[name='result']")
      sendKeysToPage(".doc-click", keys.shift, "r")
      assertTrue(trim(getElementText(".doc-click")) == "document clicked")
      assertTrue(trim(getElementText(".doc-keydown-key")) == "Shift R")`,
        true
      ),
    ]),
  ]),
];

export {files, fileToLoad};

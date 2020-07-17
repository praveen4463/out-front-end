import {Version, Test, File} from './model';

const versionsTestId1 = [
  new Version(
    1,
    'v1',
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
    `typeActive("apple.com", keys.enter)
    # this selector gives all results but findElement will return the first
    firstResult = findElement("div.r > a > h3")
    assertTrue(getElementText(firstResult) == "Apple")
    click(firstResult)
    untilTitleIs("Apple")`,
    true
  ),
];
const versionsTestId3 = [
  new Version(
    4,
    'v1',
    `openUrl(staticSitePrefix + "wd_document_click_and_keydown_c.html")
    switchFrame("iframe[name='result']")
    sendKeysToPage(".doc-click", keys.shift, "r")
    assertTrue(trim(getElementText(".doc-click")) == "document clicked")
    assertTrue(trim(getElementText(".doc-keydown-key")) == "Shift R")`,
    false
  ),
  new Version(
    5,
    'v2',
    `sendKeysToPageF("r")
    assertTrue(trim(getElementText(".doc-click")) == "document clicked")
    # shift went up in last sendKeysToPage call, thus 'r' will print as is 
    assertTrue(trim(getElementText(".doc-keydown-key")) == "Shift R r")
    # key's code property isn't supported in IE, thus not asserting there.
    if browser.name != "IE" {
      assertTrue(trim(getElementText(".doc-keydown-code")) == "ShiftLeft")
    }`,
    false
  ),
  new Version(
    6,
    'v3',
    `q = activeElement()
    if browser.name == "chrome" {
      text = "hi buddy ♻, whats up ⚜"
    } else {
      text = "hi buddy 😀 what's up 😆"
    }
    type(q, text)
    assertTrue(getElementValue(q) == text)`,
    true
  ),
];
const testsFileId1 = [
  new Test(1, 'debug button changes color on click', versionsTestId1),
  new Test(2, 'start button begins running test', versionsTestId2),
  new Test(3, 'stop halts the execution of test', versionsTestId3),
];

// Only files that user has explicitly asked to open will have a 'tests' field
// populated and 'loadToTree=true', other files will have 'loadToTree=false'
// and are here just for duplicate check.
const files = [
  new File(1, 'IDE Tests', testsFileId1, true),
  new File(2, 'Build Run Tests', undefined, true),
  new File(2, 'IDE Output Tests', undefined, false),
  new File(2, 'IDE Debug Flow Tests', undefined, false),
];

export default files;

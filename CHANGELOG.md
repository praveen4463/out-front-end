- Follow [format](https://raw.githubusercontent.com/facebook/create-react-app/master/CHANGELOG.md) and markdown

## 0.2.4 (2021-05-15)

bug fixes, minor additions and dependency updates.

#### :bug: Bug Fix

- Upgraded sentry to 6.3.6
- There was a bug in live preview when used from a running build outside of IDE. If shot process fails for some reason, the latest shot found was an ERROR. Currently we are checking for just EOS but now if an ERROR is first shot, an error will be shown rather than throwing exception later. This similar issue was with shot viewer and resolved.
- When nothing is written to log, show a message rather than throwing error. For example if user selects FATAL as log status. nothing may be written.
- Fixed a bug in completed builds, it wasn't showing correct build status.

#### :nail_care: Enhancement

- Extra large timeout of 10m is removed, we will wait for at most 5m before showing an error as nginx is configure with the same timeout limit.
- Added Email to in help menu.
- Configured home page so that when someone lands on root domain and not logged in, they are redirected to about site.
- Added separate firebase project for dev environment.

## 0.2.5 (2021-05-17)

bug fixes, minor additions.

#### :bug: Bug Fix

- In ChangeEmail, when user was already logged in and triggers email change, the change email confirmation message was being replaced by the message that ask to login before email change can take place. This was happening because when we sign user out, the requiredAuth hook runs too and shows it's message. This is fixed by cancelling requiredAuth hook redirection if we are signing user out post email change. requiredAuth hook is changed so that the redirectFn takes care of all redirection if given and if not, only then the hook redirects to login.
- There was a bug when redirecting a user to marketing site when they land of home page and not logged in. It was ok if user comes to home page not being logged in, but when user was signing out using the user-info menu, or changes password that triggers a sign out, they were also being redirected to marketing site which is not correct. Now, we will redirect them to marketing site only if they are previously unknown to zylitics i.e having no record in browser storage which will happen to only unregistered users. Once they start using the app, we will never redirect them to marketing site.

#### :nail_care: Enhancement

- added an about link in help menu
- completed builds now shows most recent 15 builds only so that they tab doesn't get overloaded that slows it down.

## 0.2.6 (2021-05-25)

minor additions.

#### :nail_care: Enhancement

- Updated title, meta tags, metadata file
- Enabled on-save from editor functionality in prettier, it then formatted some css, jss files
- added new zylitics logos, favicon
- added react helmet and titles to all pages

## 0.2.7 (2021-05-30)

bug fixes, minor additions.

#### :bug: Bug Fix

- Resolved a bug that would delete the token after dot operator when it's completed

#### :nail_care: Enhancement

- While suggesting functions, action functions will have a tag for this to indicate that its an actionFunction.
- We will not put entire function definition on a suggestion's selection because user has to one by one replace arguments with actual values using mouse or keys, which looks additional work.

## 0.2.8 (2021-06-01)

minor additions.

#### :nail_care: Enhancement

- Refactored some of imports that were not directly importing components
- added security headers in firebase

## 0.2.9 (2021-06-25)

Additions and bug fixes.

#### :nail_care: Enhancement

- Updated title and desc
- Added discourse sso
- Getting logo locally
- Updated text of help in `Unhandled Prompt Behavior` at Build Caps page.

#### :bug: Bug Fix

- Fixed all pages that using BlankCentered to be mobile friendly so that if anyone visits those pages on phone, they can interact.
- Fixed multi selection tab that was deleting text

## 0.2.10 (2021-07-02)

Additions and bug fixes.

#### :nail_care: Enhancement

- Added discord in help

#### :bug: Bug Fix

- Fixed a typo in dashboard page text

## 0.2.11 (2021-07-02)

Additions.

#### :nail_care: Enhancement

- Improved text in dashboard

## 0.2.12 (2021-07-13)

Additions.

#### :nail_care: Enhancement

- Removed key names form 'parse all', 'build' etc tooltips in IDE
- Added an info for build caps as people are finding it difficult to understand what is a build caps. Ideally there has to be an add new in the select but for now that is fine.

## 0.3.0 (2021-07-24)

Additions and bug fixes.

#### :nail_care: Enhancement

- Opening zylitics for everyone by introducing easy signup
- verify, signup and google sign in added.
- remove beta plan verification support in email verifications
- verify-email will now just verify emails
- finish-signup will support normal and team sign up only, no email verifications
- beta invitation links are redirected to signup
- password, email, forgot password will show appropriate warning if user is not email/pwd user

#### :bug: Bug Fix

- Fixed a bug in usage page so it shows plan reset appropriately

## 0.3.1 (2021-07-27)

Additions.

#### :nail_care: Enhancement

- Updating title and desc to new ones

## 0.3.2 (2021-07-30)

Additions.

#### :nail_care: Enhancement

- Removed community link from help for now
- Added analytics

## 0.3.3 (2021-08-08)

Additions.

#### :nail_care: Enhancement

- decreased all type of default timeouts
- added `assertEqual`, `assertNotEqual`, `dateAdd`, `randomFromRange`
- added more `by`. These are `altTest`, `labelText`, `placeholderText`
- Removed wd functions `activeElement`, `clearActive`, `typeUsingMap`

## 0.3.4 (2021-08-08)

Additions.

#### :nail_care: Enhancement

- Reading incoming plan to signup.
- When no incoming plan, show user plan page.
- Update argument names in date related functions.

## 0.3.5 (2021-10-15)

Additions.

#### :nail_care: Enhancement

- Removed load files, files are loaded into explorer directly.
- Added new function `callTest`
- Added suggestions for `callTest`

## 0.3.6 (2021-10-20)

Additions.

#### :nail_care: Enhancement

- Escape single quote in file suggestions for callTest
- No error underline in case of build run.

## 0.3.7 (2021-10-30)

Additions.

#### :nail_care: Enhancement

- Changed logos to outomated

## 0.3.8 (2021-10-30)

Additions.

#### :nail_care: Enhancement

- Changed every text to outomated

## 0.3.9 (2021-11-05)

Additions.

#### :nail_care: Enhancement

- Added qa task screen

## 0.3.10 (2021-11-07)

Additions.

#### :nail_care: Enhancement

- Updated plans

## 0.3.11 (2021-11-25)

Bug fixes

#### :bug: Bug Fix

- Fixed a bug in files in explorer where files with no tests weren't visible.

## 0.3.12 (2021-11-29)

Bug fixes

#### :bug: Bug Fix

- Checking whether tests are available before iterating them.

## 0.3.13 (2021-12-3)

Additions.

#### :nail_care: Enhancement

- Added partial team member addition

## 0.3.14 (2021-12-03)

Bug fixes

#### :bug: Bug Fix

- Fixed a problem where projectId was being passed on logout, leading to wrong
  projectId if user logins as a different user.

## 0.3.15 (2021-12-03)

Bug fixes

#### :bug: Bug Fix

- Signing out before redirecting to fix an auth bug.

## 0.3.16 (2021-12-03)

Bug fixes

#### :bug: Bug Fix

- Not sending any query string to prevent project being added from home page
  auth check.
- Removed discord link for now.

## 0.3.17 (2021-12-04)

Bug fixes

#### :bug: Bug Fix

- There was a problem when another user logs in to same browser and state has
  previous visit information. React query wasn't refetching projects list upon
  re-login leading to wrong projects displaying to another user. Invalidating all
  queries upon logout to prevent that.

## 0.3.18 (2021-12-10)

Bug fixes

#### :bug: Bug Fix

- Race situations with react-query resolved in project fetch for now. This fixes
console error and occasional post login error of 'user not found'.

## 0.3.19 (2021-12-14)

Additions.

#### :nail_care: Enhancement

- Added api key screen

## 0.3.20 (2021-12-20)

Additions.

#### :nail_care: Enhancement

- Added support for shots and logs preferences from build config
- Updates in various UI to enable/disabled/hide elements as per availability

## 0.3.21 (2022-01-14)

Additions.

#### :nail_care: Enhancement

- Added support for mobile emulation in build caps
- Added support for `breakpoints` constants for mobile devices

## 0.3.22 (2022-01-19)

Additions.

#### :nail_care: Enhancement

- Added completed builds simple view screen

Bug fixes

#### :bug: Bug Fix

- Fixed a bug where back button in completed builds wouldn't appear when
  the build is opened directly. Now the button will remain disabled but will
  always render keeping the design tidy.


## 0.3.23 (2022-01-20)

Additions.

#### :nail_care: Enhancement

- Changed simple build view accordian's summary opened color
- Added Error screenshot to simple build screen
- Added a feature in shotViewer so that video can be played automatically. This
  is used in simple build screen.

## 0.3.24 (2022-02-12)

minor additions

#### :nail_care: Enhancement

- Added `try-catch-finally` in zwl mode

## 0.3.25 (2022-02-16)

minor additions

#### :nail_care: Enhancement

- Added copy-to-clipboard in SimpleBuildDetails

## 0.3.26 (2022-02-16)

minor additions

#### :nail_care: Enhancement

- Added tooltip to copy-to-clipboard in SimpleBuildDetails

## 0.3.27 (2022-03-1)

minor additions

#### :nail_care: Enhancement

- Added build name to IDE initiated tests

## 0.3.28 (2022-03-06)

minor additions

#### :nail_care: Enhancement

- Added `dateIsAfter`, `dateIsBefore`, `withLastDayOfMonth`, `parseNum`.

## 0.3.29 (2022-03-07)

minor additions

#### :nail_care: Enhancement

- Google oauth clientId is now inline in the code rather than referring from
computer that deploys.

## 0.3.30 (2022-03-30)

minor additions

#### :nail_care: Enhancement

- Removed timezone (VM) field from completed builds page.

## 0.3.31 (2022-04-06)

minor additions

#### :nail_care: Enhancement

- Wrapped URL is simple view screen for extra long URLs breaking the design

## 0.3.32 (2022-05-02)

minor changes

#### :nail_care: Enhancement

- Removed pricing page for now until we've a set process for plan and payments

## 0.3.33 (2022-05-08)

Additions.

#### :nail_care: Enhancement

- Added project codebase download

## 0.3.34 (2022-06-08)

Additions.

#### :nail_care: Enhancement

- Excluded functions from build run
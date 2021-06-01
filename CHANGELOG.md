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

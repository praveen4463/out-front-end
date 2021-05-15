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
Outomated Main App - The user facing app for [Outomated](https://app.outomated.com/).
Demo: https://www.youtube.com/watch?v=ZOkpb-iYuGA

Notes: timezones.json keeps just timezones accepted by win server, when we have
mac, make arrangements to either show separate timezones based on platform.

Steps to deploy

1. If the additions/updates depends on external changes such as in kube cluster, openapi,
   front api, infra api.. make sure those updates are completed, pushed, tested before
   proceeding.
2. Deploy to staging and run desired e2e tests from outomated (once we've written pending tests)
3. Write CHANGELOG, bump up version in package.json
4. Push and create tag
5. npm run build followed by firebase deploy

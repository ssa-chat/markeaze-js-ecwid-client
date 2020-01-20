# Markeaze Client for Ecwid Stores

Common script to integrate Ecwid Store with [Markeaze marketing platform](https://markeaze.com).

When Ecwid store installs a Markeaze app it puts Markeaze Account App Key to Ecwid Application Storege. This script loads app config from the Storage, takes an App Key and inits [Markeaze Tracking JS Client](https://github.com/markeaze/markeaze-js-tracker) with this key.

This script also contains some common bindings to Ecwid JavaScript SDK to allow Markeaze to track on-site events properly.

## Integration with Ecwid

You have nothing to do with it, this script is automatically loaded by Ecwid when you install a Markeaze app. Script should be accessed by the following permanent links depending on the app environment:

Production environment:
```
https://cdn.jsdelivr.net/gh/markeaze/markeaze-js-ecwid-client@stable/dist/client.js
```

Dev environment (unstable!):
```
https://cdn.jsdelivr.net/gh/markeaze/markeaze-js-ecwid-client@latest/dist/client.js
```

### Builing client for different environments

**Staging / development:**

```
$ NODE_ENV=staging npm run build
```

**Production:**

```
$ NODE_ENV=production npm run build
```

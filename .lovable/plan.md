

## Diagnosis

The root cause of the `jq: error (at appflow.config.json:0): Cannot iterate over null` error is that **the current `appflow.config.json` schema is wrong**. The Appflow build system expects the file to contain an `apps` array (per [official docs](https://ionic.io/docs/appflow/cookbook/appflow-config)):

```json
{
  "apps": [
    {
      "appId": "YOUR_APP_ID",
      "root": "."
    }
  ]
}
```

The build script runs something like `jq '.apps[]'` on the file. Your current file has `{"ios":{"enabled":true,...}}` -- there is no `apps` key, so `jq` gets `null` and crashes.

**`ENABLE_SPM_SUPPORT` is not a valid key inside `appflow.config.json`.** It must be set as an **environment variable in the Appflow Dashboard** (under Build > Environments), not in the config file.

## Plan

### 1. Rewrite `appflow.config.json` with correct schema

Either delete the file entirely (if you have no monorepo/custom build needs), or write it with the correct format:

```json
{
  "apps": [
    {
      "appId": "YOUR_APPFLOW_APP_ID",
      "root": ".",
      "iosPath": "ios"
    }
  ]
}
```

You will need to provide your Appflow App ID (visible on the Appflow dashboard overview page). If you only have one app at the repo root and no custom build commands, you can also just **delete the file entirely** -- Appflow defaults work fine.

### 2. Set `ENABLE_SPM_SUPPORT` in Appflow Dashboard

Go to your app in Appflow Dashboard > **Build** > **Environments** > create or edit an environment > add:
- Key: `ENABLE_SPM_SUPPORT`
- Value: `true`

Then select that environment when triggering your iOS build.

### Summary

| Action | Details |
|--------|---------|
| `appflow.config.json` | Delete it or rewrite with `apps` array schema |
| `ENABLE_SPM_SUPPORT` | Set in Appflow Dashboard environment, not in the config file |
| No other file changes needed | SPM setup (Package.swift, pbxproj) is already correct |


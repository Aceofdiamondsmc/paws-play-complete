

## Problem
You're completely stuck locally: no git (requires Xcode CLI tools), no Homebrew (requires 10GB free), no `scripts/` directory in your local clone, and no disk space to install anything. You cannot generate or push the sound files from your Mac.

## Solution: Add a prebuild script so Appflow generates the sounds automatically

Instead of you running anything locally, I'll add a `prebuild` npm script to `package.json` that runs `node scripts/generate-sounds.js` before every build. When Appflow runs `npm run build`, it will:

1. Automatically execute `generate-sounds.js` first
2. Generate all 4 `.wav` files
3. Copy them into `ios/App/App/` and `android/app/src/main/res/raw/`
4. Then proceed with the normal Vite build

### Changes

**package.json** — Add a `prebuild` script:
```json
"scripts": {
  "dev": "vite",
  "prebuild": "node scripts/generate-sounds.js",
  "build": "vite build",
  ...
}
```

That's it. One line. npm automatically runs `prebuild` before `build`. No local setup needed — Appflow's build environment has Node.js and all the required directories will be created by the script.

### Why this fixes everything
- You don't need git, Homebrew, or disk space on your Mac
- You don't need to run anything locally
- Every Appflow build will have fresh sound files in the correct native directories
- The script uses only built-in Node.js modules (no dependencies)


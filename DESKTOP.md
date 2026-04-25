# Tracker Finance Desktop

This project is prepared as a Tauri desktop app for macOS and Windows.

## Local prerequisites

- Node.js with npm
- Rust toolchain with Cargo
- macOS builds require Xcode Command Line Tools
- Windows builds should be produced on Windows, or through the included GitHub Actions workflow

## Development

```bash
npm run desktop:dev
```

## Production builds

```bash
npm run desktop:build
```

macOS bundles:

```bash
npm run desktop:build:mac
```

Optional macOS DMG:

```bash
npm run desktop:build:mac:dmg
```

Windows bundles:

```bash
npm run desktop:build:windows
```

## GitHub Actions

The workflow at `.github/workflows/desktop-build.yml` builds desktop artifacts on:

- manual dispatch from GitHub Actions
- tags matching `desktop-v*`

Example release tag:

```bash
git tag desktop-v0.1.0
git push origin desktop-v0.1.0
```

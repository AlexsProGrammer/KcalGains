# IMPLEMENTATION.md - Part 6: PWA Hardening, Asset Bundling & Zero-Leak Compliance

## 1. Project Context & Architecture

### Goal
Transform the client-side nutrition and workout tracker into a hardened, standalone Progressive Web App (PWA) installable on iOS and Android. This part enforces strict zero-leak DSGVO compliance by locally bundling all static assets, sets up complete offline caching via Service Workers, configures mobile standalone metadata, provides an iOS home-screen installation guide, and sets up automated GitHub Actions workflows for static deployment to GitHub Pages and Android APK generation via Capacitor.

### Tech Stack & Dependencies
- **Runtime & Framework:** TypeScript (v5.5+), React 19, Vite (from Part 1)
- **PWA Tooling & Service Worker:** `vite-plugin-pwa` (v0.20+), `workbox-window`
- **Mobile Container (Optional APK compilation):** `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- **Asset Generation & Favicons:** `@vite-pwa/assets-generator`
- **Icons & Local Fonts:** `lucide-react`, `@fontsource-variable/inter` (from Part 1)
- **CI/CD:** GitHub Actions (GitHub Pages static deploy & Android Gradle build)

#### Installation Commands:
```bash
npm install vite-plugin-pwa workbox-window
npm install -D @vite-pwa/assets-generator
# Optional Capacitor initialization for native Android APK:
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Quirin Fitti" "com.quirin.fitti" --web-dir "dist"

```

### File Structure

```text
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml
│       └── build-android.yml
├── capacitor.config.ts
├── pwa-assets.config.ts
├── vite.config.ts
├── index.html
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── maskable-icon-512x512.png
└── src/
    ├── services/
    │   └── pwaService.ts
    ├── hooks/
    │   └── usePWAInstall.ts
    ├── components/
    │   └── pwa/
    │       ├── InstallBanner.tsx
    │       ├── IosInstallInstructionsModal.tsx
    │       ├── ReloadPrompt.tsx
    │       └── OfflineIndicator.tsx
    └── utils/
        └── platformDetect.ts

```

### Attention Points & DSGVO

* **Strict Zero-Leak Compliance:** Audit and eliminate all external outbound network requests. No remote CDNs, tracking pixels, Google Tag Manager, or remote Google Fonts. Every single script, style, icon, and font must be delivered directly from the local bundle or Service Worker cache.
* **Cache-First Offline Strategy:** Configure Workbox runtime caching to cache all JavaScript, CSS, HTML, and local JSON seed data so the application loads instantly in airplane mode.
* **iOS WebKit PWA Sandbox Rules:** On iOS, standalone PWAs run in an isolated WebKit container. Configure `display: standalone`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, and proper viewport meta tags to prevent Safari navigation chrome from appearing.
* **Storage Isolation Protection:** Ensure `navigator.storage.persist()` (from Part 1) runs immediately upon launching the installed PWA instance.

---

## 2. Execution Phases

#### Phase 1: PWA Assets & Vite Plugin Configuration

* [x] **Step 1.1:** In `pwa-assets.config.ts`, configure asset generation presets for minimal crisp vector icons (`favicon.svg`, `apple-touch-icon.png`, `pwa-192x192.png`, `pwa-512x512.png`, and maskable variations with appropriate safe zones).
* [x] **Step 1.2:** In `vite.config.ts`, configure `VitePWA()`:
* `registerType: 'autoUpdate'`
* `includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png']`
* `manifest`:
* `name`: "Quirin Fitti - Nährstoff & Workout Tracker"
* `short_name`: "Quirin Fitti"
* `description`: "100% lokaler, DSGVO-konformer Nährstoff- und Trainings-Tracker"
* `theme_color`: "#09090b" (slate-950 dark background)
* `background_color`: "#09090b"
* `display`: "standalone"
* `orientation`: "portrait"
* `start_url`: "/"
* `scope`: "/"
* `icons`: define exact sizes matching generated assets.


* `workbox`:
* `globPatterns`: `['**/*.{js,css,html,ico,png,svg,woff2,json}']`
* `navigateFallback`: '/index.html'




* [x] **Step 1.3:** In `index.html`, add required Apple WebKit meta tags:
* `<meta name="apple-mobile-web-app-capable" content="yes">`
* `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
* `<meta name="apple-mobile-web-app-title" content="Quirin Fitti">`
* `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`


* [ ] **Verification:** Run `npm run pwa:assets`, then `npm run build` and inspect `dist/` to confirm `manifest.webmanifest`, `sw.js`, and all pre-cached asset chunks are generated. (Pending dependency/build verification.)

#### Phase 2: Platform Detection & Install Prompt Subsystem

* [ ] **Step 2.1:** In `src/utils/platformDetect.ts`, implement helpers:
* `isIOS(): boolean` (detects iPhone/iPad user agents).
* `isStandalone(): boolean` (checks `window.matchMedia('(display-mode: standalone)').matches` or `navigator.standalone`).
* `isAndroid(): boolean`.


* [ ] **Step 2.2:** In `src/services/pwaService.ts`, handle the `beforeinstallprompt` event on Chromium/Android and store the deferred prompt object.
* [ ] **Step 2.3:** In `src/hooks/usePWAInstall.ts`, create a React hook exposing:
* `isInstallable: boolean`
* `isInstalled: boolean`
* `platform: 'ios' | 'android' | 'desktop'`
* `promptInstall(): Promise<void>`


* [ ] **Verification:** Open the web app on desktop Chrome and verify `beforeinstallprompt` registers and triggers the custom installation workflow.

#### Phase 3: PWA UI Components & Update Handling

* [ ] **Step 3.1:** In `src/components/pwa/ReloadPrompt.tsx`, implement a non-intrusive toast notifying the user when a new Service Worker update is downloaded with a "Neu laden" (Reload) button.
* [ ] **Step 3.2:** In `src/components/pwa/IosInstallInstructionsModal.tsx`, build a step-by-step visual onboarding modal tailored for iOS users:
1. *"Tippe unten in Safari auf das Teilen-Symbol"* (Share icon).
2. *"Scrolle nach unten und wähle 'Zum Home-Bildschirm'"* (Add to Home Screen).
3. *"Bestätige oben rechts mit 'Hinzufügen'"* (Confirm).
4. Display notice explaining that this step guarantees permanent offline persistence against iOS 7-day cache cleanups.


* [ ] **Step 3.3:** In `src/components/pwa/InstallBanner.tsx`, render a dismissible bottom bar shown only to non-standalone users, routing to native `promptInstall()` on Android or opening `IosInstallInstructionsModal` on iOS.
* [ ] **Step 3.4:** In `src/components/pwa/OfflineIndicator.tsx`, listen to `window.addEventListener('online' | 'offline')` and display a discreet badge when the device is completely offline.
* [ ] **Step 3.5:** In `src/App.tsx`, mount `ReloadPrompt`, `InstallBanner`, and `OfflineIndicator`.
* [ ] **Verification:** In browser DevTools, toggle Device Emulation to "iPhone 14 Pro", verify that clicking "App installieren" opens the iOS instructions modal, and toggle Network to "Offline" to check the offline badge.

#### Phase 4: Zero-Leak DSGVO Network Audit

* [ ] **Step 4.1:** Verify that all icons in `src/components/` are imported from `lucide-react` (SVG inlined into JS bundles) and not from external CDNs.
* [ ] **Step 4.2:** In `src/main.tsx`, ensure `@fontsource-variable/inter` is loaded locally and check `dist/` font chunks after build.
* [ ] **Step 4.3:** Audit all fetch calls across `openFoodFactsService.ts` and ensure zero telemetry query params or headers are attached.
* [ ] **Step 4.4:** Set Content Security Policy (CSP) headers in `index.html`:
`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.openfoodfacts.org; connect-src 'self' https://world.openfoodfacts.org;">`
* [ ] **Verification:** Run a full Chrome DevTools Network trace from fresh page load through food search and workout logging. Verify that the ONLY outbound domains contacted are `self` (local assets) and explicitly user-triggered queries to `world.openfoodfacts.org`.

#### Phase 5: CI/CD Pipelines (GitHub Pages & Android Build)

* [ ] **Step 5.1:** In `.github/workflows/deploy-pages.yml`, create a GitHub Actions workflow:
* Trigger on push to `main` branch.
* Setup Node.js LTS, run `npm ci`, run `npx tsc --noEmit`, run `npm run build`.
* Deploy `dist/` directory to GitHub Pages via `actions/deploy-pages@v4`.


* [ ] **Step 5.2:** In `.github/workflows/build-android.yml`, create an optional release workflow:
* Trigger on release tags (e.g., `v*`).
* Run web build -> `npx cap sync android` -> Run Gradle assembleRelease / assembleDebug.
* Upload `app-release.apk` / `app-debug.apk` to GitHub Release assets for direct Android downloading without Play Store requirements.


* [ ] **Verification:** Push repository to GitHub, trigger actions pipeline, verify static deployment on `https://<username>.github.io/<repo-name>/`, and confirm Lighthouse scores 100/100 on PWA criteria.

---

## 3. Global Testing Strategy

### Critical Path Edge Cases

1. **Complete Offline Boot:** Open the installed PWA on a mobile device, enable Airplane Mode, force-close the app from recent apps, and reopen it. Confirm the entire UI, Dexie database, food search, meal balancer, and workout logger initialize seamlessly without network errors.
2. **PWA Standalone Window Isolation:** Verify on iOS and Android that launching the app from the home screen opens as a borderless full-screen application without URL bars, search bars, or browser navigation buttons.
3. **CSP Violation Resistance:** Attempt to inject an external script or image from an untrusted CDN in a test component. Verify the browser CSP strictly blocks the request and logs a security policy violation in the console.
4. **Service Worker Cache Invalidation:** Publish a minor UI version change, reload the app, and verify that `ReloadPrompt.tsx` prompts the user to activate the new version without breaking existing IndexedDB records.

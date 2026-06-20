# ComicCache - Agent Memory

## Mobile UI Refactor — Phase A (In Progress)

### Completed
- [x] Step 1: Global CSS foundation — `index.css` (custom properties, reset, safe-areas), `index.html` (theme-color, apple meta, viewport-fit=cover)
- [x] Step 2: `DashboardScreen.module.css` — with 44px touch targets, safe-area insets, responsive breakpoints, CSS hover/active states
- [x] Step 3: `DashboardScreen.jsx` refactored to import CSS module, removed all inline styles and onMouseEnter/onMouseLeave handlers
- [x] Step 4: Build verified — compiles clean

### Remaining
- [x] Step 5a: ComicScanner → ComicScanner.module.css
- [x] Step 5b: BoxDetailScreen → BoxDetailScreen.module.css
- [x] Step 5c: LoginScreen → LoginScreen.module.css, RegisterScreen → RegisterScreen.module.css, SetPasswordScreen → SetPasswordScreen.module.css
- [x] Step 5d: PicklistDrawer → PicklistDrawer.module.css, SeriesVolumeViewer → SeriesVolumeViewer.module.css, ComicDetailModal → ComicDetailModal.module.css
- [x] Step 5e: AdminScreen → AdminScreen.module.css
- [x] Step 5f: UserMenu → UserMenu.module.css, Toast → Toast.module.css

## Phase B — Navigation & Gestures (Complete)

### Completed
- [x] B1: Bottom tab bar — `BottomNav.jsx` + `BottomNav.module.css` with Home/Scan/Picklist/User tabs, active tab sync, container padding-bottom clearance
- [x] B2: Pull-to-refresh on Dashboard — touch-based with visual indicator (pull distance show "Pull to refresh" / "Release to refresh")
- [x] B3: Swipe-to-close on PicklistDrawer (swipe right >80px), SeriesVolumeViewer (swipe right >80px), ComicDetailModal (swipe down >100px)
- [x] Build verified — compiles clean

## Phase C — PWA & Polish (In Progress)

### Completed
- [x] C1: `manifest.json` — web app manifest via `vite-plugin-pwa`, standalone display, theme-color, SVG icons
- [x] C2: Service worker — auto-generated via `vite-plugin-pwa` using Workbox (NetworkFirst for `/api/*`, cache-first for assets), auto-update on refresh
- [x] C3: Loading skeletons — `Skeleton.jsx` component with CSS pulse animation, replaces all inline "Loading..." italic text states across App.jsx, BoxDetailScreen, PicklistDrawer, SeriesVolumeViewer, AdminScreen
- [x] Build verified — compiles clean, PWA generates `sw.js`, `workbox-*.js`, `manifest.webmanifest`, `registerSW.js`


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

## Phase C — PWA & Polish (Complete)

### Completed
- [x] C1: `manifest.json` — web app manifest via `vite-plugin-pwa`, standalone display, theme-color, SVG icons
- [x] C2: Service worker — auto-generated via `vite-plugin-pwa` using Workbox (NetworkFirst for `/api/*`, cache-first for assets), auto-update on refresh
- [x] C3: Loading skeletons — `Skeleton.jsx` component with CSS pulse animation, replaces all inline "Loading..." italic text states across App.jsx, BoxDetailScreen, PicklistDrawer, SeriesVolumeViewer, AdminScreen
- [x] Build verified — compiles clean, PWA generates `sw.js`, `workbox-*.js`, `manifest.webmanifest`, `registerSW.js`

## Phase D — Admin Inventory Tools (Complete)

### Completed
- [x] D1: Backend — `highest_value` query (top 10 by `estimated_value` DESC) + `estimated_value` field on `oldest_comics` output
- [x] D2: Frontend — New "Inventory" tab between "Roles" and "Stats" with 3 stat cards (Highest Value, Longest in Inventory, Most Requested Issues)
- [x] Build verified — both frontend and backend compile clean

### Files changed
| File | Change |
|---|---|
| `backend/main.py:729-770` | Added `highest_value` query + `estimated_value` to `oldest_comics` + new `highest_value` response section |
| `frontend/src/screens/AdminScreen.jsx` | Added "Inventory" tab button + `tab === 'inventory'` section with 3 reusable stat cards |

## Phase E — ComicRack DB Import (Planned)

### TODO
- [ ] Research ComicDB.xml schema (XML-based, stored at `%APPDATA%/cYo/ComicRack/ComicDb.xml`) and map fields to ComicCache models (Series→title, Number→issue_number, Publisher→publisher, etc.)
- [ ] Build import route: `POST /api/v1/import/comicrack` — accepts `ComicDB.xml` upload, parses `<Book>` entries, inserts into ComicCache DB
- [ ] Build frontend import UI in Admin screen (file upload + status feedback)
- [ ] Consider ComicInfo.xml (per-file metadata inside CBZ/CBR) as a secondary import source via the Anansi schema

## Phase F — ComicVine Caching + Series Viewer (Complete)

### Completed
- [x] F1: Search returns unified series list (local + ComicVine) sorted by exact-match → starts-with → contains, then issue count desc (backend `main.py` `/api/v1/comics/search`, `utils.py search_external_series`)
- [x] F2: ComicVine caching — new `ComicVineVolume` + `ComicVineIssue` tables in `models.py`. Volumes cached on search, issues cached per volume (7-day TTL). `fetch_comicvine_volume_issues` serves from DB cache when fresh.
- [x] F3: New endpoint `GET /api/v1/comicvine/series/{volume_id}/overview` returns SeriesVolumeViewer-shaped timeline (issues marked in_stock if owned locally, else missing, with ComicVine covers + issue names)
- [x] F4: Frontend — SeriesVolumeViewer accepts optional `volumeId` prop → external mode with album view, checkbox issue selection, box select/create, and bulk import. Dashboard "View X issues" on a ComicVine series opens the viewer (inline expand removed).
- [x] Build verified — frontend + backend compile clean, Docker rebuilt

### Files changed
| File | Change |
|---|---|
| `backend/models.py` | Added `ComicVineVolume` + `ComicVineIssue` tables |
| `backend/utils.py` | Caching in `search_external_series` + `fetch_comicvine_volume_issues` (session param, upsert, TTL) |
| `backend/main.py` | Session passthrough, new `/comicvine/series/{id}/overview` endpoint |
| `frontend/src/utilities/api.js` | Added `fetchComicVineOverview` |
| `frontend/src/components/SeriesVolumeViewer.jsx` + `.module.css` | External mode (`volumeId`) + import bar/checkbox styles |
| `frontend/src/screens/DashboardScreen.jsx` | "View X issues" opens viewer, removed inline expand UI/state |
| `.env` | Added `COMIC_VINE_API_KEY` + JWT vars (was missing in Docker → external search empty) |

### Notes
- Docker containers were running stale code + lacked `COMIC_VINE_API_KEY` (root `.env` didn't carry it). Fixed by adding the key to root `.env`; rebuild with `docker compose up -d --build backend frontend`.


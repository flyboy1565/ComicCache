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

## Phase G — Lost Sales (Demand Tracking) (Complete)

### Completed
- [x] G1: Backend — new `LostSale` table (`lostsale`: title, issue_number, publisher, lost_date, notes, customer_name, customer_phone, user_id, created_at) in `models.py` + raw migration in `database.py`. Entry date is auto-set server-side (`lost_date` = today); no dollar amount is stored
- [x] G2: New endpoints — `GET/POST /api/v1/sales/lost` (any logged-in user) + `DELETE /api/v1/sales/lost/{sale_id}` (owner only); `_lost_sale_totals` helper builds per-issue count map
- [x] G3: Both series overviews (`/series/overview` and `/comicvine/series/{id}/overview`) return per-issue `lost_sale_count` + series-level `total_lost_sales`
- [x] G4: Frontend — SeriesVolumeViewer: missing rows get a `💸 Log` button + amber `LOST SALE ×N` badge; modal to log a lost sale (notes, optional customer name/phone, auto entry date shown) with existing-log list + per-log remove; header shows `💸 Lost: N` when any exist
- [x] G5: Frontend bulk lost sales — external mode import bar gains a `💸 Log selected as lost sales` button; the lost-sale modal handles multiple selected missing issues (same notes/customer applied per issue, one LostSale row each), clears selection after saving
- [x] G6: Fixed `database.py` migrations — all used `SQLModel.text` which does NOT exist in SQLModel 0.0.39 (silently swallowed by try/except). Replaced with `sqlalchemy.text`; lostsale ADD COLUMN customer_name/customer_phone + DROP sale_amount now actually apply
- [x] Build verified — frontend + backend compile clean, Docker rebuilt, endpoints tested (create/list/delete with customer fields + auto date + overview counts)

### Files changed
| File | Change |
|---|---|
| `backend/models.py` | Added `LostSale` + `LostSaleCreate` (notes, customer_name, customer_phone; no sale_amount) |
| `backend/database.py` | `lostsale` table + column migrations; **all `SQLModel.text` → `sqlalchemy.text`** |
| `backend/main.py` | `_lost_sale_totals` helper, `/sales/lost` GET/POST/DELETE, lost_sale_count in both overviews |
| `frontend/src/utilities/api.js` | Added `fetchLostSales`, `addLostSale`, `removeLostSale` |
| `frontend/src/components/SeriesVolumeViewer.jsx` + `.module.css` | Lost-sale button/badge/modal (notes + customer name/phone) + styles |

### Notes
- Lost sales are demand tracking (missed sales), logged against a MISSING issue via title + issue_number + publisher match. No Comic row is created or mutated.
- The lost-sale entry date is always the creation date (server-set); users only supply notes + optional customer name/phone.

## Phase H — Admin Desktop Nav Tab (Complete)

### Completed
- [x] H1: Added an "Admin ⚙️" tab to the desktop `TopNav` (`TopNav.jsx`) — rendered only for `user.role === 'admin' || 'owner'`; opens `AdminScreen`. Non-admins get no tab. Build verified.

## Follow-up Backlog (Low Priority)

- [ ] Mirror the Admin tab in the mobile `BottomNav.jsx` so admin users get a tab-level admin home too (consistent with desktop).
- [ ] Revisit the large chunk warning (652 kB JS) once nav/feature work stabilizes — consider route-level lazy loading.

## Phase I — Admin Panel Desktop Sidebar Layout (Complete)

### Completed
- [x] I1: `AdminScreen` tabs (Staff/Roles/Inventory/Stats/Import) now render in a left sidebar column on desktop (`min-width: 768px`, sticky, 220px) with content on the right; horizontal tab bar preserved on mobile. CSS in `AdminScreen.module.css` (`.layout`/`.sidebar`/`.content`), JSX in `AdminScreen.jsx`. Build verified.

## Phase J — GitHub Actions Deployment (Complete)

### Architecture
- **Deploy target**: `holfam` (192.168.68.62), production stack lives in `~/projects/comiccache/` (NOT `~/ComicCache`).
- **Trigger**: push to `master` → GitHub Actions → **self-hosted runner on holfam** runs `~/actions-runner-comiccache` (systemd service `actions.runner.flyboy1565-ComicCache.holfammedia`). The runner carries the `comiccache` label; workflow requires `runs-on: [self-hosted, comiccache]`.
- **DB**: bind mount `./data:/data` inside the deploy dir (`DB_PATH=/data/comiccache.db`). Migrated one-time from the old `comiccache_comiccache_data` volume.

### Workflow (`.github/workflows/deploy.yml`)
1. `actions/checkout@v5`
2. `rsync -az --delete` repo → `$HOME/projects/comiccache/` (excludes `.git`, `.github`, `node_modules`, `dist`, `.venv`, `.env`, `data`, `__pycache__`)
3. Write production `.env` from repo secrets
4. `docker compose -f docker-compose.server.yml config` (validate)
5. `docker compose -f docker-compose.server.yml up -d --build`
6. Smoke test: backend responds on `:8001/api/v1/comics/recent`, frontend 200 on `:8081/`
7. `docker image prune -f`

### Production compose (`docker-compose.server.yml`)
- Standalone (does NOT compose with `docker-compose.yml`). Frontend `comiccache-frontend` on host `8081:80`, backend `comiccache-backend` on `8001:8001`, both attach to external `webproxy` network (Nginx Proxy Manager fronting 80/443 from DuckDNS).

### Required GitHub secrets (repo → Settings → Secrets and variables → Actions)
`COMIC_VINE_API_KEY`, `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` — values should match the server's `.env` (especially `JWT_SECRET`, or existing users get logged out).

### Notes
- Never push a fresh `JWT_SECRET` into the secrets store casually — it invalidates all existing sessions.
- `.actions-runner/` at the repo root is the laptop's stray runner dir (gitignored, ~215 MB); safe to delete now the holfam runner exists.


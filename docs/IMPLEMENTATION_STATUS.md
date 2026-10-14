# Implementation status

Date: 2026-10-14 UTC (2026-10-13 in Toronto).

## Result

The local FIT / VLAD application is implemented. The original handoff documents and supplied assets are preserved. The approved design reference guided the dark sidebar, green controls, hero image, white panels, and responsive workout layout.

The application includes all three training phases, 15 day templates, 38 exact exercise variations, alternatives, pound-based logs, previous results, set and workout notes, a stored-deadline timer, history, Recharts views, optional dated body weight, export, private owner access, offline storage, sync, and controlled PWA updates.

The app runs in the local Worker runtime with Wrangler D1 SQLite. No remote resources, DNS changes, or deployment were made. The future host is `fit.vladpalacio.com`.

## Tested stack

| Component | Version |
| --- | --- |
| TanStack Start / Router | 1.169.1 / 1.170.44 |
| React / React DOM | 19.3.0 |
| TypeScript / Vite | 7.0.2 / 8.3.4 |
| Tailwind CSS | 4.3.3 |
| shadcn/ui | Generated local components; Radix 1.8.1 |
| Recharts | 3.10.1 |
| Prisma client, D1 adapter, CLI | 6.19.0 |
| Better Auth | 1.7.7 |
| Wrangler / Cloudflare Vite plugin | 4.150.0 / 1.63.2 |
| Playwright / Vitest | 1.64.0 / 5.0.4 |

Prisma and Better Auth were tested in the local Worker before the full application was built. The auth schema came from the Better Auth CLI. Public signup is disabled. A token-protected local setup endpoint uses the supported signup API. It cleans up a partial user if credential-account creation fails.

The lockfile includes narrow overrides for Prisma's configuration dependencies: Effect 3.22.2 and deepmerge-ts 8.0.2. Prisma generation and the build pass with these versions. The final package audit reports zero known vulnerabilities.

## Test results

Five browser scenarios passed in Microsoft Edge. Six focused unit tests passed. Type checking and the production build passed. Local Worker integration scripts also passed. The final normal build passed manifest parsing, keyboard focus, CSV download, and offline reload without browser script errors.

| Acceptance case | Result and evidence |
| --- | --- |
| Fresh account and empty charts | Pass. No workout or body-weight fixtures are part of the seed. Empty states use real record counts. |
| Every phase and alternative | Pass. 15 templates and 38 variations; every alternative resolves. Unspecified reps and optional get-up targets stay unset. |
| 360, 390, 768, 1024, 1440 px | Pass. Main pages and the populated workout have no page-level horizontal overflow. Saved input stays intact after resize. |
| 200 percent zoom | Pass at 1440 px. The layout reflows without page-level overflow. |
| Start, log, reload, resume | Pass. Routine snapshot, saved set, active selection storage, and timer persist. |
| Offline workout and body weight | Pass. Both survive offline navigation/reload and sync after reconnection. |
| Lost server acknowledgement | Pass. The browser test drops the reply after the server commits. Retry returns one record. The API test also checks an identical receipt and rejects changed content with the same operation ID. |
| Conflicting edits on two devices | Pass with two isolated browser contexts. Conflict is visible; applying the local edit uses the current server revision. |
| Stale edit after deletion | Pass. The server returns a conflict and retains the tombstone. Restoration requires an explicit action. |
| Expired session | Pass. A real local session was expired in D1 and access returned 401. The browser revocation test keeps offline work and syncs it after sign-in. |
| Two tabs | Pass. Concurrent starts use one active session and one routine. Local writes are atomic; set forms have per-tab drafts and reject a stale local version. |
| Timer suspension | Pass for deadline calculation and browser reload. Physical phone screen-lock behavior remains a device check. |
| Past body-weight date | Pass. The selected calendar string stays unchanged through storage, API, export, edit, and move. Invalid calendar dates are rejected. |
| Duplicate body-weight date | Pass. The UI opens the existing entry for editing. A date move keeps the stable record ID. Server uniqueness includes tombstones. |
| Metric fixtures | Pass. Equipment count and side multipliers are separate. Warm-ups and assisted sets do not enter loaded volume. The browser fixture totals 1,920 lb from 135 × 8 plus 140 × 6. |
| Empty and single-point charts | Pass. Recharts shows only saved values. Tables provide the same data. Body-weight charts use numeric calendar spacing. |
| Offline PWA reload | Pass in desktop Edge, including a deep workout route. The cached shell contains no private server data. Active routine images are cached separately. |
| Update during workout | Pass with a second service-worker version. Update is disabled during an active workout. After saving a draft, the update preserves an unfinished set, notes, and queued work through an offline reload. |
| Sign-out with unsynced work | Pass. Warning, export, and explicit discard paths were tested. Private local records are removed only after the explicit choice. |
| Labels and accessible structure | Browser tests use named controls, alerts, tables, and status regions. The release browser check passed keyboard navigation through the skip link into the main region. Visible focus styles, reduced-motion rules, and chart tables are present. A full screen-reader session remains untested. |
| Unauthorized APIs and export | Pass. Requests without an owner session return 401. Write origin is checked. Public registration is rejected. |
| Empty local D1 migration | Pass in a separate local database. Schema and static catalogue are reproducible. |
| Upgrade with existing records | Pass. D1 upgrade preserves ID, revision, and payload. Browser IndexedDB v1-to-v2 upgrade preserves a queued record and syncs it. |
| Atomic write failure | Pass. A test trigger rejects the receipt insert. D1 rolls back the record as well. Removing the trigger permits a successful retry. |
| Partial account failure | Pass. A test trigger rejects credential-account creation. The partial user is removed; supported provisioning and sign-in then succeed. |
| JSON export | Pass. Browser export preserves dates, pounds, IDs, records, queue, and drafts. |
| CSV export | Pass. The final browser download check verifies a calendar date, 172.35 lb, and a note with a comma and quoted text. The export also includes exact variations, deletion state, and pending state. |

Test sources: `tests/domain.test.ts`, `tests/offline.test.ts`, `tests/browser/acceptance.spec.ts`, and `scripts/*smoke.mjs` / `scripts/worker-failure-tests.mjs`.

Local evidence: `work/browser-results.json`, `work/dependency-audit.json`, `work/acceptance-*.png`, `work/workout-390.png`, `work/workout-768.png`, `work/progress-completed.png`, and `work/update-workout-preserved.png`, `work/final-desktop.png`, and `work/final-phone.png`. These files are ignored by Git because they are local test outputs.

## Data and sync decisions

- The five training record models keep validated domain fields in JSON payloads. Indexed columns hold owner, parent, date, and exercise identity. This preserves exact snapshots while allowing schema-version checks at the API.
- Prisma remains the ORM. One documented native D1 batch is used for atomic record/receipt coordination. Revision checks and parent-deletion checks also occur in the write statement.
- IndexedDB commits each record and operation together. Starting a routine is also atomic. The queue survives reload, 401 responses, network failure, and app updates.
- Only acknowledged writes show Synced. Saving, Not saved, Saved on phone, Syncing, Needs sign-in, Conflict, and Could not sync are explicit states.
- Notes have a 4,000-character limit. Pound values use integer hundredths. Completed reps are positive integers. RPE uses half steps from 1 to 10.
- The service worker does not cache API or login responses. Offline navigation uses a neutral client-rendered shell and the last locally authorized owner. Uploads always require a current server session.

## Exercise assets

All 38 movements have individual WebP assets and written instructions. The supplied sheets were reviewed. Romanian deadlift, two-hand swing, and Turkish get-up images were corrected. Clean-and-press and get-up movements use step sequences. See `assets/reviewed/review-log.json` and `assets/reviewed/README.md` for the review record and source scope.

## Remaining release checks

- No physical Galaxy phone was connected. Confirm Android installation, standalone display, screen-lock timer recovery, and offline use on that device before release.
- A full screen-reader test and Safari/iPhone test were not run. Browser labels, status regions, and table alternatives were checked through the rendered page structure.
- Confirm the production owner email, Cloudflare account, and zone when deployment is requested. No production identity or secret was invented.
- The image review is an AI visual check against exercise references. It is not a personal coaching assessment.

See `LOCAL_DEVELOPMENT.md` for startup instructions and `DEPLOYMENT.md` for the prepared release and rollback procedure.

## Navigation fix — 2026-10-14

Fixed the full-page flash between Today and the other pages. The app and workspace now stay mounted in the root layout. Route changes replace the page content without repeating the owner lookup or showing the workspace loading screen.

The focused browser test reproduced the old failure and passed after the fix. It checks that the same app shell remains through Today, Workouts, Plan, and Progress; no loading screen appears; and no extra owner lookup occurs. Offline reload and navigation also pass. Type checking and the production build pass. No training records were changed by this test.
# Shadcn controls and sidebar — 2026-10-14

- Replaced native dropdowns across workout logging, history, progress, and settings with shadcn Select.
- Replaced native date inputs with shadcn Calendar and Popover. Calendar dates remain local date strings; body-weight dates cannot be in the future. Optional dates can be cleared.
- Replaced the main navigation with shadcn Sidebar. The header button expands or collapses it on desktop and tablet. The choice persists on the device. On phones, the button opens the shadcn Sheet navigation panel, which closes after navigation.
- Validation: type check and production build passed. Targeted browser tests passed at 1440, 768, and 390 pixels: sidebar persistence, dropdown selection, calendar selection, phone navigation, and no horizontal overflow. Screenshots reviewed. The existing route-preservation and offline-reload test passed.
- Updated acceptance-test date selection to use the calendar. The data-writing acceptance suite was not repeated for this UI change. No test workout records were added. Development remains local.
- Build reports a client chunk above the advisory 500 kB threshold. No blocking issue found in the targeted UI checks.

# Routine start date — 2026-10-14

- A new routine starts on the local date of its first workout. Today offers Day 1 before the first session. Earlier dates show “Not started”.
- The first-start transaction saves the start date and weekday assignments with the session and exercises. With the default schedule, a Wednesday start assigns Day 1 to Wednesday, then Thursday, Friday, Monday, and Tuesday. Resume does not reset the start date.
- For workouts created by the earlier version without a start date, the app uses the first saved workout date. Existing workout snapshots and logs are preserved.
- Validation: type check, production build, and all seven unit/storage tests passed. The browser test passed for a Wednesday first start, earlier-date labels, offline start, and the saved start date/schedule. Browser fixture writes were restricted to an isolated offline context; no fixture was sent to the owner account.


## Working-set reminder — 2026-10-14

Added the owner's 6–10 working-set reminder above the workout set log, with an expandable progression guide and exercise-type ranges. The full guide is also in Plan. Existing exercise targets and saved workouts are unchanged. Type check and production build passed. Read-only browser checks passed for the current workout, expanded guide, phone width without page overflow, and Plan. No records were changed by the check.


## Reset start date from Settings — 2026-10-14

Added a separate Plan start date section with the shadcn date picker, Use today, and Save start date. Saving other preferences preserves the saved start date. Resetting the date keeps existing workouts, phase, and weekday assignments. Type check, production build, and the targeted offline browser test passed. The test verified date persistence across navigation, Use today, and unchanged workout records. Test writes remained in an isolated offline browser context.


## Body weight on Progress — 2026-10-14

Added a prominent Body weight section at the top of Progress, with latest dated weight, the existing Recharts chart when entries exist, and links to log weight and edit history. Empty state explains how to begin. Type check, build, and read-only phone browser checks passed; no account records changed.

Local URL is now http://127.0.0.1:3001 because another project occupies port 3000. Updated local scripts, auth URL, and test URLs. Server data is unchanged; browser-only drafts and pending changes at the old origin do not transfer automatically. Do not clear old-origin storage.

## Weight button label — 2026-10-14

Fixed general link styles overriding shadcn button text. Link colour rules now exclude button links. Removed the previous token-based override. Production build passed; browser checks confirmed white label text in normal, hover, and focus states. Phone screenshot reviewed.


## Inline weight tracking — 2026-10-14

Progress now contains the body-weight entry form, chart, and editable measurement history directly. The original body-weight URL still works. Type check and build passed. An isolated offline browser check added and edited a weight on Progress without navigation, and checked phone page width. No test entries were synced to the owner account.


## Distinct motivational quotes — 2026-10-14

Added nine distinct short quotes with linked attribution across Today, login, Plan, workout history, Progress, exercise library, Settings, standalone body weight, and workout logging. Removed the repeated sidebar quote. Sources: Jocko's official About page, his Tim Ferriss interview transcript (episode 187), and the official Can't Hurt Me introduction PDF on David Goggins's website. Type check and build passed. Read-only browser checks verified one unique quote per tested page, source links, and no phone-width overflow. No account records changed.


## Save notifications — 2026-10-14

Mounted the shadcn Sonner toaster once in the root layout. Successful explicit saves show a record-specific toast after the local write succeeds; offline wording states that sync will occur when online. Save failures show an error toast. Workout start/resume has a saved-on-device notification. Draft typing does not emit toasts. Phone offset clears bottom navigation. Type check and build passed. An isolated offline browser check verified success and error toasts without syncing fixture changes.


## Better Auth email OTP — 2026-10-14

Replaced password login with Better Auth email OTP. Six-digit codes expire after five minutes, are hashed in D1, work once, and rotate on resend. Three wrong attempts invalidate a code. Only the configured owner can request or use codes. Public signup and password routes are disabled. Existing sessions and training data remain intact.

Cloudflare delivery is prepared with a binding restricted to the verified owner destination. Sending to verified destinations is free on all Cloudflare plans. Local development logs codes and sends no email. See EMAIL_OTP.md for setup and local sign-in instructions.

Passed: TypeScript check, production build, and focused tests against the local Worker with Prisma/D1. Tests covered wrong/valid/reused/rotated/expired codes, three wrong attempts, owner and origin restrictions, blocked password/signup routes, request limits including five simultaneous requests with only three accepted, session revocation, phone login layout, and resend countdown. No workout records were added or changed. Legacy test login helpers now use OTP; destructive acceptance fixtures were not rerun.

The tests exposed an interactive-transaction call in Better Auth's default Prisma rate limiter. Replaced only its storage operation with an atomic SQLite upsert through Prisma. Better Auth still generates and checks all OTPs. Also drained rejected auth request bodies to ensure local Worker error responses complete.

Remaining: verify the real owner destination and sender in Cloudflare, then test actual inbox delivery after authorization. No remote resources, DNS changes, deployment, or real emails were made.

## Live Cloudflare email test — 2026-10-14

The owner authorized a live email test. Cloudflare confirmed the owner destination is verified and vladpalacio.com Email Routing is ready. The local Worker used a remote EMAIL binding restricted to that destination; D1 stayed local. Better Auth's code request returned 200, and the owner confirmed receipt of the code email. The sender was fit@vladpalacio.com. Inbox delivery is confirmed; entry of the received code is pending user verification.

Updated the existing local user's email to the verified owner address, preserving the user ID and all training records. Saved a local database backup in ignored work/pre-live-email.sql first. No DNS changes or production deployment were made. The current server uses ignored wrangler.live-local.jsonc with OTP_DELIVERY=cloudflare. Standard wrangler.jsonc still uses local log delivery. Do not run automated OTP tests against the live-email profile.

## Production deployment — 2026-10-14

User authorized deployment to https://fit.vladpalacio.com. Deployed Cloudflare Worker version ef73fff6-4fe7-4e34-880c-39b94cb75be1 with remote D1 and restricted Cloudflare email binding. Existing owner ID, one workout and its five exercises were preserved. No local sessions, passwords, OTPs or sample records were imported. Saved a local backup before transfer.

Passed: typecheck, seven unit tests, production build, migration/import, remote row counts, HTTPS home and deep route, PWA manifest and service worker, unauthorized API checks, blocked public provisioning/signup/password endpoints, and visible production OTP login screen. No destructive acceptance fixtures were run on production. Phone installation and completion of the owner's production email login remain device/user checks.

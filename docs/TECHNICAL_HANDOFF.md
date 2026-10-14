# FIT VLAD technical handoff

Build a private, responsive workout website for Vlad. Use the supplied design reference and training plan. The site must work on a Galaxy phone, tablet, and desktop. It must also be an installable progressive web app (PWA).

This package is the implementation brief. It contains design assets and requirements, not a completed application. The user requested local development first. The intended deployment date is October 14, 2026, in America/Toronto. This date is a target, not a scheduled deployment or permission to publish automatically.

## Fixed decisions

| Area | Requirement |
| --- | --- |
| Name | FIT / VLAD |
| Production address | https://fit.vladpalacio.com |
| Framework | TanStack Start, React, TypeScript, Vite |
| UI | shadcn/ui and Tailwind CSS |
| Charts | Recharts |
| Database tools | Prisma ORM and the Prisma D1 adapter. Do not substitute Drizzle. |
| Development database | Local SQLite through Wrangler local D1 emulation |
| Production database | Remote Cloudflare D1, created at deployment time |
| Hosting | Cloudflare Workers with the Cloudflare Vite integration |
| Authentication | Better Auth with its Prisma adapter |
| Phone support | Installable PWA; Galaxy is the primary phone test device |
| Offline records | IndexedDB, persistent write queue, explicit sync status |
| Units | Pounds (lb) |
| Access | One owner. Public registration disabled. |
| Optional feature | Body-weight entries by date, with history and charts |

Keep the current stack. Do not add a second backend, hosted database, subscription system, social features, or an AI training coach.

## Design reference

Use `assets/reference/approved-design-reference.png` as the main visual reference. It supersedes the earlier ivory mockup. Treat all displayed dates, exercise figures, statistics, and records as sample content. Do not seed them as Vlad's records. The reference contains an incorrect date/weekday combination; calculate all real dates from the selected timezone.

Retain these visual features:

- Dark charcoal sidebar, light panels, restrained green controls.
- FIT / VLAD wordmark, with VLAD in green.
- Wide gym banner with live HTML heading and supporting copy.
- Week strip with clear selected, completed, missed, and rest states.
- Dashboard workout summary and a small monthly summary.
- Exercise list beside the active exercise on wide screens.
- Start and end illustrations above the set log.
- Exercise instructions, previous results, muscles, and notes.
- Progress charts and record tables.
- Three month tabs in the plan.

Use `assets/brand/tokens.css` as a starting point. Adjust only when needed for readability or measured contrast. Use at least 16 px for primary body text. Use at least 44 by 44 CSS px for primary touch controls. Do not reproduce tiny text from the reference image.

The screenshot is a layout reference, not an executable specification. Its illustrated start/end poses can be too similar. Use distinct movement positions in the final app.

### Responsive behavior

| Width | Layout |
| --- | --- |
| Below 640 px | Single column; compact header; bottom navigation for Today, Plan, Progress, More |
| 640 to 1023 px | Compact navigation; two columns where readable; illustrations beside or above the log |
| 1024 px and above | Left sidebar; dashboard grid; exercise list and active exercise side by side |

Breakpoints are implementation defaults. Test actual content at 360, 390, 768, 1024, and 1440 px. Also test 200 percent zoom. No page-level horizontal scrolling. Convert the set table into labelled set cards on small screens. Keep all features available at every width.

On phones, show a compact illustration pair with an enlarge action. Do not make a user scroll past a full screen of images for every set. Preserve the active exercise and entered values when the viewport changes.

## Pages and routes

| Route | Behavior |
| --- | --- |
| `/` | Today dashboard, current week, next workout, resume action, monthly totals |
| `/workouts` | Workout history with date and exercise filters |
| `/workouts/$sessionId` | Active or completed workout, exercises, sets, timer, notes |
| `/plan` | All three phases, five daily templates, alternatives, weekly schedule |
| `/progress` | Workout charts and exercise records |
| `/progress/body-weight` | Optional dated body-weight log and chart |
| `/exercises` | Searchable exercise catalogue |
| `/exercises/$slug` | Movement images, instructions, equipment, muscles, previous results |
| `/settings` | Timezone, plan start, four/five-day schedule, install, export, sync, sign out |
| `/login` | Private owner sign-in |
| `/api/auth/$` | Better Auth server handler |
| `/api/sync` | Authenticated record synchronization |
| `/api/export` | Authenticated full data export |

Use a protected layout for private pages. Check authorization again in every server function and API handler. A client-side route guard is not sufficient.

### Dashboard

Show today's local date, the selected plan day, and Start or Resume. If no workout is planned, show a rest state and a way to select a workout. Do not infer a completed workout from the date alone.

Use real completed sessions for totals. On a new account, show a helpful empty state. Do not display a fabricated streak, personal record, or chart.

### Workout log

1. Start creates one session with a snapshot of the selected template.
2. Select the exact exercise variation before logging.
3. Show the most recent completed sets for that variation.
4. Enter weight, reps, optional effort rating (RPE), and optional note.
5. Persist the set and sync operation in one local IndexedDB transaction.
6. Display Saved on phone. Show Synced only after server acknowledgement.
7. Let the user start, pause, adjust, and reset the rest timer.
8. Finish marks the session completed. Empty sessions remain drafts or can be discarded.
9. Allow later edits with a clear record version.

Separate warm-up, working, and rest-pause sets. Record rest-pause segments under the parent set. Never count the parent aggregate and its segments twice.

Allow add, edit, remove, undo, exercise replacement, reorder, and skip. Changing an exercise must not relabel sets already recorded for another variation. Template changes must not rewrite old sessions.

Use a stored timer deadline, not an interval counter. On resume after screen lock, calculate remaining time from the deadline. Sound and vibration are optional. Do not promise a background alarm when the browser suspends the app.

### Body weight

This feature is optional and must never block workout use. Enter a positive weight in pounds and an explicit local calendar date. Allow past dates, edit, and delete with undo. Reject future dates in the selected timezone. Default to today.

Store weight as integer hundredths of a pound. Keep one active entry per owner and calendar date. If an entry already exists, show it for editing; do not silently create a duplicate. A deletion leaves a versioned tombstone for sync. Date changes are an explicit move operation; resolve a destination-date collision before saving.

Use a Recharts line chart with actual calendar spacing, visible points, and a table alternative. Do not invent missing daily measurements. Show latest weight and change from the first entry in the selected range. Do not label weight loss or gain as success automatically.

## Training content

The supplied routine is user content. Preserve its instructions without claiming that the software has clinically validated them. Keep technique instructions separate from intensity notes. Do not automate load increases, technical failure, or rest-pause advice.

### General notes

- One to two hard working sets per exercise, close to technical failure.
- Main progression uses barbell and dumbbell compounds.
- Controlled tempo, especially during lowering.
- Rest three to five minutes on heavy sets.
- Thorough warm-ups.
- Kettlebells supplement the main lifts.
- Rest Saturday and Sunday. Allow a four-day schedule when recovery lags.

Default to five weekdays. A four-day option must let Vlad choose the omitted or moved day; it must not silently remove exercises. Let the user select the plan start date and current phase. Do not assume each named month is exactly four weeks. Until phase dates are set, phase changes are manual.

### Month 1 Foundation

The first named exercise in each row is the initial selection. Keep all alternatives available.

| Day | Exercise or alternatives | Working sets and reps |
| --- | --- | --- |
| 1 Chest and Triceps | Incline barbell press or incline dumbbell press | 1–2 × 6–10 |
| 1 | Flat barbell bench press or dips | 1 × 6–10 |
| 1 | Dumbbell fly or pec deck | 1 × 8–12 |
| 1 | Triceps pushdown or overhead dumbbell extension | 1–2 × 8–12 |
| 1 | Light goblet squat or kettlebell swing | 2 × 10–12 |
| 2 Back and Biceps | Pull-up or lat pulldown | 1–2 × 6–10 |
| 2 | Barbell row or dumbbell row | 1–2 × 6–10 |
| 2 | Face pull or rear delt fly | 1 × 12–15 |
| 2 | Barbell curl or dumbbell curl | 1–2 × 6–10 |
| 2 | Single-arm kettlebell row | 2 × 8–10 per side |
| 3 Legs | Barbell squat or leg press | 1–2 × 6–10 |
| 3 | Barbell Romanian deadlift | 1–2 × 8–12 |
| 3 | Leg extension or kettlebell goblet squat | 1 × 10–15 |
| 3 | Standing calf raise | 1–2 × 10–15 |
| 3 | Light to moderate kettlebell swing | 2 × 10–15 |
| 4 Shoulders and Arms | Barbell or dumbbell overhead press | 1–2 × 6–10 |
| 4 | Dumbbell lateral raise | 1–2 × 10–15 |
| 4 | Close-grip bench press or dips | 1 × 6–10 |
| 4 | Hammer curl or EZ-bar curl | 1 × 8–12 |
| 4 | Strict kettlebell press | 2 × 6–8 per side |
| 5 Full Body | Barbell deadlift or trap-bar deadlift | 1 × 5–8 |
| 5 | Incline dumbbell press or push-up | 1 × 8–12 |
| 5 | Barbell row or dumbbell row | 1 × 6–10 |
| 5 Circuit | Kettlebell swing, goblet squat, single-arm row or press | 2–3 rounds; reps not specified |

For the circuit, preserve unspecified reps as null. Ask for a target when setting up the circuit, or allow free logging. Do not invent a prescribed rep count.

### Month 2 Intensity

Days 1–4 retain the Month 1 structure. Preserve the user's notes about increasing weight or reps when form is solid. Preserve optional short rest-pause: rest 10–15 seconds, then 2–4 more reps. Store this as an optional note, not a required timer action.

Day 5 example replaces Day 5 only:

| Exercise | Target |
| --- | --- |
| Barbell deadlift or squat variation | 1 hard set; reps not specified |
| Single kettlebell clean and press | 3 × 4–8 per side |
| Kettlebell swing | 3 × 8–12 |
| Turkish get-up | Optional very light practice; sets and reps not specified |

### Month 3 Peak

Days 1–4 retain their exercise choices. The user's main-compound instruction is one all-out set with optional rest-pause. Preserve this as phase content. Keep accessory targets from Month 1 unless edited.

Day 5 example:

| Exercise | Target |
| --- | --- |
| Barbell deadlift or squat | 1 hard set; reps not specified |
| Single or double kettlebell clean and press | 3–4 × 3–6; single version per side |
| Kettlebell front squat or goblet squat | 2–3 × 6–10 |
| Kettlebell swing | 3 × 8–12 |
| Turkish get-up | Optional; sets and reps not specified |

For double kettlebells, record one repetition of the paired movement, not one repetition per side. The asset catalogue uses a double front-rack squat as the initial kettlebell front-squat version. If another variation is added, give it a separate ID and matching images.

## Load and chart definitions

Store pounds in integer hundredths. Convert only at input/output boundaries. Keep the recorded load basis with each exercise and set.

| Equipment | Input rule |
| --- | --- |
| Barbell or trap bar | Total load, including the bar |
| Pair of dumbbells | Weight of one dumbbell; equipment count 2 |
| One dumbbell or kettlebell | Weight of that one implement |
| Double kettlebells | Weight per bell; equipment count 2 |
| Machine | Displayed selected load; compare only within the same machine variation |
| Bodyweight | Reps plus optional added load or assistance; never treat body weight as zero-load volume |

For unilateral work, record left and right separately when they differ. If Both sides is selected, the entered reps apply to each side and the volume multiplier is 2. This is separate from equipment count.

Loaded volume = load per implement × equipment count × recorded reps × side multiplier. Include completed working sets only. Sum rest-pause segments once. Exclude unweighted bodyweight and assisted sets from loaded-volume totals; report their reps separately. Do not include warm-ups or deleted sets.

Recharts charts:

- Exercise load trend: maximum working-set load per session, with reps in the tooltip. Filter by exact variation and load basis.
- Loaded volume: weekly totals with timezone-aware week boundaries.
- Workout frequency: completed sessions by week.
- Body weight: actual dated measurements.
- Records: highest load and highest reps at each load. Do not claim higher load with fewer reps is an unqualified strength improvement.

Default chart ranges: four weeks, three months, all time. Provide an accessible table for each chart. Use a container with an explicit height before mounting ResponsiveContainer. Lazy-load charts. Keep a stable loading placeholder during server rendering. Do not use generated images as charts.

## System design

The browser renders TanStack Start routes. It reads and writes local records through IndexedDB. A sync module sends changes to authenticated server handlers in the same application. The server uses Prisma with the D1 driver adapter. The Worker serves the application and static assets.

Use TanStack Query for remote cache state if it simplifies reads. The persistent local write queue remains a separate module. Query caching alone does not meet the offline requirement.

Suggested modules:

```text
src/routes/                 TanStack routes and auth endpoint
src/components/ui/          shadcn components
src/features/workouts/      session and set UI
src/features/plan/          templates and schedule
src/features/exercises/     catalogue and instructions
src/features/progress/      Recharts views and calculations
src/features/body-weight/   date and weight entries
src/lib/auth.server.ts      Better Auth configuration
src/lib/db.server.ts        request-scoped Prisma D1 client
src/lib/offline/            IndexedDB, outbox, conflicts
src/lib/sync/               schemas and server handlers
src/lib/metrics/            pure metric functions
src/sw.ts                  service worker
prisma/schema.prisma       Prisma model source
migrations/                reviewed D1 SQL migrations
public/assets/             reviewed production assets
docs/                      this handoff and validation records
```

### Local database first

Use Wrangler local D1 emulation with local persistent storage under the ignored `.wrangler` directory. This is a local SQLite database. It does not create or use a remote D1 database. Use the same D1 adapter and Worker runtime locally and in production.

The local-first requirement refers to development infrastructure as well as browser data persistence. These are different stores: local D1 is the development server database; IndexedDB is the phone/browser database.

Configure the development binding for local persistence. Ensure remote development is disabled. Do not set up remote resources or change DNS during this handoff.

Use Prisma to define the schema and generate the client. Generate reviewed SQL from schema changes, then apply it with Wrangler local migrations. Keep Prisma CLI, client, and adapter versions compatible. Pin working versions in the lockfile. Do not mix commands from Prisma 6 and Prisma 7 documentation.

At deployment time, create remote D1, apply the same migrations, set the Worker binding and secrets, then test the staged app. Move only real records the user wants to retain. Development fixtures must not enter production. Export local data before transfer and verify row counts and record IDs afterward.

A native SQLite Node adapter is not required for this design. Do not introduce one inside the Worker runtime.

### Prisma and D1 compatibility

Prisma supports D1. The user's Prisma 6 reference explicitly documents that its adapter does not provide normal transaction guarantees. Do not assume Prisma nested writes or `$transaction` will make several mutations atomic.

First build a small compatibility test with the selected package versions:

1. Run TanStack Start in the local Worker runtime.
2. Query and write local D1 through Prisma.
3. Generate the Better Auth Prisma schema.
4. Create the owner account through a supported auth flow.
5. Sign in, read a session, sign out, and test expired sessions.
6. Test partial failure, duplicate retries, and account cleanup.
7. Record the tested versions and results.

Use the native D1 batch API only in a small, documented repository function where an atomic multi-statement operation is essential. This is a limited escape hatch, not a replacement ORM. Confirm its behavior in tests. If a required Better Auth operation cannot run safely on the selected stack, report the exact failure before changing any chosen technology.

## Data model contract

Use client-generated UUIDs for workout records. Use the selected Better Auth version's generated account/session models. Do not handwrite a guessed auth schema.

| Entity | Required fields and rules |
| --- | --- |
| User | Auth-owned ID and verified identity |
| UserSettings | userId, timezone, planStartDate, currentPhase, trainingDays, weightUnit |
| Exercise | stable slug, name, equipment, loadBasis, equipmentCount, unilateral flag, instruction version, image IDs, review status |
| PlanTemplate | ID, revision, phase, day index, title, notes |
| PlanExercise | templateId, order, chosen exercise, alternative IDs, set/rep min/max, optional flag, circuit group, rest seconds |
| WorkoutSession | ID, userId, template snapshot, local date, timezone, startedAt, endedAt, status, notes, revision, lastOperationId, deletedAt |
| SessionExercise | ID, userId, sessionId, exact exercise snapshot, order, skipped flag, revision, lastOperationId, deletedAt |
| WorkoutSet | ID, userId, sessionExerciseId, order, kind, weightHundredths, reps, side, RPE, notes, completedAt, parentSetId, revision, lastOperationId, deletedAt |
| BodyWeightEntry | stable ID, userId, localDate, weightHundredths, notes, revision, lastOperationId, deletedAt |
| SyncReceipt | userId, operationId, request hash, entityId, result revision, result payload, createdAt |

Store timestamps in UTC. Store user-selected dates as YYYY-MM-DD strings with calendar validation. Do not convert a body-weight date through midnight UTC.

Add indexes for owner/date, owner/exercise/date, session children, and pending sync retrieval. Enforce one body-weight entry per owner/date. Reuse its tombstoned row on restoration. Validate foreign-key ownership in the server, including parent session and exercise records.

RPE is optional and must be 1–10 in 0.5 steps when supplied. Reps must be positive whole numbers for completed sets. A draft may have empty values; empty is not zero. Store notes as plain text with a documented length limit. Validate every field on the server.

## Offline sync protocol

Keep local records and outbox writes in one IndexedDB transaction. If storage fails, show Not saved and retain the visible form. Request persistent browser storage where supported, but never claim that browser data cannot be removed.

Each operation includes operationId, entityType, entityId, baseRevision, action, payload, and schemaVersion. The server derives userId from the session. Never trust userId supplied in a payload.

Send parent records before child records. Serialize mutations for each entity. Use a per-tab coordinator or Web Lock so two tabs do not send the same entity concurrently. The server must still be safe when duplicates occur.

For each operation:

1. Check identity, ownership, schema, and request size.
2. Check the receipt for the operation ID. The same ID with different content is invalid.
3. Create with a stable unique ID, or update using a conditional revision check.
4. Store lastOperationId on the entity in the same entity write.
5. Store the receipt and return the canonical record.
6. If a crash happened after step 4, a retry uses lastOperationId to reconstruct the receipt. It does not apply the edit twice.
7. Do not send a later local mutation for that entity until the earlier mutation is acknowledged.

Use a native atomic D1 batch if receipt/entity coordination needs stronger guarantees. Test the actual failure windows. Never use an in-memory lock as a cross-Worker correctness guarantee.

If baseRevision differs, return a conflict with the server record. Keep the local draft. Offer Keep server or Apply my edit against the current version. Do not silently overwrite another device's edits.

Retain deletion tombstones. A stale offline device must not restore a deleted record. Pull all owner records initially; a full owner refresh is acceptable at this scale. If adding incremental sync, use a monotonic cursor and include tombstones.

Status labels: Saved on phone, Syncing, Synced, Needs sign-in, Conflict, Could not sync. Retry transient failures with bounded exponential backoff. Do not retry invalid input indefinitely. A 401 pauses uploads and preserves local work.

On sign-out, warn if unsynced work exists and offer sync, export, or explicit discard. Clear private caches only after that choice. Namespace IndexedDB records by authenticated owner. Do not expose a previous owner's data after a different login.

## PWA contract

Provide a manifest with stable ID, name FIT / VLAD, short name FIT, start URL, scope, standalone display, theme and background colors, and valid 192 px and 512 px icons. Supply separate maskable icons with a safe central mark. Supply an Apple touch icon as a fallback.

Use HTTPS in production. Provide an install action when the browser exposes an install event. Otherwise show browser-specific instructions. Installation must remain optional.

Cache the public shell, versioned scripts/styles, and the selected routine's reviewed exercise images. Do not cache login pages, auth responses, cookies, or private API responses in shared Cache Storage. Keep private data in the owner-scoped local store.

An offline reload must show a neutral shell and the last locally authorized owner's cached workspace. Do not require a new server-rendered auth check to show that offline workspace. Require a valid session again before sync. A first-ever offline visit shows a clear connection-required page.

Update behavior: show Update available; let the user finish a workout first. Save and checkpoint drafts before activating a new service worker. Do not force reload during a workout. Test schema upgrades and queued operations across an application update.

Foreground reconnect and app resume must trigger sync. Background Sync is optional. Do not rely on it for correctness. Include Export JSON and CSV so records are recoverable if browser storage is cleared.

## Authentication and security

Use Better Auth for the deployed app, with the Prisma adapter. Build the visual login last if useful, but test the adapter early. Public sign-up must remain disabled.

Recommended initial login: a single owner account with email/password, provisioned through a supported local/server setup flow. Never commit a password, auth secret, session, or database export. Obtain the owner's login method and email before production configuration. Do not invent either.

Set secure cookie settings, trusted origin, production base URL, and Worker secrets. Validate auth on every record read/write. Protect export and sync routes. Check origin/CSRF behavior against Better Auth and TanStack documentation. Do not leak Prisma errors or secrets to clients.

Cloudflare Access is optional extra protection, not a second mandatory login system. Do not publish an unprotected workers.dev alternative endpoint.

## Assets

Read `assets/manifest.json` and `assets/README.md`. Keep the user's reference intact. Render real HTML text over the generated banner. Use the supplied vector mark and raster app icons for initial PWA assets.

The generated exercise sheets are draft art. They cover the specified variants, but they are not certified technique instruction. Before release, inspect each exercise independently for pose order, joint position, grip, equipment, and true start/end distinction. Match it to a primary technique reference. Store the source URL and review status per exercise.

Crop or regenerate reviewed rows as separate assets for the final app. Use the image-generation tool for raster edits unless the user requests another process. Do not show a complete multi-exercise sheet as a tiny exercise thumbnail. Do not label draft art as reviewed. Use a labelled image-unavailable state if a variant has not passed review.

Turkish get-ups need a step sequence. Clean and press needs at least clean, rack, and press positions. Two endpoint images alone are not enough for these movements.

Use text muscle labels first. A detailed interactive muscle map is optional; it must not be fabricated from an unverified illustration. Use a standard icon library such as Lucide for navigation. Do not create bitmap versions of interface icons.

## Build order

1. Read this brief and the reference image. Record the final package versions.
2. Create the TanStack Start app in the existing repository without replacing this package.
3. Prove Prisma, local D1, and Better Auth compatibility.
4. Implement responsive shell, tokens, navigation, and empty states.
5. Seed the exact plan and exercise IDs. Keep demo records separate.
6. Implement session logging, local saves, timer, and history.
7. Implement persistent sync and failure recovery.
8. Implement Recharts views and optional body-weight tracking.
9. Integrate reviewed exercise assets and instruction content.
10. Implement installation, offline reload, update handling, export, and sign-out handling.
11. Run the acceptance tests below and capture desktop/tablet/phone screenshots.
12. Prepare the deployment checklist. Publish only when the user is ready.

## Acceptance tests

| Test | Expected result |
| --- | --- |
| Fresh owner account | No fabricated records; plan visible; body weight optional |
| Every phase and alternative | Correct targets; unspecified targets remain unset |
| 360/390/768/1024/1440 px and 200 percent zoom | Usable controls; all features; no clipped content |
| Start, log, reload, resume | Saved values and active workout survive |
| Offline set and weight entry, then reconnect | Exactly one server record per operation |
| Network drop after server write | Retry does not duplicate the write |
| Edit same record on two devices | Explicit conflict; neither draft silently lost |
| Delete on one device, sync stale other device | Record stays deleted |
| Session expires offline | Local work remains; sync waits for sign-in |
| Two tabs | No duplicate active writes or lost drafts |
| Timer with screen lock | Correct elapsed time after resume |
| Past body-weight date near midnight | Selected calendar date remains unchanged |
| Body-weight duplicate date | Existing record edited or collision shown |
| Metric fixture | Correct equipment and side multipliers; warm-ups excluded |
| Empty/single-point charts | Clear state; no invented data or trend |
| PWA installed and offline reload | Cached routine and log usable |
| Service worker update during workout | Draft preserved; update waits |
| Keyboard and screen reader | Labels, focus, errors, tables, and chart summaries usable |
| Unauthorized API and export requests | Denied without record disclosure |
| Local migration from empty database | Reproducible schema and plan seed |
| Upgrade with existing records | IDs and records preserved |
| JSON/CSV export | Correct dates, pounds, variations, notes, and pending state |

Use unit tests for metrics and sync state transitions. Use integration tests against local D1 for persistence and auth. Use browser tests for the full workout, body-weight, responsive, offline, and update paths. Do not treat a successful build as proof of PWA behavior.

## Deployment checklist

The planned date is October 14, 2026. No deployment is scheduled by this document.

- Confirm Cloudflare account, domain zone, owner identity, and login method.
- Export any real local data. Keep test fixtures out of production.
- Create remote D1 and apply reviewed migrations.
- Set secrets and trusted origin; configure the Worker and custom domain.
- Import selected real data with stable IDs, then verify counts and sample values.
- Test auth, sync, export, install, and offline resume on the deployed host.
- Verify that alternate Worker URLs do not bypass access restrictions.
- Record rollback steps and the pre-deployment data export.

## Technical references

Checked during handoff preparation. Use documentation for the package versions selected during implementation.

- [TanStack Start on Cloudflare](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
- [Prisma D1 reference supplied by the user](https://www.prisma.io/docs/orm/v6/overview/databases/cloudflare-d1)
- [Prisma current D1 deployment guide](https://www.prisma.io/docs/guides/deployment/cloudflare-d1)
- [Cloudflare Prisma tutorial](https://developers.cloudflare.com/d1/tutorials/d1-and-prisma-orm/)
- [D1 database API and batch operations](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma)
- [Better Auth TanStack Start integration](https://better-auth.com/docs/integrations/tanstack)
- [shadcn installation](https://ui.shadcn.com/docs/installation)
- [Recharts](https://recharts.org/)
- [NASM exercise library example](https://www.nasm.org/resource-center/exercise-library/incline-barbell-bench-press)


# Local development

The application uses a local Cloudflare Worker and Wrangler D1 SQLite. No remote database is required.

## Start

Use Node.js 24 and run these commands from the repository root:

```powershell
npm ci
npm run db:generate
node scripts/init-local.mjs
npm run db:migrate
npm run build
npm run preview *> work/otp-preview.log
```

Open http://127.0.0.1:3001. Use this exact host. It is the trusted local auth origin.

For a fresh test setup, keep the server open and run `node scripts/auth-smoke.mjs` in a second terminal. This uses the supported Better Auth signup flow through a token-protected local endpoint. Public signup stays closed. The test email is in `work/local-credentials.json`. Sign-in now uses email OTP; read the local code from the Worker log. See [Email OTP](EMAIL_OTP.md). This file and `.dev.vars` are ignored by Git. Do not copy them into production.

The current preview uses a local owner and may contain real training records. Do not run reset or destructive acceptance scripts against this database. No production owner identity has been selected.

Use `npm run dev` for code changes. Use the built preview for PWA tests. The development server does not install a service worker.

## Tests

```powershell
npm run typecheck
npm test
node scripts/auth-smoke.mjs
node scripts/sync-smoke.mjs
node scripts/migration-smoke.mjs
```

The browser tests use installed Microsoft Edge. Set `FIT_ACCEPTANCE=1` during the build to include a second service worker for the update test:

```powershell
$env:FIT_ACCEPTANCE='1'
npm run build
Remove-Item Env:FIT_ACCEPTANCE
npm run preview *> work/otp-preview.log
```

In a second terminal:

```powershell
node scripts/reset-test-records.mjs
npx playwright test
node scripts/worker-failure-tests.mjs
node scripts/reset-test-records.mjs
```

The failure test removes and recreates the **local test owner**. The reset and failure scripts require `OWNER_EMAIL=local-test@fit.invalid`. Do not use these scripts with real training data. Run a normal build after the update test to remove the test service worker from the output.

Browser reports and screenshots are in `work/`. The database is in `.wrangler/state/`. Both paths are ignored by Git.

## Records and recovery

Save commits the record and its pending operation in one IndexedDB transaction. A whole workout starts in one transaction. The server checks the revision and saves the record and receipt in one atomic D1 batch. A repeated operation returns the original receipt.

The five training record models store their validated domain fields in a versioned JSON payload. Indexed columns hold owner, date, parent, and exact exercise. Prisma owns the schema, auth operations, and queries. Only the atomic record/receipt write uses native D1. The server checks parent ownership and deletion state before and during that write.

Notes are plain text, with a 4,000-character limit. Loads use integer hundredths of a pound. The date field is a calendar string. Settings control the timezone used for the local day and weekly totals.

Export JSON before clearing browser data. It includes records, pending operations, and form drafts. CSV is a readable record table. It is not an import file. The app does not promise a background timer alarm or background sync while the browser is suspended.

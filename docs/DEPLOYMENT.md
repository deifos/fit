# Cloudflare deployment preparation

Target: `fit.vladpalacio.com`.

**No remote resource, DNS record, or deployment was created.** Deployment requires a later user request.

## Before deployment

1. Confirm the Cloudflare account and domain zone.
2. Confirm the owner email and verify the Cloudflare email destination. Use Better Auth email OTP; see [Email OTP setup](EMAIL_OTP.md). The local test identity must not become the production owner.
3. Export any real local records. Keep test fixtures out of production.
4. Create a remote D1 database only after authorization. Apply the reviewed SQL migrations in order.
5. Copy `docs/wrangler.production.example.jsonc` to `wrangler.production.jsonc`. Fill in the real database ID and owner email.
6. Set a new `BETTER_AUTH_SECRET` as a Worker secret. Do not reuse the local secret. Do not set `LOCAL_SETUP_TOKEN` in production.
7. Provision the owner through Better Auth's supported signup API in a separate local setup database. Use the intended email and a random temporary setup password. Normal password sign-in is disabled; the owner uses email OTP. Export only that owner's `user` and `account` rows for the authorized production import. Do not import sessions, test workouts, or development credentials. Public signup remains disabled.
8. Set `FIT_WRANGLER_CONFIG=wrangler.production.jsonc` in the build environment, then run `npm run build`. Inspect the generated `dist/server/wrangler.json` before deployment. Confirm the production URL, D1 binding, custom domain, and disabled alternate URLs. Do not publish the local build or its `.dev.vars` file.
9. Deploy the generated Worker and static assets only after the user requests deployment.

The Vite Cloudflare plugin creates the final Worker entry and asset binding. Use that generated configuration for deployment, not the unbuilt TypeScript entry.

## Host checks

The production auth origin must be `https://fit.vladpalacio.com`. `APP_ENV` must be `production`; this enables secure cookies. Keep `workers_dev` and `preview_urls` false. The custom domain is the intended public endpoint. Every record API and export request requires the configured owner session.

After the authorized deployment, test sign-in, sign-out, sync, export, installation, and offline reload on the actual Galaxy phone. Test expiry and a service-worker update with an unfinished workout. Confirm that no alternate Worker URL exposes the app. Check row counts and stable IDs for any selected real data import.

## Rollback

Keep the previous Worker version and a D1 export before each release. Roll back the Worker version if startup or sync fails. Do not reverse a schema migration by deleting record columns. Use a forward repair migration or restore a verified database backup after review. Keep IndexedDB version changes additive so pending operations remain recoverable.

The local acceptance build can include `sw-acceptance.js`. A normal production build does not include this test asset.

## Production release — 2026-10-14

Deployment was authorized and completed at https://fit.vladpalacio.com.

- Worker: fit-vlad. Version: ef73fff6-4fe7-4e34-880c-39b94cb75be1.
- D1: fit-vlad, 98062bca-1944-4ae0-b53b-9416a463b813. All four migrations applied.
- Configuration: wrangler.production.jsonc; build with FIT_WRANGLER_CONFIG set to that file.
- Custom domain enabled; workers.dev and preview URLs disabled.
- Owner identity and existing workout transferred with stable IDs. One workout and five session exercises; no sets or body-weight entries were present. No local sessions, password account, OTPs, or test fixtures were imported.
- A new production auth secret was uploaded. LOCAL_SETUP_TOKEN is absent. Email binding is restricted to the verified owner destination.
- Local backup: ignored work/pre-deployment.sql. Keep this private.

Typecheck and seven unit tests passed. Production build and deployment succeeded. Live HTTPS checks returned 200 for the home page, plan, manifest and service worker; unauthenticated owner/sync/export returned 401; local provisioning, public signup and password login returned 404. Initial edge propagation errors cleared on the next check. Browser showed the email OTP screen. Final owner login and physical phone installation remain user/device checks.

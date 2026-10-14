# Email sign-in

FIT uses Better Auth's email OTP plugin with the Prisma adapter and local D1. Enter the owner email, request a code, then enter the six-digit code. Password sign-in and public registration are disabled. Existing sessions and training records are retained.

Codes expire after five minutes. Only the latest code works. A code can be used once. Three wrong attempts invalidate it. Better Auth stores a hash of the code. Requests have database-backed limits. The D1 rate-limit operation uses one atomic SQL statement through Prisma because Better Auth's default Prisma rate-limit update uses an interactive transaction that D1 does not support.

## Local use

Local development does not send email. `APP_ENV=local` and `OTP_DELIVERY=local-log` write the code to the local Worker console. The auth URL must also be localhost or 127.0.0.1. Run the preview with output captured if you use the automated login helpers:

```powershell
npm run preview *> work/otp-preview.log
```

Use the owner email in `.dev.vars`. Read the latest `[FIT LOCAL OTP]` entry in `work/otp-preview.log` after requesting a code. This file is ignored by Git. The current test address cannot receive real email. Production never uses this log delivery path.

Run `node scripts/otp-smoke.mjs` for the focused auth checks. It changes only local auth records, not training data. Browser and API test helpers now use OTP. Run destructive acceptance fixtures only in a separate test database.

## Cloudflare setup, when deployment is authorized

Sending to a verified destination address is free on all Cloudflare plans. Sending to arbitrary recipients requires a paid plan. FIT restricts the email binding to the verified owner address. See [Cloudflare pricing](https://developers.cloudflare.com/email-service/platform/pricing/).

1. Confirm the real owner email and verify it as a Cloudflare destination address.
2. Configure the sender under a Cloudflare-managed domain. Preserve the existing Zoho mail records. Use a separate mail subdomain if routing setup requires different MX records.
3. Set `OWNER_EMAIL`, `EMAIL_FROM`, and the `EMAIL` binding destination in the production config example. Set `OTP_DELIVERY=cloudflare` and `APP_ENV=production`.
4. Provision the same owner identity in the production database. Keep public signup disabled.
5. After deployment is authorized, test actual email delivery and login on the phone.

No remote email setup, DNS changes, deployment, or real email send was performed during local implementation. Sender setup and inbox delivery remain untested.

References: [Better Auth email OTP](https://better-auth.com/docs/plugins/email-otp), [Cloudflare Worker email API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/).

## Live local test confirmed — 2026-10-14

The owner authorized a real email test and confirmed receipt. The current local preview uses ignored wrangler.live-local.jsonc. The email binding is remote and restricted to the verified owner destination; the database remains local. The existing local owner now uses the verified email, with the same user ID and records. Normal wrangler.jsonc still selects local log delivery.

To restart the live-email preview:

```powershell
$env:FIT_WRANGLER_CONFIG='wrangler.live-local.jsonc'
npm run build
npm run preview *> work/live-email-preview.log
```

Do not run automated OTP or destructive acceptance scripts with this profile. Use a separate test database and local log delivery for those tests. The old local-credentials.json file is a test fixture, not the current owner login. No DNS changes or production deployment were needed for this test.

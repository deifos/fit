# FIT VLAD implementation task

Build the application described in docs/TECHNICAL_HANDOFF.md inside this repository.

Read the full handoff before editing. Inspect assets/reference/approved-design-reference.png. Preserve the docs and supplied assets. Use TanStack Start, React, TypeScript, shadcn/ui, Tailwind CSS, Recharts, Prisma, Better Auth, and Cloudflare Workers. Do not replace Prisma with Drizzle.

Use a local SQLite database through Wrangler local D1 emulation during development. Do not create remote D1, deploy, or change DNS until Vlad is ready. The target production address is fit.vladpalacio.com. October 14, 2026 is the intended deployment date, not an automatic scheduled action.

First verify Prisma and Better Auth against the local Worker runtime. Pin compatible package versions. Then implement the responsive application, exact three-phase plan, workout logs, exercise illustrations, history, Recharts views, optional dated body-weight entries, installable PWA, offline queue, and export.

Use pounds. Keep body weight separate from exercise load. Support phone, tablet, and desktop. Do not insert sample lifting records into the real account.

Review assets/README.md and assets/manifest.json. Generated exercise illustrations are drafts. Correct and review them before using them as technique guides. The app must show the correct illustration for each exercise variant.

Test the failure cases in the handoff, including an offline reload, a lost server acknowledgement, conflicting edits, deleted records, sign-out with pending data, and an app update during a workout. Record test results and any remaining limits in docs/IMPLEMENTATION_STATUS.md.

Do not ask Vlad to repeat decisions already captured here. Ask only for missing production identity or service configuration when that information is actually required.


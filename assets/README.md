# FIT VLAD asset guide

The supplied mockup in reference/approved-design-reference.png is the main design reference. It was copied without changes.

## Included files

- hero/gym-banner.png: generated gym photograph for the dashboard. Put heading text in HTML.
- brand/wordmark.svg: editable wordmark for the dark sidebar. Adjust its fill for a light header.
- brand/app-icon.svg: geometric FV app mark.
- brand/icon-192.png and brand/icon-512.png: install icons.
- brand/maskable-512.png: app mark with maskable safe-area spacing.
- brand/apple-touch-icon.png: 180 px fallback icon.
- brand/tokens.css: initial design tokens.
- brand/manifest.example.webmanifest: manifest template, not a deployed manifest.
- exercises/*.png: nine draft sheets covering 38 exercise variants, including movement sequences.
- manifest.json: paths, prompts, generation method, and review status.
- exercise-index.json: stable exercise IDs and sheet row locations.
- gallery.html: local visual index.

The generated banner and sheets used the built-in image_gen tool. The original vector brand assets were drawn in code. The raster icons were rendered from matching geometric shapes. No external stock photo or font files are included.

## Exercise review

All exercise sheets remain draft art. Inspect the actual row before extracting it. Row numbers are one-based from the top. Get-up is a seven-position sheet, not seven exercise rows.

Known review points:
- Use back-v2.png. Its pulldown now has a front view. back.png is a superseded draft and must not be used.
- The Romanian deadlift row changes camera angle between poses.
- Check hand placement and bell position in kettlebell rack and overhead poses.
- Check side consistency and the transition sequence in the Turkish get-up.
- Calf raises use a barbell in the draft. Keep that variation distinct from a machine version.
- Muscle colors are illustrative and are not validated anatomy labels.
- START and END describe the pictured movement phase. A full repetition also includes the return phase.

The final app needs separate reviewed images for each exercise. Do not ship sheets as small thumbnails or claim that the drafts are certified technique instruction. Store technique source URLs and review status. Regenerate any incorrect pose. Use image_gen for raster edits unless the user requests a different process.

Use text labels for muscles in the first implementation. A detailed muscle diagram is not required to log workouts. Use Lucide for interface icons.

## Asset use

Copy reviewed production assets into public/assets. Keep these originals in assets. Reserve explicit image dimensions in the UI to avoid layout shifts. Use responsive image sizes and lazy loading for exercise art. Cache only the active routine's assets by default.

Do not seed dates, records, chart values, or quotes from the mockup as real account content.



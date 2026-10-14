# Exercise asset review

The original images and manifest are unchanged. The application uses 38 separate WebP assets in `public/assets/exercises/`.

Each supplied sheet was inspected before extraction. The review checked exercise identity, grip, load position, equipment, body alignment, and the direction of movement. The final extracted images were inspected together after processing. `review-log.json` records each asset and its reference.

Three draft movements required replacements:

- Romanian deadlift: use a consistent side view and a clear hip hinge.
- Two-hand kettlebell swing: show the bell behind the hips in the backswing, then the standing position.
- Turkish get-up: show seven steps with the same loaded hand throughout. Correct step 3 to a straight support arm. State that the descent uses the reverse sequence.

Single and double kettlebell clean-and-press assets show the start, rack, and overhead positions. All other basic movements use start/end pairs.

The review was an AI visual review against published exercise references. It is not a coach's personal assessment or clinical validation. The dumbbell curl, EZ-bar curl, and kettlebell row links describe the related movement family; equipment and load tracking remain separate in the app. The barbell press link provides coaching context. Written instructions remain available with each illustration.

The corrected PNG source files are kept here. `scripts/prepare-assets.mjs` extracts the approved rows and builds the WebP assets. `scripts/review-assets.mjs` records reference links and creates a local contact sheet. The contact sheet is in `work/asset-contact-sheet.png`.

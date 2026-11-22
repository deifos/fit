import sharp from 'sharp';
import fs from 'node:fs';

const slugs = ['barbell-hip-thrust', 'crunch', 'dead-bug'];
for (const slug of slugs) {
  const source = `assets/reviewed/${slug}.png`;
  if (!fs.existsSync(source)) throw new Error(`Missing illustration: ${source}`);
  await sharp(source).resize({width: 1400, withoutEnlargement: true})
    .webp({quality: 88}).toFile(`public/assets/exercises/${slug}.webp`);
}
console.log('Prepared hip thrust, crunch, and dead bug images.');

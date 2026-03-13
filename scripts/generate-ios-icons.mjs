#!/usr/bin/env node
/**
 * Generate all required iOS App Icon sizes from the 512px source icon.
 * 
 * Usage:
 *   node scripts/generate-ios-icons.mjs
 * 
 * Requires: sharp (npm install sharp --save-dev)
 * 
 * Input:  public/icons/icon-512.png
 * Output: ios-icons/ directory with all sizes + Contents.json
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE = join(ROOT, 'public/icons/icon-512.png');
const OUT_DIR = join(ROOT, 'ios-icons');

// All icon sizes required by Apple (Xcode 15+)
const ICONS = [
  // iPhone Notification
  { size: 20, scale: 2, idiom: 'iphone' },
  { size: 20, scale: 3, idiom: 'iphone' },
  // iPhone Settings
  { size: 29, scale: 2, idiom: 'iphone' },
  { size: 29, scale: 3, idiom: 'iphone' },
  // iPhone Spotlight
  { size: 40, scale: 2, idiom: 'iphone' },
  { size: 40, scale: 3, idiom: 'iphone' },
  // iPhone App
  { size: 60, scale: 2, idiom: 'iphone' },
  { size: 60, scale: 3, idiom: 'iphone' },
  // iPad Notification
  { size: 20, scale: 1, idiom: 'ipad' },
  { size: 20, scale: 2, idiom: 'ipad' },
  // iPad Settings
  { size: 29, scale: 1, idiom: 'ipad' },
  { size: 29, scale: 2, idiom: 'ipad' },
  // iPad Spotlight
  { size: 40, scale: 1, idiom: 'ipad' },
  { size: 40, scale: 2, idiom: 'ipad' },
  // iPad App
  { size: 76, scale: 1, idiom: 'ipad' },
  { size: 76, scale: 2, idiom: 'ipad' },
  // iPad Pro App
  { size: 83.5, scale: 2, idiom: 'ipad' },
  // App Store
  { size: 1024, scale: 1, idiom: 'ios-marketing' },
];

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`❌ Source icon not found: ${SOURCE}`);
    console.error('   Please place a 512x512 (or larger) PNG at public/icons/icon-512.png');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`📁 Output: ${OUT_DIR}\n`);

  const images = [];

  for (const icon of ICONS) {
    const pixels = Math.round(icon.size * icon.scale);
    const filename = `icon-${icon.size}x${icon.size}@${icon.scale}x.png`;
    const outPath = join(OUT_DIR, filename);

    await sharp(SOURCE)
      .resize(pixels, pixels, { fit: 'cover', kernel: 'lanczos3' })
      .png({ quality: 100 })
      .toFile(outPath);

    images.push({
      filename,
      idiom: icon.idiom,
      scale: `${icon.scale}x`,
      size: `${icon.size}x${icon.size}`,
    });

    console.log(`  ✅ ${filename} (${pixels}x${pixels}px)`);
  }

  // Generate Contents.json for Xcode asset catalog
  const contents = {
    images,
    info: {
      author: 'generate-ios-icons',
      version: 1,
    },
  };

  await writeFile(
    join(OUT_DIR, 'Contents.json'),
    JSON.stringify(contents, null, 2)
  );

  console.log(`\n✅ Generated ${ICONS.length} icons + Contents.json`);
  console.log('\n📋 Next steps:');
  console.log('   1. Copy ios-icons/ contents to:');
  console.log('      ios/App/App/Assets.xcassets/AppIcon.appiconset/');
  console.log('   2. Open Xcode and verify icons appear correctly');
}

main().catch(console.error);

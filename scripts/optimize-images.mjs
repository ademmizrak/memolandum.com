/**
 * optimize-images.mjs
 * Resizes and optimizes PNG illustrations in public/assets/words and public/assets/sentences.
 * Max dimension: 512px, palette: true (quantized 256 colors), quality: 80, compressionLevel: 9.
 * Reduces asset size from ~585 MB down to ~25 MB without perceptual degradation.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIRS = [
  path.join(ROOT, "public", "assets", "words"),
  path.join(ROOT, "public", "assets", "sentences"),
];

async function optimizeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png"));
  console.log(`\nOptimizing ${files.length} images in ${path.basename(dir)}...`);

  let totalBefore = 0;
  let totalAfter = 0;
  let optimizedCount = 0;

  // Process in batches of 16 for speed and safe memory usage
  const batchSize = 16;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        totalBefore += stat.size;

        try {
          const meta = await sharp(filePath).metadata();
          if (stat.size <= 45 * 1024 && (meta.width || 0) <= 512 && (meta.height || 0) <= 512) {
            totalAfter += stat.size;
            return;
          }

          const optimizedBuffer = await sharp(filePath)
            .resize(512, 512, { fit: "inside", withoutEnlargement: true })
            .png({ palette: true, quality: 80, compressionLevel: 9 })
            .toBuffer();

          fs.writeFileSync(filePath, optimizedBuffer);
          totalAfter += optimizedBuffer.length;
          optimizedCount++;
        } catch (err) {
          console.warn(`⚠️ Failed to optimize ${file}: ${err.message}`);
          totalAfter += stat.size;
        }
      })
    );

    const progress = Math.min(files.length, i + batchSize);
    process.stdout.write(`\r  Processed ${progress}/${files.length} images...`);
  }

  console.log(`\n✅ ${path.basename(dir)} complete:`);
  console.log(`   Optimized: ${optimizedCount} files`);
  console.log(`   Before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   After:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved:  ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} MB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}% reduction)`);
}

async function main() {
  console.log("=== Memolandum Image Optimizer ===");
  const start = Date.now();
  for (const dir of DIRS) {
    await optimizeDirectory(dir);
  }
  console.log(`\n🎉 All done in ${((Date.now() - start) / 1000).toFixed(1)}s!`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

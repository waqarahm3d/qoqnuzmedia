/**
 * MEDIA UPLOAD SCRIPT
 *
 * Uploads media files from local export to Supabase Storage
 *
 * Usage:
 * node migration/06_upload_media.js [bucket-name] [source-directory]
 *
 * Examples:
 * node migration/06_upload_media.js audio ./migration/media_export/audio
 * node migration/06_upload_media.js album-covers ./migration/media_export/album_covers
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Upload configuration
const UPLOAD_CONFIG = {
  // Number of parallel uploads
  concurrency: 5,

  // Retry failed uploads
  retries: 3,

  // Delay between retries (ms)
  retryDelay: 2000,

  // Skip existing files
  skipExisting: true,

  // File size limit (bytes) - 100MB
  maxFileSize: 100 * 1024 * 1024
};

// MIME type mapping
const MIME_TYPES = {
  // Audio
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',

  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function checkFileExists(bucket, fileName) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: fileName
      });

    return !error && data && data.length > 0;
  } catch {
    return false;
  }
}

async function uploadFile(bucket, filePath, fileName, retryCount = 0) {
  try {
    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > UPLOAD_CONFIG.maxFileSize) {
      throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Skip if exists
    if (UPLOAD_CONFIG.skipExisting) {
      const exists = await checkFileExists(bucket, fileName);
      if (exists) {
        return { success: true, skipped: true };
      }
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: getMimeType(filePath),
        upsert: true,
        cacheControl: '31536000' // 1 year
      });

    if (error) throw error;

    return { success: true, data };

  } catch (error) {
    // Retry on failure
    if (retryCount < UPLOAD_CONFIG.retries) {
      await new Promise(resolve => setTimeout(resolve, UPLOAD_CONFIG.retryDelay));
      return uploadFile(bucket, filePath, fileName, retryCount + 1);
    }

    return { success: false, error: error.message };
  }
}

async function uploadBatch(bucket, files, startIndex) {
  const batch = files.slice(startIndex, startIndex + UPLOAD_CONFIG.concurrency);
  const results = await Promise.all(
    batch.map(async (filePath) => {
      const fileName = path.basename(filePath);
      const result = await uploadFile(bucket, filePath, fileName);

      if (result.success) {
        if (result.skipped) {
          console.log(`⏭️  Skipped (exists): ${fileName}`);
        } else {
          console.log(`✅ Uploaded: ${fileName}`);
        }
      } else {
        console.error(`❌ Failed: ${fileName} - ${result.error}`);
      }

      return { fileName, ...result };
    })
  );

  return results;
}

async function uploadDirectory(bucket, sourceDir) {
  console.log(`\n📦 Uploading files from ${sourceDir} to bucket "${bucket}"\n`);

  // Find all files
  const pattern = `${sourceDir}/**/*.*`;
  const files = glob.sync(pattern).filter(f => fs.statSync(f).isFile());

  console.log(`Found ${files.length} files to upload\n`);

  if (files.length === 0) {
    console.log('⚠️  No files found!');
    return;
  }

  const startTime = Date.now();
  const results = {
    total: files.length,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  // Upload in batches
  for (let i = 0; i < files.length; i += UPLOAD_CONFIG.concurrency) {
    const batchNum = Math.floor(i / UPLOAD_CONFIG.concurrency) + 1;
    const totalBatches = Math.ceil(files.length / UPLOAD_CONFIG.concurrency);

    console.log(`\n📊 Batch ${batchNum}/${totalBatches}`);

    const batchResults = await uploadBatch(bucket, files, i);

    // Aggregate results
    batchResults.forEach(result => {
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.uploaded++;
        }
      } else {
        results.failed++;
        results.errors.push({
          file: result.fileName,
          error: result.error
        });
      }
    });

    // Progress
    const processed = Math.min(i + UPLOAD_CONFIG.concurrency, files.length);
    const percent = ((processed / files.length) * 100).toFixed(1);
    console.log(`Progress: ${processed}/${files.length} (${percent}%)`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files: ${results.total}`);
  console.log(`✅ Uploaded: ${results.uploaded}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏱️  Duration: ${duration}s`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });

    // Save errors to file
    fs.writeFileSync(
      `./migration/upload_errors_${bucket}.json`,
      JSON.stringify(results.errors, null, 2)
    );
    console.log(`\n💾 Errors saved to upload_errors_${bucket}.json`);
  }

  console.log('='.repeat(60) + '\n');

  return results;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node 06_upload_media.js [bucket-name] [source-directory]');
    console.log('\nAvailable buckets:');
    console.log('  - audio');
    console.log('  - album-covers');
    console.log('  - artist-images');
    console.log('  - playlist-covers');
    console.log('  - avatars');
    console.log('\nExample:');
    console.log('  node migration/06_upload_media.js audio ./migration/media_export/audio');
    process.exit(1);
  }

  const [bucket, sourceDir] = args;

  // Verify directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Directory not found: ${sourceDir}`);
    process.exit(1);
  }

  console.log('🚀 Starting media upload...');
  console.log(`Bucket: ${bucket}`);
  console.log(`Source: ${sourceDir}`);
  console.log(`Concurrency: ${UPLOAD_CONFIG.concurrency}`);
  console.log(`Max retries: ${UPLOAD_CONFIG.retries}`);
  console.log(`Skip existing: ${UPLOAD_CONFIG.skipExisting}`);

  await uploadDirectory(bucket, sourceDir);

  console.log('✅ Upload complete!\n');
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

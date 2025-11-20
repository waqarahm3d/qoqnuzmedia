/**
 * USER MIGRATION SCRIPT
 *
 * Migrates users from old platform to new platform using Supabase Admin API
 *
 * Requirements:
 * - SUPABASE_URL (new project)
 * - SUPABASE_SERVICE_ROLE_KEY (new project)
 * - CSV file with user data
 *
 * Usage:
 * node migration/03_migrate_users.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_FILE = './migration/export_users.csv';

// Initialize Supabase Admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration options
const MIGRATION_OPTIONS = {
  // Should users be required to reset password?
  requirePasswordReset: false,

  // Send email verification?
  sendEmailVerification: false,

  // Default password for migrated users (they'll need to reset)
  defaultPassword: 'ChangeMe123!',

  // Batch size for processing
  batchSize: 100,

  // Delay between batches (ms) to avoid rate limiting
  batchDelay: 1000
};

async function migrateUsers() {
  console.log('🚀 Starting user migration...\n');

  const users = [];

  // Read CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => users.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Found ${users.length} users to migrate\n`);

  const results = {
    total: users.length,
    succeeded: 0,
    failed: 0,
    errors: []
  };

  // Process users in batches
  for (let i = 0; i < users.length; i += MIGRATION_OPTIONS.batchSize) {
    const batch = users.slice(i, i + MIGRATION_OPTIONS.batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / MIGRATION_OPTIONS.batchSize) + 1}/${Math.ceil(users.length / MIGRATION_OPTIONS.batchSize)}`);

    await Promise.all(
      batch.map(async (user) => {
        try {
          // Create user in new platform
          const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: MIGRATION_OPTIONS.defaultPassword,
            email_confirm: !MIGRATION_OPTIONS.sendEmailVerification,
            user_metadata: {
              migrated_from: 'play.qoqnuz.com',
              original_user_id: user.id,
              migrated_at: new Date().toISOString()
            }
          });

          if (error) throw error;

          // Map old user ID to new user ID for data relationships
          console.log(`✅ ${user.email} - Migrated successfully`);

          // Store ID mapping for later use
          await fs.promises.appendFile(
            './migration/user_id_mapping.csv',
            `${user.id},${data.user.id}\n`
          );

          results.succeeded++;

        } catch (error) {
          console.error(`❌ ${user.email} - Failed: ${error.message}`);
          results.failed++;
          results.errors.push({
            email: user.email,
            error: error.message
          });
        }
      })
    );

    // Delay between batches
    if (i + MIGRATION_OPTIONS.batchSize < users.length) {
      console.log(`⏳ Waiting ${MIGRATION_OPTIONS.batchDelay}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, MIGRATION_OPTIONS.batchDelay));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total users: ${results.total}`);
  console.log(`✅ Succeeded: ${results.succeeded}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(err => {
      console.log(`  - ${err.email}: ${err.error}`);
    });

    // Save errors to file
    await fs.promises.writeFile(
      './migration/migration_errors.json',
      JSON.stringify(results.errors, null, 2)
    );
    console.log('\n💾 Errors saved to migration_errors.json');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Send password reset emails to all migrated users');
  console.log('2. Update user_id references in profiles, playlists, etc.');
  console.log('3. Use user_id_mapping.csv to update relationships');
  console.log('4. Notify users about the migration\n');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run migration
migrateUsers()
  .then(() => {
    console.log('✅ Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

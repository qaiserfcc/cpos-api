#!/usr/bin/env node

/**
 * Seed Runner for Vercel Deployment
 * This script handles database seeding automatically during deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runSeeds() {
  console.log('🌱 Starting database seeding...');

  try {
    const databaseUrl = process.env.DATABASE_URL;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Check if seeds should run (only in production or when explicitly requested)
    const shouldRunSeeds = isProduction || process.env.RUN_SEEDS === 'true';

    if (!shouldRunSeeds) {
      console.log('⏭️ Skipping seeds (not in production or RUN_SEEDS not set)');
      return true;
    }

    // Check if initialdb.sql exists and run it
    const initialDbPath = path.join(__dirname, '..', 'initialdb.sql');
    if (fs.existsSync(initialDbPath)) {
      console.log('📄 Running initial database setup...');

      // Use psql to run the SQL file
      const psqlCommand = `psql "${databaseUrl}" -f "${initialDbPath}"`;
      execSync(psqlCommand, { stdio: 'inherit' });

      console.log('✅ Initial database setup completed!');
    }

    // Check if Prisma seeds exist
    const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaSchemaPath)) {
      const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');

      // Check if seed configuration exists in schema
      if (schemaContent.includes('seed.ts') || schemaContent.includes('seed.js')) {
        console.log('🌱 Running Prisma seeds...');
        execSync('npx prisma db seed', { stdio: 'inherit' });
        console.log('✅ Prisma seeds completed!');
      }
    }

    // Run custom seed files if they exist
    const seedsDir = path.join(__dirname, '..', 'prisma', 'seeds');
    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir).filter(file =>
        file.endsWith('.js') || file.endsWith('.ts')
      );

      for (const seedFile of seedFiles) {
        console.log(`🌱 Running custom seed: ${seedFile}`);
        const seedPath = path.join(seedsDir, seedFile);
        execSync(`node "${seedPath}"`, { stdio: 'inherit' });
      }
    }

    console.log('✅ All seeding completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);

    // In production, log the error but don't fail the deployment
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Continuing deployment despite seeding failure...');
      return false;
    }

    process.exit(1);
  }
}

// Run seeds if this script is executed directly
if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };
#!/usr/bin/env node

/**
 * Migration Runner for Vercel Deployment
 * This script handles database migrations automatically during deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  try {
    // Check if we're in production (Vercel environment)
    const isProduction = process.env.NODE_ENV === 'production';
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('📦 Installing Prisma CLI...');
    execSync('npm install prisma --save-dev', { stdio: 'inherit' });

    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    if (isProduction) {
      console.log('🏗️ Running production migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } else {
      console.log('🏗️ Running development migrations...');
      execSync('npx prisma migrate dev --name auto-deploy', { stdio: 'inherit' });
    }

    console.log('✅ Migrations completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // In production, we might want to continue with deployment even if migrations fail
    // But for safety, we'll exit with error
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Continuing deployment despite migration failure...');
      return false;
    }

    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
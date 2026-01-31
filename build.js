#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🏗️  Building project for production...\n');

try {
  // 1. Verify essential files exist
  console.log('✓ Checking essential files...');
  const requiredFiles = [
    'package.json',
    'public/index.html',
    'index.js',
    'api/index.js'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
  
  // config.env is optional (only needed locally, not on Railway)
  const configEnvPath = path.join(__dirname, 'config.env');
  const hasConfigEnv = fs.existsSync(configEnvPath);
  
  if (hasConfigEnv) {
    console.log('  All essential files present (including config.env)\n');
  } else {
    console.log('  All essential files present');
    console.log('  ℹ️  Note: config.env not found (expected on Railway, use environment variables instead)\n');
  }

  // 2. Verify node_modules is installed
  console.log('✓ Checking dependencies...');
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    throw new Error('node_modules not found. Run "npm install" first.');
  }
  console.log('  Dependencies installed\n');

  // 3. Verify API structure
  console.log('✓ Verifying API structure...');
  const apiIndexPath = path.join(__dirname, 'api', 'index.js');
  const apiIndex = fs.readFileSync(apiIndexPath, 'utf-8');
  if (!apiIndex.includes('export default')) {
    throw new Error('api/index.js must have an export default statement');
  }
  console.log('  API structure verified\n');

  // 4. Verify railway.json exists
  console.log('✓ Checking Railway configuration...');
  const railwayPath = path.join(__dirname, 'railway.json');
  if (!fs.existsSync(railwayPath)) {
    throw new Error('railway.json not found');
  }
  const railwayConfig = JSON.parse(fs.readFileSync(railwayPath, 'utf-8'));
  console.log('  Railway configuration valid\n');

  // 5. Check environment variables
  console.log('✓ Checking environment variables...');
  
  if (hasConfigEnv) {
    const configEnv = fs.readFileSync(configEnvPath, 'utf-8');
    const requiredEnvVars = [
      'MONGO_URL',
      'JWT_SECRET',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'STRIPE_PUBLIC_KEY',
      'STRIPE_SECRET_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!configEnv.includes(envVar)) {
        console.warn(`  ⚠️  Warning: Missing ${envVar} in config.env`);
      }
    }
    console.log('  Environment variables checked\n');
  } else {
    console.log('  ℹ️  config.env not found (expected on Railway)');
    console.log('  Environment variables will be loaded from Railway dashboard\n');
  }

  // 6. Verify public assets exist
  console.log('✓ Verifying public assets...');
  const publicDir = path.join(__dirname, 'public');
  const publicFiles = fs.readdirSync(publicDir);
  if (!publicFiles.includes('index.html')) {
    throw new Error('public/index.html not found');
  }
  console.log(`  Found ${publicFiles.length} public assets\n`);

  // 7. Verify routers exist
  console.log('✓ Checking routers...');
  const routersDir = path.join(__dirname, 'routers');
  const routers = fs.readdirSync(routersDir);
  console.log(`  Found ${routers.length} routers\n`);

  // 8. Verify controllers exist
  console.log('✓ Checking controllers...');
  const controllersDir = path.join(__dirname, 'controllers');
  const controllers = fs.readdirSync(controllersDir);
  console.log(`  Found ${controllers.length} controllers\n`);

  // 9. Verify database schemas exist
  console.log('✓ Checking database schemas...');
  const schemasDir = path.join(__dirname, 'schemas');
  const schemas = fs.readdirSync(schemasDir);
  console.log(`  Found ${schemas.length} schemas\n`);

  // 10. Production build summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ BUILD SUCCESSFUL\n');
  console.log('Project is ready for production deployment!\n');
  console.log('Summary:');
  console.log(`  📦 Dependencies: ${Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')).dependencies).length} packages`);
  console.log(`  📄 Public assets: ${publicFiles.length} files`);
  console.log(`  🛣️  Routers: ${routers.length}`);
  console.log(`  ⚙️  Controllers: ${controllers.length}`);
  console.log(`  💾 Schemas: ${schemas.length}`);
  console.log('  🌐 Entry point: api/index.js');
  console.log('  🏠 Home page: public/index.html\n');
  console.log('Next steps:');
  console.log('  1. Ensure all environment variables are set in Railway Dashboard');
  console.log('  2. Push changes to GitHub');
  console.log('  3. Deploy to Railway\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
} catch (error) {
  console.error('\n❌ BUILD FAILED\n');
  console.error(`Error: ${error.message}\n`);
  console.error('Please fix the issues above and try again.\n');
  process.exit(1);
}

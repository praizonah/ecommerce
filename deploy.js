#!/usr/bin/env node

/**
 * Vercel Deployment Setup Guide
 * This script provides instructions for automatic deployment to Vercel
 */

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║          VERCEL AUTOMATIC DEPLOYMENT - SETUP GUIDE             ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n');

console.log('✅ Your code is already on GitHub!');
console.log('   Repository: https://github.com/praizonah/ecommerce');
console.log('   Branch: main\n');

console.log('📋 STEP-BY-STEP AUTOMATIC DEPLOYMENT:\n');

console.log('STEP 1: Go to Vercel Dashboard');
console.log('   → Open: https://vercel.com/dashboard\n');

console.log('STEP 2: Import Project');
console.log('   → Click: "Add New" → "Project"');
console.log('   → Click: "Import Git Repository"');
console.log('   → Search: "ecommerce"');
console.log('   → Select: "praizonah/ecommerce"\n');

console.log('STEP 3: Configure Project');
console.log('   → Framework Preset: "Other"');
console.log('   → Root Directory: "./"');
console.log('   → Build Command: "npm run build"');
console.log('   → Output Directory: (leave empty)');
console.log('   → Install Command: "npm install"\n');

console.log('STEP 4: Add Environment Variables');
console.log('   → Click: "Environment Variables"');
console.log('   → Add all 15 variables:\n');

const envVars = [
  'MONGO_URL',
  'PASSWS',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'FRONTEND_URL',
  'STRIPE_PUBLIC_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY'
];

envVars.forEach((v, i) => {
  console.log(`   ${i + 1}. ${v}`);
});

console.log('\n   ⚠️  Get values from your config.env file\n');

console.log('STEP 5: Deploy');
console.log('   → Click: "Deploy" button');
console.log('   → Wait for build to complete (2-5 minutes)');
console.log('   → You\'ll see: "Ready" status ✅\n');

console.log('STEP 6: Verify Deployment');
console.log('   → Visit your URL: https://ecommerce.vercel.app');
console.log('   → Test: https://ecommerce.vercel.app/health');
console.log('   → Should return: {"status":"ok",...}\n');

console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('💡 AUTOMATIC UPDATES FROM NOW ON:\n');
console.log('   ✅ Every time you push to GitHub (git push)');
console.log('   ✅ Vercel automatically detects the change');
console.log('   ✅ Vercel automatically rebuilds your app');
console.log('   ✅ Your app updates within 2-5 minutes\n');

console.log('🔄 NO MANUAL DEPLOYMENT NEEDED AGAIN!\n');

console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('📚 QUICK REFERENCE:\n');
console.log('   Config File: vercel.json ✅');
console.log('   Entry Point: api/index.js ✅');
console.log('   Home Page: public/index.html ✅');
console.log('   Build Script: npm run build ✅');
console.log('   Dependencies: npm install ✅\n');

console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('⏱️  TIME TO DEPLOYMENT: ~5 minutes\n');
console.log('🎯 RESULT: Your app will be LIVE at ecommerce.vercel.app\n');

console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('✨ Ready to deploy? Go to: https://vercel.com/dashboard\n');

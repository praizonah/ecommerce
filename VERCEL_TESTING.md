# Vercel Deployment - Complete Testing Checklist

## Pre-Deployment Verification

### ✅ Configuration Files
- [x] `vercel.json` - Simplified and optimized
- [x] `.vercelignore` - Configured to exclude unnecessary files
- [x] `package.json` - Updated with proper scripts
- [x] `build.js` - Production build verification script

### ✅ Application Files
- [x] `api/index.js` - Vercel serverless entry point
- [x] `index.js` - Local development entry point
- [x] `public/index.html` - Home page configured

### ✅ All Required Dependencies
```
✓ express (v5.2.1)
✓ mongoose (v9.0.0)
✓ dotenv (v17.2.3)
✓ cors (v2.8.5)
✓ jsonwebtoken (v9.0.3)
✓ passport (v0.7.0)
✓ stripe (v20.2.0)
✓ nodemailer (v7.0.12)
✓ All other dependencies
```

---

## Vercel Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure for Vercel production deployment"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository (ecommerce)
4. Select project from list
5. Click "Import"

### Step 3: Configure Project Settings
- **Framework Preset**: Other (Node.js)
- **Root Directory**: ./
- **Build Command**: `npm run build`
- **Output Directory**: (leave blank for serverless)
- **Install Command**: `npm install`

### Step 4: Add Environment Variables
Go to Settings → Environment Variables and add ALL of these:

```
MONGO_URL = your_mongodb_connection_string
PASSWS = your_password
JWT_SECRET = your_jwt_secret_key
JWT_EXPIRES_IN = 7d
EMAIL_USER = your_email@gmail.com
EMAIL_PASSWORD = your_app_password
FRONTEND_URL = https://ecommerce.vercel.app (update with your URL)
STRIPE_PUBLIC_KEY = pk_test_...
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_test_...
RESEND_API_KEY = re_...
EMAILJS_SERVICE_ID = service_...
EMAILJS_TEMPLATE_ID = template_...
EMAILJS_PUBLIC_KEY = your_public_key
EMAILJS_PRIVATE_KEY = your_private_key
```

### Step 5: Deploy
Click **Deploy** button and wait for completion.

---

## What Vercel Will Do

1. ✅ Clone your GitHub repository
2. ✅ Install dependencies with `npm install`
3. ✅ Run build verification with `npm run build`
4. ✅ Create serverless function from `api/index.js`
5. ✅ Serve static files from `public/` directory
6. ✅ Route all requests through Express app
7. ✅ Serve `index.html` as home page
8. ✅ Provide a unique URL: `https://ecommerce.vercel.app`

---

## Critical Configuration Details

### Serverless Function
- **Entry Point**: `api/index.js`
- **Memory**: 1024 MB
- **Timeout**: 60 seconds
- **Environment**: Node.js

### Routing
- **API Routes**: `/api/v1/*` → Express routes
- **Static Files**: Served from `public/` directory
- **Home Page**: `/` → `public/index.html`
- **SPA Fallback**: All unknown routes → `public/index.html`

### CORS Configuration
```javascript
const allowedOrigins = [
  'http://127.0.0.1:5500', 
  'http://localhost:5500',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);
```

---

## Testing Your Deployment

### 1. Health Check Endpoint
```bash
curl https://ecommerce.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T10:30:00.000Z"
}
```

### 2. Home Page
```bash
curl https://ecommerce.vercel.app/
```

Should return `public/index.html` content

### 3. API Routes
```bash
# Test any API route, e.g.:
curl https://ecommerce.vercel.app/api/v1/products
```

Should return product data from MongoDB

### 4. SPA Fallback
```bash
curl https://ecommerce.vercel.app/any-non-existent-route
```

Should return `public/index.html` (for client-side routing)

---

## Common Issues & Solutions

### Issue: "Cannot find module"
**Solution**: Verify all imports use `../` path correctly in `api/index.js`

### Issue: "Static files not loading"
**Solution**: Check that all files are in `public/` directory and paths are absolute with `path.join(__dirname, '../public')`

### Issue: "Database connection fails"
**Solution**: 
1. Verify MongoDB Atlas whitelist includes Render IP (0.0.0.0/0)
2. Check MONGO_URL is correct in environment variables
3. Confirm MongoDB credentials are valid

### Issue: "CORS errors"
**Solution**: Update `FRONTEND_URL` in environment variables to your Vercel URL

### Issue: "Environment variables not loading"
**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all variables are present
3. Click **Redeploy** after adding variables

### Issue: "Index.html not serving"
**Solution**: Ensure the fallback route `app.get('*', ...)` is at the END of all route definitions

---

## File Structure for Vercel

```
ecommerce/
├── api/
│   └── index.js              ← Vercel serverless function
├── public/
│   ├── index.html            ← Home page
│   ├── login.html
│   ├── register.html
│   └── ... (other HTML files)
├── controllers/
│   ├── userController.js
│   ├── productsControllers.js
│   └── ...
├── routers/
│   ├── userRouters.js
│   └── ...
├── schemas/
│   └── ...
├── utils/
│   └── ...
├── index.js                  ← Local dev entry point
├── vercel.json              ← Vercel config ✓
├── package.json             ← Scripts configured ✓
├── .vercelignore            ← Configured ✓
├── build.js                 ← Build verification ✓
└── config.env               ← Local only (not deployed)
```

---

## Performance Optimization

### Memory Usage
- Default: 1024 MB (good for most apps)
- No file system (serverless limitation)
- Connection pooling recommended for MongoDB

### Timeout
- Default: 60 seconds
- API calls should complete within this time
- Stripe webhooks are processed asynchronously

### Cold Start
- First request after deployment may be slower
- Subsequent requests are fast
- Vercel caches connections

---

## Post-Deployment

### Update FRONTEND_URL
After deployment, update the `FRONTEND_URL` environment variable:
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Update `FRONTEND_URL` = `https://ecommerce.vercel.app`
4. Click **Redeploy** in Deployments tab

### Monitor Logs
1. Go to Vercel Dashboard
2. Click your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. View real-time logs

### Set Up Analytics (Optional)
1. Vercel Dashboard → Analytics tab
2. Monitor performance metrics
3. Track API requests and response times

---

## Troubleshooting Checklist

Before contacting support:

- [ ] All environment variables are set in Vercel Dashboard
- [ ] MongoDB Atlas whitelist includes 0.0.0.0/0
- [ ] `FRONTEND_URL` matches your Vercel deployment URL
- [ ] `npm run build` passes locally
- [ ] All dependencies are in `package.json`
- [ ] No hardcoded paths - all use `path.join(__dirname, ...)`
- [ ] `api/index.js` exports `default app`
- [ ] Static files are in `public/` directory
- [ ] No `.env` or `config.env` deployed (in .vercelignore)

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Node.js Guide**: https://vercel.com/docs/concepts/nodejs/nodejs-runtime
- **Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Troubleshooting**: https://vercel.com/support

---

## Success Indicators

When deployment is successful, you should see:

✅ Green checkmark on deployment
✅ Application loads at https://ecommerce.vercel.app
✅ `index.html` is the home page
✅ API routes respond correctly
✅ Static files load properly
✅ Health check returns 200 OK
✅ No console errors in browser

---

**Last Updated**: January 29, 2026
**Version**: 1.0
**Status**: Ready for Production

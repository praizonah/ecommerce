# Vercel Deployment Configuration - Complete Guide

## ✅ Pre-Deployment Checklist

### 1. GitHub Setup
- [x] Project is committed to Git
- [x] No sensitive data in `.gitignore` (config.env is excluded)
- [x] `.env.example` file exists with all required variables

### 2. File Structure
```
ecommerce/
├── api/
│   └── index.js              (Serverless entry point)
├── public/                   (Static files served directly)
│   ├── index.html            (SPA home page)
│   ├── *.html                (Other pages)
│   ├── *.js                  (Client scripts)
│   ├── *.css                 (Stylesheets)
│   └── images/               (Image assets)
├── controllers/              (Express request handlers)
├── routers/                  (API route definitions)
├── schemas/                  (MongoDB schemas)
├── utils/                    (Helper functions)
├── vercel.json               (Vercel configuration)
├── package.json              (Dependencies)
├── build.js                  (Build script)
├── .gitignore                (Git excludes)
├── .vercelignore             (Vercel excludes)
└── .env.example              (Environment variables template)
```

### 3. Critical Files Validated
- [x] `api/index.js` - Exports `serverless(app)` correctly
- [x] `build.js` - Build validation script
- [x] `vercel.json` - Deployment configuration with caching
- [x] `public/index.html` - SPA entry point exists
- [x] All routers properly imported
- [x] All controllers properly imported
- [x] All schemas properly imported

---

## 📋 Vercel.json Configuration Breakdown

### buildCommand
```json
"buildCommand": "npm run build"
```
- Runs validation checks before deployment
- Ensures all required files exist
- Verifies configuration is valid

### Functions Configuration
```json
"functions": {
  "api/index.js": {
    "maxDuration": 30,
    "memory": 1024
  }
}
```
- **maxDuration**: 30 seconds timeout (max for Vercel Pro)
- **memory**: 1024 MB (1 GB) for better performance
- Handles MongoDB connections efficiently

### Routes Configuration
```json
"routes": [
  {
    "src": "/api/(.*)",
    "dest": "/api/index.js",
    "cache": { "maxAge": 60 }
  },
  {
    "src": "/(.*\\.(js|css|...|)$)",
    "dest": "/public/$1",
    "cache": { "maxAge": 31536000 }
  },
  {
    "src": "/(.*)",
    "dest": "/api/index.js"
  }
]
```
- Static assets cached for 1 year (immutable)
- API responses cached for 60 seconds
- SPA fallback to index.html for all other routes

### Headers Configuration
- Sets proper `Cache-Control` headers for static assets
- Immutable assets get long-term caching
- API responses get shorter cache duration

---

## 🚀 Deployment Steps

### Step 1: Prepare Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add all variables from `.env.example`:

**Database:**
- `MONGO_URL` - Your MongoDB Atlas connection string

**Authentication:**
- `JWT_SECRET` - Any random secure string
- `JWT_EXPIRES_IN` - e.g., "7d"

**Email Service:**
- `EMAIL_USER` - Your Gmail address
- `EMAIL_PASSWORD` - Gmail app-specific password (not your regular password)

**Payment Processing:**
- `STRIPE_PUBLIC_KEY` - From Stripe Dashboard
- `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe Webhooks

**Frontend:**
- `FRONTEND_URL` - Your Vercel deployment URL (e.g., https://myapp.vercel.app)

**Optional Services:**
- `RESEND_API_KEY` - If using Resend for emails
- `EMAILJS_SERVICE_ID` - If using EmailJS
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`

**Other:**
- `PASSWS` - Password reset security string
- `NODE_ENV` - Set to "production"

### Step 2: MongoDB Atlas Configuration

1. Go to MongoDB Atlas Dashboard
2. Click **Network Access**
3. Click **Add IP Address**
4. Select **Allow Access from Anywhere** (0.0.0.0/0)
   - Or add Vercel's IP ranges if you prefer

**Important:** This must be done or database connections will fail!

### Step 3: Git Push & Deploy

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

The deployment will automatically trigger from your Vercel dashboard.

### Step 4: Monitor Deployment

1. Go to Vercel Dashboard → Deployments
2. Watch the build logs
3. Check for any errors
4. Monitor function duration and cold starts

---

## ⚡ Performance Optimization

### Cold Start Optimization
- Database connection is lazy-loaded (only on first request to `/api`)
- Static files serve without DB connection
- Health check endpoint responds immediately

### Caching Strategy
- **Static assets (JS/CSS/Images)**: 1 year cache with immutable flag
- **HTML files**: 60 second cache for SPA updates
- **API responses**: 60 second cache where applicable

### Database Connection Pooling
- maxPoolSize: 2 (serverless optimized)
- minPoolSize: 0 (disconnects when idle)
- Connection timeout: 3 seconds
- Socket timeout: 30 seconds

---

## 🔍 Verification

### Test Endpoints

After deployment, test these endpoints:

```bash
# Health check (should be instant)
curl https://your-app.vercel.app/health

# Homepage (should load SPA)
curl https://your-app.vercel.app/

# API test
curl https://your-app.vercel.app/api/v1/products/all
```

### Monitor Function Duration

1. Vercel Dashboard → Functions
2. Look at average duration
3. Should be < 500ms for static files
4. Should be < 2000ms for API calls with DB

---

## ❌ Common Issues & Fixes

### Issue: "MONGO_URL not set"
**Solution:** Add MONGO_URL to Vercel Environment Variables

### Issue: "Cannot connect to MongoDB"
**Solution:** 
1. Verify MongoDB Atlas Network Access allows 0.0.0.0/0
2. Check connection string is correct
3. Ensure credentials are valid

### Issue: "Static files not loading"
**Solution:**
1. Check public/ folder exists
2. Verify file paths are correct in HTML
3. Check .vercelignore doesn't exclude needed files

### Issue: "504 Gateway Timeout"
**Solution:**
1. Check if DB is responsive (connection timing out)
2. Increase maxDuration in vercel.json if needed
3. Check MongoDB Atlas for errors

### Issue: "Email not sending"
**Solution:**
1. Verify EMAIL_USER and EMAIL_PASSWORD
2. For Gmail: Use app-specific password, not regular password
3. Enable "Less secure app access" if not using app password

---

## 📊 Production Checklist

Before going live:

- [ ] All environment variables set in Vercel Dashboard
- [ ] MongoDB Atlas Network Access configured
- [ ] Stripe webhooks configured (if using payments)
- [ ] Email service tested and working
- [ ] CORS origins configured for your domain
- [ ] Frontend URL environment variable set correctly
- [ ] Tested all major features on live deployment
- [ ] Monitored logs for errors
- [ ] Set up Vercel analytics/monitoring

---

## 🔒 Security Notes

1. **Never commit `.env` or `config.env`** - Use Vercel Dashboard for secrets
2. **Use app-specific passwords for Gmail** - Not your regular password
3. **Keep JWT_SECRET secure** - Use a long random string
4. **Rotate Stripe keys regularly** - Use test keys for development
5. **Don't expose sensitive data in logs** - Check error messages don't leak secrets

---

## 📞 Support Resources

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Stripe Docs: https://stripe.com/docs
- Express Docs: https://expressjs.com
- Serverless HTTP: https://github.com/dougmoscrop/serverless-http

---

Generated: January 31, 2026
Last Updated: Vercel 2.0 Configuration

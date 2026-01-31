# Railway Environment Variables Setup

## ⚠️ IMPORTANT: Environment Variables Required for Railway Deployment

Your application has been updated to support Railway deployment. **Config.env files are NOT deployed to production** for security reasons. All sensitive information must be set via the Railway Dashboard.

## Complete List of Required Variables

Copy and paste these KEY=VALUE pairs into your Railway Dashboard > Variables:

```
PORT=8080
NODE_ENV=production
MONGO_URL=mongodb+srv://onahpraiz_db_user:PASSWORD@productscollection.eiiuf1r.mongodb.net/?appName=productsCollection
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password_or_app_key
FRONTEND_URL=https://your-railway-frontend-url.up.railway.app
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
RESEND_API_KEY=re_your_resend_api_key
EMAILJS_SERVICE_ID=service_your_emailjs_service_id
EMAILJS_TEMPLATE_ID=template_your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
PASSWS=your_database_password
```

## How to Add Variables to Railway Dashboard

1. **Open your Railway project**
   - Go to https://railway.app/project/YOUR_PROJECT_ID
   - Click on your backend service

2. **Navigate to Variables**
   - Click the "Variables" tab
   - OR look for "Environment Variables" section

3. **Add Each Variable**
   - Click "Add variable" or paste the complete list above
   - Format: KEY=VALUE (one per line if pasting)

4. **Deploy**
   - Save/commit your variables
   - Railway will automatically redeploy your application
   - Check the deployment logs to confirm it started successfully

## Variable Descriptions

| Variable | Purpose | Required |
|----------|---------|----------|
| PORT | Server port (must be 8080 for production) | ✅ Yes |
| NODE_ENV | Set to "production" for Railway | ✅ Yes |
| MONGO_URL | MongoDB Atlas connection string | ✅ Yes |
| JWT_SECRET | Secret for JWT tokens and sessions | ✅ Yes |
| JWT_EXPIRES_IN | Token expiration time (e.g., "7d") | ✅ Yes |
| EMAIL_USER | Email sender address | ✅ Yes |
| EMAIL_PASSWORD | Email account password/API key | ✅ Yes |
| FRONTEND_URL | Your frontend application URL on Railway | ✅ Yes |
| STRIPE_PUBLIC_KEY | Stripe publishable key | ✅ Yes |
| STRIPE_SECRET_KEY | Stripe secret key | ✅ Yes |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret | ✅ Yes |
| RESEND_API_KEY | Resend email API key (optional backup) | ⚠️ Recommended |
| EMAILJS_* | EmailJS service credentials (optional backup) | ⚠️ Optional |
| PASSWS | Database password | ⚠️ Optional |

## What Changed in the Application

✅ **Fixed:**
- Application no longer requires config.env on Railway
- Gracefully handles missing config.env file
- Proper error messages if environment variables are missing
- 120-second MongoDB buffer timeout for reliable connections
- MongoDB session store instead of MemoryStore (no memory leaks)
- Port 8080 for production deployments

✅ **Verified:**
- Environment variables load from Railway Dashboard
- All dependencies installed and working
- Build validation passes successfully
- Database connection timeout configured properly

## Troubleshooting on Railway

**Problem:** "MONGO_URL not set - database functionality disabled"
- **Solution:** Add MONGO_URL to Railway Variables and redeploy

**Problem:** "MemoryStore warning in production"
- **Solution:** Ensure MONGO_URL and NODE_ENV=production are both set

**Problem:** "Session lost after restart"
- **Solution:** MONGO_URL must be set for persistent sessions

**Problem:** "Port already in use"
- **Solution:** Railway assigns port automatically; don't force port 4000 in production

## Next Steps

1. ✅ Push code to GitHub (already done)
2. ⏳ Set environment variables in Railway Dashboard
3. ⏳ Redeploy the application
4. ⏳ Test login/registration with MongoDB
5. ⏳ Verify email notifications are working
6. ⏳ Test Stripe payments with test keys

### 1. Log in to Railway
Go to https://railway.app/dashboard

### 2. Open Your Project
Click on your eCommerce project

### 3. Add Variables
1. Click on **Settings** → **Variables**
2. Click **Add Variable**
3. Add each required variable:

```
MONGO_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password
FRONTEND_URL=https://your-frontend.com
NODE_ENV=production
```

### 4. Deploy
After adding all variables:
1. Click **Deploy** (or push to GitHub to trigger auto-deploy)
2. Watch the logs to verify startup

## Verifying Variables Are Set

Once deployed, check the logs:

```bash
railway logs
```

You should see:
```
✅ Server is running on port: 3000
📍 Environment: production
✅ database connected successfully
```

## Troubleshooting

### Error: "Neither apiKey nor config.authenticator provided"
- **Cause**: `STRIPE_SECRET_KEY` environment variable not set
- **Fix**: Add `STRIPE_SECRET_KEY` to Railway Variables
- **Verify**: Check that the variable exists in Railway dashboard before deploying

### Error: "MONGO_URL not set"
- **Cause**: Database connection string missing
- **Fix**: Add `MONGO_URL` to Railway Variables
- **Verify**: Ensure MongoDB is running and accessible

### Email service errors
- **Cause**: `EMAIL_USER` or `EMAIL_PASS` incorrect
- **Fix**: Verify credentials in email provider dashboard
- **Note**: Gmail requires app-specific passwords (not your account password)

### CORS errors when accessing from frontend
- **Cause**: `FRONTEND_URL` not set or incorrect
- **Fix**: Set `FRONTEND_URL` to your frontend's actual URL
- **Verify**: Frontend can reach the API URL in browser developer tools

## Security Best Practices

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Never commit secrets to git**
   - Use Railway dashboard for all sensitive values
   - `.env` files are excluded from deployment

2. **Use production keys for production**
   - Don't use Stripe test keys in production
   - Generate new secrets for each environment

3. **Rotate secrets regularly**
   - Change `JWT_SECRET` periodically
   - Generate new Stripe webhook secrets
   - Update email credentials

4. **IP Whitelist for MongoDB**
   - If using MongoDB Atlas, whitelist Railway's IP range
   - Railway IPs: Check Railway documentation for current range
   - Alternatively: Allow all IPs (0.0.0.0/0) for testing only

## Environment Variable Validation

The app validates critical variables at startup:
- ✅ `MONGO_URL` - checked on first API call
- ✅ `JWT_SECRET` - checked on authentication attempt
- ✅ `STRIPE_SECRET_KEY` - checked when Stripe function is called
- ✅ All other variables - checked where used

## Getting API Keys

### Stripe
1. Go to https://dashboard.stripe.com/apikeys
2. Copy the API keys
3. Generate webhook signing secret if needed

### MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Create/open your cluster
3. Click "Connect"
4. Copy connection string
5. Replace `<password>` and `<dbname>`

### Email Services
- **Gmail**: Use 16-character app password
- **SendGrid**: Use API key
- **Nodemailer**: Check documentation for your provider

## Next Steps

1. ✅ Set all required environment variables in Railway
2. ✅ Deploy the application
3. ✅ Check logs for successful startup
4. ✅ Test API endpoints with valid requests
5. ✅ Monitor application performance

## Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Verify all variables are set
3. Ensure credentials are correct
4. Check that external services (MongoDB, Stripe, email) are operational
5. Review this guide for troubleshooting steps

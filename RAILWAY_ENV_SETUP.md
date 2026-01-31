# Railway Environment Variables Setup

This document covers all required environment variables for Railway deployment.

## Required Environment Variables

All these variables must be set in the Railway dashboard under **Variables**.

### Database
- `MONGO_URL` - MongoDB connection string
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
  - Get from: MongoDB Atlas dashboard

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens
  - Generate: `openssl rand -base64 32`
  - Keep it secure and unique

### Stripe Integration
- `STRIPE_SECRET_KEY` - Stripe secret API key
  - ⚠️ CRITICAL: Must be set before app starts
  - Get from: Stripe Dashboard → API Keys
  - Format: `sk_live_...` or `sk_test_...`

- `STRIPE_PUBLIC_KEY` - Stripe publishable key
  - Get from: Stripe Dashboard → API Keys
  - Format: `pk_live_...` or `pk_test_...`

- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
  - Get from: Stripe Dashboard → Webhooks
  - Format: `whsec_...`

### Email Configuration
- `EMAIL_USER` - Email service username or sender email
  - Use your email provider credentials (Gmail, SendGrid, etc.)

- `EMAIL_PASS` - Email service password or API key
  - Use app-specific password (for Gmail) or API key (for SendGrid)

### Application Configuration
- `FRONTEND_URL` - Frontend application URL
  - Format: `https://your-frontend-domain.com`
  - Used for CORS and redirects

- `NODE_ENV` - Environment mode
  - Set to: `production`
  - Critical for proper error handling and security

## Railway Environment Setup Steps

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

# Render Deployment Guide

This project is configured for seamless deployment on [Render](https://render.com).

## What's Configured for Render

- ✅ `Procfile` - Specifies the start command
- ✅ `render.yaml` - Render-specific configuration
- ✅ Updated `index.js` - Optimized for Render environment
- ✅ `index.html` as the home page
- ✅ API routes at `/api/v1/*`
- ✅ Health check endpoint at `/health`
- ✅ Automatic fallback to `index.html` for client-side routing

## Deployment Steps

### 1. Prepare Your Repository

Make sure everything is committed to GitHub:

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### 2. Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up or log in
3. Click "New +" → "Web Service"

### 3. Connect Your GitHub Repository

1. Select "GitHub" as the source
2. Authorize Render to access your GitHub account
3. Select the `ecommerce` repository
4. Choose the `main` branch

### 4. Configure the Web Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | ecommerce (or your preferred name) |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Region** | Choose closest to your users |
| **Plan** | Free or Paid (Free tier available) |

### 5. Add Environment Variables

In the Render Dashboard, go to **Environment** section and add:

```
PORT=4000
MONGO_URL=your_mongodb_connection_string
PASSWS=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=https://your-render-url.onrender.com
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
RESEND_API_KEY=your_resend_api_key
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
NODE_ENV=production
```

### 6. Deploy

1. Click the **Deploy** button
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Start the server

### 7. Access Your Application

Once deployed, your application will be available at:

```
https://your-app-name.onrender.com
```

Update the `FRONTEND_URL` environment variable with your actual Render URL.

## Important Notes

### MongoDB Whitelist
Ensure your MongoDB Atlas allows connections from Render:

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Enter Render's IP range or select "Allow Access from Anywhere" (0.0.0.0/0)

### Custom Domain (Optional)
1. In Render Dashboard → Settings → Custom Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Environment Variables
- Never commit `config.env` to Git (it's in .gitignore)
- Always set environment variables in Render's Dashboard
- Update `FRONTEND_URL` after deployment with your actual Render URL

### Logs
Monitor your deployment in real-time:
1. Go to your Web Service in Render Dashboard
2. Click **Logs** tab
3. Watch the build and runtime logs

## Deployment Architecture

```
┌─────────────────┐
│   GitHub Repo   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render Build   │
│  (npm install)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render Start   │
│  (npm start)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Express Server (index.js)     │
├─────────────────────────────────┤
│  Routes:                        │
│  • /api/v1/products             │
│  • /api/v1/users                │
│  • /api/v1/payments             │
│  • /api/v1/cashout              │
│  • /api/v1/email                │
│  • /health (health check)       │
│  • / (index.html - home page)   │
│  • /* (index.html - fallback)   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   MongoDB Atlas Database    │
│   (MONGO_URL connection)    │
└─────────────────────────────┘
```

## Troubleshooting

### Build Fails
- Check the Logs tab in Render Dashboard
- Verify all dependencies in `package.json` are correct
- Ensure `package-lock.json` is committed to Git

### Static Files Not Loading
- Check that all files are in the `public/` directory
- Verify file paths are correct in `index.html`
- Check Express static middleware in `index.js`

### Database Connection Issues
- Verify `MONGO_URL` is correct in Render Environment Variables
- Check MongoDB Atlas Network Access whitelist
- Ensure credentials in connection string are correct

### Port Issues
- Render assigns a random port via `process.env.PORT`
- Your app already handles this with `const PORT = process.env.PORT || 4000`
- Don't hardcode port numbers

### Environment Variables Not Loading
- After adding variables in Render, redeploy
- Click **Manual Deploy** → **Deploy latest commit**
- Check logs to confirm variables are loaded

## Monitoring and Maintenance

### Health Check
Test your deployment's health:
```
curl https://your-app-name.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T10:30:00.000Z"
}
```

### View Logs
- **Logs Tab** - Real-time application logs
- **Deploy Log** - Build and deployment information
- **Metrics** - CPU, Memory, and other performance data

### Auto-Deploy
Render automatically redeploys when you push to your main branch.

## Support

- Render Docs: https://render.com/docs
- Discord Support: https://render.com/community
- Email Support: Available on paid plans

---

## Local Development

While developing locally, use:

```bash
npm run dev      # Development with hot-reload
npm start        # Production mode
npm run build    # Build verification
```

All three commands work the same way both locally and on Render.

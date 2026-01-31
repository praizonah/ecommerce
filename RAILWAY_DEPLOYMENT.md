# Railway Deployment Guide

This guide covers deploying the eCommerce application to Railway.

## Overview

Railway is a modern infrastructure platform that simplifies deployment. Unlike Vercel (which is serverless), Railway runs traditional Node.js applications with persistent processes.

## Prerequisites

- Railway account (https://railway.app)
- Git repository configured
- MongoDB Atlas account or MongoDB connection string
- Environment variables configured

## Deployment Configuration Files

The following Railway configuration files are included:

### 1. `railway.json`
Main Railway configuration file specifying:
- Build strategy (nixpacks)
- Deploy settings
- Restart policies

### 2. `railway.toml`
Additional configuration with:
- Start command
- Port configuration
- Health check settings

### 3. `.railwayignore`
Files excluded from deployment (similar to `.gitignore`)

## Environment Variables

Railway automatically sets the `PORT` environment variable. The app listens on this port (defaults to 3000 if not set locally).

Required environment variables to set in Railway dashboard:
- `MONGO_URL` - MongoDB connection string
- `JWT_SECRET` - JSON Web Token secret
- `STRIPE_API_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password
- `FRONTEND_URL` - Frontend application URL
- `NODE_ENV` - Set to `production`

## Deployment Steps

### 1. Connect Repository
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Authorize and select your repository
5. Railway will auto-detect the Node.js project

### 2. Configure Environment Variables
1. In the Railway dashboard, go to Variables
2. Add all required environment variables
3. Set `NODE_ENV` to `production`
4. For `RAILWAY_STATIC_URL` - leave empty (auto-set by Railway)

### 3. Database Connection
1. Add MongoDB plugin from Railway marketplace, OR
2. Set `MONGO_URL` to your MongoDB Atlas connection string

### 4. Deploy
1. Click "Deploy"
2. Railway automatically detects and runs: `npm run build`
3. Then starts with: `npm start`

## Monitoring Deployment

### Check Logs
```bash
railway logs
```

### Health Check
Once deployed, test the health endpoint:
```bash
curl https://your-railway-app.up.railway.app/health
```

### Monitor Application
- Go to Railway dashboard
- Click on your project
- View Logs tab for real-time logs
- View Metrics tab for resource usage

## Important Differences from Vercel

| Feature | Vercel | Railway |
|---------|--------|---------|
| Execution Model | Serverless functions | Traditional Node.js process |
| Persistent Connection | No | Yes (ideal for MongoDB) |
| Startup Time | Higher (cold starts) | Lower (always warm) |
| Database Pooling | Limited | Full support |
| Pricing | Per request | Per hour (lower for continuous apps) |

## Key Changes from Vercel Configuration

1. **No serverless wrapper** - `api/index.js` exports regular Express app
2. **Connection pooling** - Database pooling is fully utilized
3. **Process-level startup** - Heavy tasks run once at startup
4. **Traditional Express** - Standard Express.js patterns work

## Troubleshooting

### Application won't start
1. Check `npm start` runs correctly locally
2. Verify `index.js` is the entry point
3. Check all environment variables are set

### Database connection fails
1. Verify `MONGO_URL` is correct
2. Check MongoDB IP whitelist includes Railway's IPs
3. Test with: `curl https://your-railway-app.up.railway.app/health`

### Slow startup
1. Check MongoDB connection pooling settings
2. Verify network latency to MongoDB
3. Review application logs for startup tasks

### CORS errors
1. Verify `FRONTEND_URL` environment variable is set
2. Check allowed origins in `index.js` includes your frontend URL
3. Ensure credentials are properly configured

## Rolling Back

1. Go to Railway dashboard
2. Click on your project
3. Go to Deployments tab
4. Click the deployment you want to revert to
5. Click "Redeploy"

## Custom Domain

1. In Railway dashboard, go to Settings
2. Add custom domain under Domains
3. Update DNS records as instructed
4. Update `FRONTEND_URL` environment variable accordingly

## Local Development

The app works the same locally:
```bash
# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Production build check
npm run build

# Production start
npm start
```

Environment variables use `config.env` locally but Railway dashboard in production.

## Additional Resources

- Railway Documentation: https://docs.railway.app
- Railway CLI: https://docs.railway.app/develop/cli
- Node.js Guide: https://docs.railway.app/guides/nodejs

## Summary

Railway provides a straightforward deployment platform perfect for Node.js applications. The main advantages are:
- Persistent processes (better for database connections)
- Simplified configuration
- Automatic scaling
- Easy environment variable management
- Excellent logging and monitoring

# Railway Deployment Checklist

## Pre-Deployment

- [ ] All code committed to git
- [ ] `npm run build` passes locally
- [ ] `npm start` works locally
- [ ] MongoDB connection tested locally
- [ ] All environment variables documented

## Railway Setup

- [ ] Railway account created (https://railway.app)
- [ ] GitHub repository authorized with Railway
- [ ] Project created in Railway dashboard

## Environment Variables

Set these in Railway dashboard:
- [ ] `MONGO_URL` - MongoDB connection string
- [ ] `JWT_SECRET` - Secure random string
- [ ] `STRIPE_API_KEY` - From Stripe dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe webhook settings
- [ ] `EMAIL_USER` - Email service username
- [ ] `EMAIL_PASS` - Email service password
- [ ] `FRONTEND_URL` - Your frontend URL
- [ ] `NODE_ENV` - Set to `production`

## Database

- [ ] MongoDB accessible from Railway (whitelist Railway IPs)
- [ ] Connection pooling configured
- [ ] Database backups enabled (if using MongoDB Atlas)

## Deployment

- [ ] Repository connected to Railway
- [ ] Automatic deployments enabled
- [ ] Initial deployment triggered
- [ ] Deployment logs checked for errors
- [ ] Health endpoint responds: `curl https://your-app.up.railway.app/health`

## Post-Deployment

- [ ] API endpoints accessible
- [ ] Frontend can connect to API
- [ ] Login/authentication works
- [ ] Stripe payments functional
- [ ] Email service operational
- [ ] Database operations working
- [ ] Logs monitored for errors

## Custom Domain (Optional)

- [ ] Custom domain configured in Railway
- [ ] DNS records updated
- [ ] HTTPS working
- [ ] `FRONTEND_URL` updated in environment

## Monitoring

- [ ] Health checks passing
- [ ] No error logs
- [ ] Response times acceptable
- [ ] Database connection stable
- [ ] Memory usage reasonable

## Backup & Recovery

- [ ] MongoDB backups configured
- [ ] Rollback procedure tested
- [ ] Logs being archived
- [ ] Incident response plan ready

## Done!

Your eCommerce application is now running on Railway! 🚀

For support:
- Railway docs: https://docs.railway.app
- Project logs: Railway Dashboard → Logs tab
- Monitoring: Railway Dashboard → Metrics tab

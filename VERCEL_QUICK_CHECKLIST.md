# VERCEL DEPLOYMENT QUICK CHECKLIST

## 🚀 Ready to Deploy? Use This Checklist

### Before Pushing Code
- [ ] `npm run build` passes locally without errors
- [ ] `config.env` is in `.gitignore` (not committed)
- [ ] No sensitive data in code
- [ ] All routers and controllers import correctly

### Environment Variables to Add (Vercel Dashboard)
```
MONGO_URL=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=app_password_not_regular
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-app.vercel.app
PASSWS=your_password_secret
NODE_ENV=production
```

### MongoDB Atlas Setup
- [ ] Go to Network Access
- [ ] Add IP 0.0.0.0/0 (Allow Access from Anywhere)
- [ ] Or whitelist Vercel IPs specifically

### Deploy Steps
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

### After Deployment
- [ ] Check Vercel Dashboard → Deployments (build successful?)
- [ ] Test: curl https://your-app.vercel.app/health
- [ ] Test: Visit https://your-app.vercel.app in browser
- [ ] Check logs for errors
- [ ] Monitor function duration

### Performance Targets
- Static file requests: < 500ms
- API requests: < 2000ms
- Cold start: < 3000ms
- Average: < 1000ms

### If Getting 504 Timeout Errors
1. Check MongoDB is responding
2. Verify MongoDB Atlas Network Access is configured
3. Check Stripe API keys are valid
4. Monitor Vercel Logs for specific error

### If Getting 404 Errors
1. Clear browser cache (Ctrl+Shift+R)
2. Check public/index.html exists
3. Verify routes in api/index.js are correct
4. Check .vercelignore doesn't exclude public/

## 📞 Quick Support Links
- **Vercel Status**: https://vercel.com/status
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://account.mongodb.com/
- **Stripe Dashboard**: https://dashboard.stripe.com/

---

**File Last Updated**: January 31, 2026
**Configuration**: Vercel v2 with Serverless Functions

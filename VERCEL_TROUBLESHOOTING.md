# VERCEL DEPLOYMENT TROUBLESHOOTING GUIDE

Quick solutions for common deployment issues.

---

## 🔴 ERROR: 504 Gateway Timeout

### Symptoms
```
This Serverless Function has timed out.
Code: FUNCTION_INVOCATION_TIMEOUT
```

### Root Causes & Solutions

**❌ MongoDB Connection Timeout**
```
Cause: Database taking too long to respond
Solution:
1. Check MongoDB Atlas status (account.mongodb.com)
2. Verify Network Access: 0.0.0.0/0 is allowed
3. Test connection string locally first
4. Increase socket timeout in MongoDB options
```

**❌ Database Credentials Wrong**
```
Cause: Invalid username/password
Solution:
1. Double-check MONGO_URL in Vercel Dashboard
2. Verify no typos in connection string
3. Test locally with same MONGO_URL in config.env
4. Regenerate password in MongoDB Atlas if needed
```

**❌ Network Connectivity Issue**
```
Cause: Vercel can't reach MongoDB Atlas
Solution:
1. MongoDB Atlas → Network Access → 0.0.0.0/0
2. Wait 5 minutes for whitelist to propagate
3. Or add specific Vercel IP ranges (ask Vercel support)
```

**❌ Slow API Endpoint**
```
Cause: Too many database queries
Solution:
1. Optimize database queries
2. Add indexes to frequently queried fields
3. Implement caching with Redis
4. Use pagination for large result sets
```

---

## 🔴 ERROR: 404 Not Found

### Symptoms
```
404: NOT_FOUND
Resource not found at the requested URL
```

### Root Causes & Solutions

**❌ Static Files Not Found**
```
Cause: public/ directory excluded or files missing
Solution:
1. Verify public/ folder exists in Git
2. Check .vercelignore doesn't exclude public/
3. Ensure index.html exists in public/
4. Run: git add public/ && git push
```

**❌ API Route Not Defined**
```
Cause: Route doesn't match any defined endpoint
Solution:
1. Check routers/ for the route definition
2. Verify router is imported in api/index.js
3. Check route pattern matches request path
4. Example: /api/v1/products needs productRouters
```

**❌ SPA Fallback Not Working**
```
Cause: vercel.json routing rule missing
Solution:
1. Check vercel.json has SPA fallback route:
   {
     "src": "/(.*)",
     "dest": "/api/index.js"
   }
2. Ensure index.html is served for non-API routes
```

**❌ Browser Cache Issue**
```
Cause: Old cached version of page
Solution:
1. Hard refresh: Ctrl+Shift+R (Windows)
                 Cmd+Shift+R (Mac)
2. Clear cache: F12 → Application → Storage → Clear
3. Incognito window: Ctrl+Shift+N (fresh session)
```

---

## 🔴 ERROR: 400 Bad Request

### Symptoms
```
400: Bad Request
The request was rejected because it was malformed
```

### Root Causes & Solutions

**❌ Missing Required Field**
```
Cause: API requires field but client didn't send it
Solution:
1. Check API documentation/controller code
2. Verify request body contains all required fields
3. Check content-type header is 'application/json'
4. Log request body to see what's being sent
```

**❌ Invalid Data Type**
```
Cause: Sending wrong type (string instead of number)
Solution:
1. Check request parsing (express.json())
2. Validate field types match schema
3. Example: price should be 19.99 not "19.99"
```

**❌ CORS Error**
```
Cause: Cross-origin request blocked
Solution:
1. Add your frontend URL to FRONTEND_URL env var
2. Update allowedOrigins in api/index.js CORS config
3. Redeploy after updating
```

---

## 🔴 ERROR: 500 Internal Server Error

### Symptoms
```
500: Internal Server Error
An unexpected error occurred
```

### Root Causes & Solutions

**❌ Unhandled Exception**
```
Cause: Code throwing error without try-catch
Solution:
1. Check Vercel Logs (Dashboard → Logs)
2. Look for specific error message
3. Add error handling around problematic code
4. Test locally to reproduce
```

**❌ Missing Environment Variable**
```
Cause: Code references undefined env var
Solution:
1. Check api/index.js for process.env.VAR_NAME
2. Verify variable exists in Vercel Environment Variables
3. Redeploy after adding variable
4. Check variable name matches exactly (case-sensitive)
```

**❌ Third-Party Service Down**
```
Cause: Stripe, MongoDB, Gmail not responding
Solution:
1. Check service status pages
2. Test connection to external service
3. Add timeout/retry logic
4. Implement graceful error messages
```

**❌ Database Query Error**
```
Cause: Invalid MongoDB query or schema mismatch
Solution:
1. Check MongoDB schema in schemas/
2. Verify query syntax is valid
3. Test query in MongoDB Atlas shell first
4. Add error logging to see exact error
```

---

## 🔴 ERROR: 503 Service Unavailable

### Symptoms
```
503: Service Unavailable
The server is currently unable to handle the request
```

### Root Causes & Solutions

**❌ Function Overload**
```
Cause: Too many concurrent requests
Solution:
1. Vercel auto-scales but may need time
2. Wait a minute and retry
3. Check if traffic spike is expected
4. Upgrade Vercel plan if consistent overload
```

**❌ External Service Rate Limit**
```
Cause: MongoDB, Stripe, or email service rate limited
Solution:
1. Implement exponential backoff retry
2. Add request queuing/batching
3. Check service rate limits
4. Upgrade service plan if hitting limits
```

---

## 🟡 WARNING: Slow Performance

### Symptoms
- Requests taking 5-10 seconds
- Homepage slow to load
- API calls timing out

### Root Causes & Solutions

**⚠️ Cold Start Lag**
```
Expected: First request after deployment can be slow
Solution:
1. Set up Vercel uptime monitor to keep warm
2. This is normal for serverless - expect 2-3s first time
3. Subsequent requests will be <500ms
```

**⚠️ MongoDB Connection Slow**
```
Cause: Database in different region or slow network
Solution:
1. Place MongoDB Atlas cluster closest to Vercel
2. Vercel uses US-East, US-West, Europe, Asia regions
3. Create index on frequently queried fields
4. Implement query caching
```

**⚠️ Large Response Payload**
```
Cause: Returning too much data
Solution:
1. Implement pagination on API responses
2. Select only needed fields (don't return all)
3. Compress responses
4. Use gzip middleware
```

---

## 🟡 WARNING: High Memory Usage

### Symptoms
- Function using close to 1024 MB
- Occasional out-of-memory errors
- Slow performance under load

### Root Causes & Solutions

**⚠️ Memory Leak**
```
Solution:
1. Check for unbounded arrays/caches
2. Close database connections properly
3. Clear old sessions periodically
4. Monitor with: console.log(process.memoryUsage())
```

**⚠️ Large Database Results**
```
Solution:
1. Add pagination to queries
2. Use .limit() and .skip() in MongoDB
3. Select specific fields only
4. Stream large responses instead of loading all
```

---

## ✅ VERIFICATION CHECKS

### After Every Deployment

**Check 1: Build Succeeded**
```bash
Go to Vercel Dashboard → Deployments
Look for green checkmark on latest deployment
Click to view build logs if any warnings
```

**Check 2: Health Endpoint**
```bash
curl https://your-app.vercel.app/health
# Should return:
# {"status":"ok","database":"connected","timestamp":"..."}
```

**Check 3: Homepage Loads**
```bash
curl https://your-app.vercel.app/ | head -20
# Should see HTML with <!DOCTYPE html>
```

**Check 4: API Endpoint Works**
```bash
curl https://your-app.vercel.app/api/v1/products/all
# Should return product data
```

**Check 5: Monitor Logs**
```
Go to Vercel Dashboard → Logs
Watch for first few requests
Check that latency decreases after cold start
Look for any error messages
```

---

## 🔧 QUICK FIXES

### Clear Vercel Cache
```
Vercel Dashboard → Settings → Advanced
Click "Clear Cache" button
```

### Redeploy Without Changes
```
Vercel Dashboard → Deployments
Click "..." on latest deployment
Select "Redeploy"
```

### Check Environment Variables
```
Vercel Dashboard → Settings → Environment Variables
Verify all variables are set
Check for typos in variable names
Ensure secrets are masked (starts with *)
```

### View Function Logs
```
Vercel Dashboard → Logs
Select your project
Watch real-time logs as requests come in
Search for errors by keyword
```

---

## 📞 ESCALATION PATH

If issue persists:

1. **Check Vercel Status**: https://vercel.com/status
2. **Read Vercel Docs**: https://vercel.com/docs
3. **MongoDB Status**: https://status.mongodb.com/
4. **Check GitHub Issues**: Search your error message
5. **Post to Vercel Community**: community.vercel.com
6. **Contact Support**: dashboard.vercel.com/support

---

## 🧪 LOCAL TESTING BEFORE DEPLOY

Always test locally first:

```bash
# Test build script
npm run build

# Test serverless locally
npm run start:serverless

# Test specific endpoint
curl http://localhost:3000/health

# Check for errors
npm run start:serverless 2>&1 | grep -i error
```

---

## 📋 COLLECT INFO FOR DEBUGGING

When reporting issue, gather:

1. **Error Message** - Exact error text
2. **Request URL** - What endpoint was being called
3. **Vercel Deployment ID** - From error message (cpt1::...)
4. **Timestamp** - When error occurred
5. **Browser Console** - Any JavaScript errors (F12)
6. **Network Tab** - HTTP request/response details
7. **Vercel Logs** - Full function logs
8. **Local Reproduction** - Can you reproduce locally?

---

*Troubleshooting guide updated: January 31, 2026*
*For detailed architecture info, see VERCEL_ARCHITECTURE.md*

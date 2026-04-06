# CareSyncr Deployment Guide - Render + Netlify

## 🚀 Quick Start

This guide covers deploying:
- **Backend**: Node.js + Express on [Render.com](https://render.com)
- **Frontend**: React + Vite on [Netlify](https://netlify.com)

---

## Part 1: Backend Deployment on Render

### Prerequisites
- Render.com account
- GitHub repository connected
- MongoDB Atlas account (or MongoDB provider)
- Redis Cloud account (or Redis provider)
- SendGrid account for emails

### Step 1: Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user with password
4. Add IP whitelist (or allow all: 0.0.0.0/0)
5. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/caresyncr?retryWrites=true&w=majority`

### Step 2: Create Redis Instance

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free database
3. Copy connection string: `redis://:password@host:port`

### Step 3: Deploy Backend on Render

1. Go to [Render.com/dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `Vasu-chippa/caresync`
4. Fill in the form:
   - **Name**: `caresyncr-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter (Free tier is 0.50 vCPU, 512 MB RAM)

5. Add Environment Variables:

```
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.netlify.app
CORS_ORIGIN=https://yourdomain.netlify.app

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/caresyncr?retryWrites=true&w=majority
REDIS_URL=redis://:password@host:port

JWT_SECRET=your-very-long-secret-min-32-chars-change-this-in-production
JWT_EXPIRY=24h

SENDGRID_API_KEY=SG.xxxxx-your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@caresyncr.com

PLATFORM_COMMISSION_RATE=0.1
DOCTOR_FEES_MULTIPLIER=1.0
```

6. Click **Create Web Service**
7. Wait for deployment (2-3 minutes)
8. Copy your backend URL: `https://caresyncr-backend.onrender.com`

### Important: Keep Free Tier Awake

Render spins down free tier services after 15 mins of inactivity.

**Option A**: Keep it running 24/7 on Free tier (limits apply)

**Option B**: Upgrade to Starter ($7/month) for dedicated resources

---

## Part 2: Frontend Deployment on Netlify

### Prerequisites
- Netlify account
- GitHub repository connected

### Step 1: Connect Repository to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Select GitHub
4. Choose repository: `Vasu-chippa/caresync`
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `frontend/dist`

### Step 2: Add Environment Variables

In Netlify Dashboard → **Settings** → **Build & deploy** → **Environment**:

```
VITE_API_BASE_URL=https://caresyncr-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://caresyncr-backend.onrender.com
VITE_ENV=production
VITE_DEBUG=false
```

### Step 3: Deploy

1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. Copy your site URL: `https://yourdomain.netlify.app`

### Step 4: Update Backend Environment

Go back to Render dashboard and update:
```
CLIENT_URL=https://yourdomain.netlify.app
CORS_ORIGIN=https://yourdomain.netlify.app
```

This ensures CORS headers are correctly set.

---

## 📝 Full Setup Checklist

- [ ] MongoDB Atlas database created
- [ ] Redis Cloud instance created
- [ ] SendGrid API key obtained
- [ ] Backend deployed on Render
- [ ] Backend environment variables set
- [ ] Frontend deployed on Netlify
- [ ] Frontend environment variables set
- [ ] Both URLs updated to reference each other
- [ ] CORS working (test API call from browser)

---

## 🧪 Testing Deployment

### Test Backend Health
```bash
curl https://caresyncr-backend.onrender.com/api/v1/health
```

Should return:
```json
{
  "data": {
    "uptime": 123.45,
    "timestamp": "2026-04-06T10:00:00.000Z"
  },
  "message": "Backend is healthy"
}
```

### Test Frontend
Visit: `https://yourdomain.netlify.app`

Should load without errors

### Test API Integration
1. Login with test account
2. Check browser network tab
3. Verify API calls go to correct Render URL

---

## 🔧 Common Issues & Fixes

### Issue: Frontend shows "Cannot reach API"

**Solution**:
1. Check `VITE_API_BASE_URL` in Netlify environment
2. Verify backend is running: `curl https://caresyncr-backend.onrender.com/api/v1/health`
3. Check browser console for CORS errors
4. Verify `CORS_ORIGIN` matches frontend URL in Render

### Issue: Render backend keeps spinning down

**Solution**:
- Upgrade to Starter plan ($7/month)
- Or use external service to ping `/health` endpoint every 10 minutes

### Issue: Build fails on deployment

**Solution**:
1. Check deployment logs for error messages
2. Verify environment variables are set
3. Test locally: `npm run build`
4. Check Node.js version compatibility

### Issue: Database connection timeout

**Solution**:
1. Verify MongoDB connection string is correct
2. Check MongoDB Atlas IP whitelist includes Render IPs
3. Test connection locally with same URI

---

## 🔐 Production Security Checklist

- [ ] JWT_SECRET is long and random (min 32 chars)
- [ ] Database credentials are strong
- [ ] Redis password is set
- [ ] SENDGRID_API_KEY is valid
- [ ] CORS_ORIGIN matches frontend URL exactly
- [ ] NODE_ENV=production
- [ ] No console.log() in production code
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced

---

## 📈 Monitoring & Logs

### Render Logs
1. Go to service dashboard
2. Click **Logs** tab
3. Monitor for errors in real-time

### Netlify Logs
1. Go to site dashboard
2. Click **Deploys** tab
3. Click latest deploy
4. Check build logs

---

## 💰 Estimated Monthly Cost

- **Render Backend** (Starter): $7/month
- **Netlify Frontend** (Free): $0/month
- **MongoDB Atlas** (Free): $0/month
- **Redis Cloud** (Free): $0/month

**Total**: ~$7/month to start

---

## 🔄 Continuous Deployment

Both Render and Netlify automatically redeploy when you push to `main` branch:

```bash
git push origin main
```

This will:
1. Trigger Netlify build and deploy frontend
2. Trigger Render build and deploy backend

Deployments typically take 2-5 minutes.

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Redis Cloud**: https://docs.redis.com/latest/rc/

---

## ✅ Next Steps

1. Set up databases (MongoDB & Redis)
2. Deploy backend on Render
3. Deploy frontend on Netlify
4. Configure environment variables
5. Test both services
6. Set up monitoring/alerts
7. Configure custom domain (optional)

**Happy Deploying! 🚀**

---

Made with ❤️ by Vasu | CareSyncr © 2026

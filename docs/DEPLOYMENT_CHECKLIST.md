# Deployment Checklist - Aladdin Movie Production Platform

**Date**: 2025-10-01  
**Version**: 1.0.0  
**Status**: Ready for Review

---

## 🔐 Environment Variables Required

### Critical (Must Have)

```bash
# Database
DATABASE_URI=mongodb://...                    # MongoDB connection string
PAYLOAD_SECRET=                               # Random 32+ character string

# Authentication
NEXTAUTH_SECRET=                              # Random 32+ character string
NEXTAUTH_URL=https://your-domain.com          # Production URL

# Email (for authentication)
EMAIL_FROM=noreply@your-domain.com
EMAIL_SERVER_HOST=smtp.your-provider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=

# Brain Service (AI/LLM)
BRAIN_SERVICE_URL=http://localhost:8000       # Brain service endpoint
OPENAI_API_KEY=                               # OpenAI API key for LLM

# Redis (Caching & Queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                               # Optional but recommended
```

### Optional (Recommended)

```bash
# Error Tracking
SENTRY_DSN=                                   # Sentry error tracking (optional)

# File Storage
S3_BUCKET=                                    # AWS S3 bucket name
S3_REGION=                                    # AWS region
S3_ACCESS_KEY_ID=                             # AWS access key
S3_SECRET_ACCESS_KEY=                         # AWS secret key

# Analytics
NEXT_PUBLIC_GA_ID=                            # Google Analytics ID

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
```

---

## ✅ Pre-Deployment Checklist

### 1. Code Quality ✅

- [x] All mock data removed
- [x] No TODO comments in critical paths
- [x] TypeScript errors resolved
- [x] ESLint warnings addressed
- [x] No console.log in production code (except error logging)

### 2. Testing ⏳

- [ ] All E2E tests passing
- [ ] Manual testing completed
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness verified
- [ ] Performance testing completed

### 3. Security 🔐

- [ ] Environment variables secured
- [ ] API endpoints have authentication
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### 4. Database 💾

- [ ] MongoDB indexes created
- [ ] Database migrations run
- [ ] Seed data loaded (if needed)
- [ ] Backup strategy in place
- [ ] Connection pooling configured

### 5. Services 🚀

- [ ] Brain service deployed and accessible
- [ ] Redis server running
- [ ] BullMQ workers running
- [ ] PayloadCMS configured
- [ ] Email service configured

### 6. Performance ⚡

- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Lazy loading implemented
- [ ] CDN configured (if applicable)
- [ ] Caching strategy verified
- [ ] Bundle size optimized

### 7. Monitoring 📊

- [ ] Error tracking enabled (Sentry or similar)
- [ ] Logging configured
- [ ] Uptime monitoring setup
- [ ] Performance monitoring enabled
- [ ] Database monitoring enabled

---

## 🚀 Deployment Steps

### Step 1: Prepare Environment

```bash
# 1. Clone repository
git clone <repository-url>
cd aladdin

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.production
# Edit .env.production with production values
```

### Step 2: Build Application

```bash
# 1. Run production build
pnpm build

# 2. Verify build succeeded
# Check for any build errors or warnings

# 3. Test production build locally
pnpm start
# Visit http://localhost:3000 and verify
```

### Step 3: Database Setup

```bash
# 1. Ensure MongoDB is accessible
# Test connection with mongo shell or MongoDB Compass

# 2. Run migrations (if any)
# pnpm run migrate

# 3. Load seed data (optional)
# pnpm run seed
```

### Step 4: Deploy Services

```bash
# 1. Deploy Brain Service
# Ensure brain service is running and accessible
curl http://your-brain-service-url/health

# 2. Start Redis
# Ensure Redis is running
redis-cli ping

# 3. Start BullMQ Workers
pnpm run worker:start
```

### Step 5: Deploy Application

**Option A: Vercel (Recommended)**

```bash
# 1. Install Vercel CLI
pnpm add -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
# Go to Project Settings > Environment Variables
```

**Option B: Docker**

```bash
# 1. Build Docker image
docker build -t aladdin-app .

# 2. Run container
docker run -p 3000:3000 --env-file .env.production aladdin-app
```

**Option C: PM2 (Node.js)**

```bash
# 1. Install PM2
pnpm add -g pm2

# 2. Start application
pm2 start pnpm --name "aladdin" -- start

# 3. Save PM2 configuration
pm2 save

# 4. Setup PM2 startup
pm2 startup
```

### Step 6: Post-Deployment Verification

```bash
# 1. Check application is accessible
curl https://your-domain.com

# 2. Test authentication
# Login with test account

# 3. Test API endpoints
curl https://your-domain.com/api/v1/health

# 4. Check error logs
# Review logs for any errors

# 5. Monitor performance
# Check response times and resource usage
```

---

## 🔍 Health Checks

### Application Health

```bash
# Check if application is running
curl https://your-domain.com/api/v1/health

# Expected response:
# { "status": "ok", "timestamp": "..." }
```

### Database Health

```bash
# Check MongoDB connection
# Should see "connected" in logs
```

### Redis Health

```bash
# Check Redis connection
redis-cli ping
# Expected: PONG
```

### Brain Service Health

```bash
# Check brain service
curl http://your-brain-service-url/health
# Expected: { "status": "healthy" }
```

---

## 📊 Monitoring Setup

### 1. Error Tracking

**Sentry (Recommended)**

```bash
# 1. Create Sentry project
# 2. Get DSN from Sentry dashboard
# 3. Add to environment variables
SENTRY_DSN=https://...@sentry.io/...

# 4. Verify errors are being tracked
# Trigger a test error and check Sentry dashboard
```

### 2. Uptime Monitoring

**Options**:
- UptimeRobot (free)
- Pingdom
- StatusCake

**Setup**:
1. Create monitor for https://your-domain.com
2. Set check interval (5 minutes recommended)
3. Configure alerts (email, SMS, Slack)

### 3. Performance Monitoring

**Options**:
- Vercel Analytics (if using Vercel)
- Google Analytics
- New Relic
- DataDog

### 4. Log Aggregation

**Options**:
- Logtail
- Papertrail
- CloudWatch (if on AWS)

---

## 🔄 Rollback Plan

### If Deployment Fails

**Vercel**:
```bash
# Rollback to previous deployment
vercel rollback
```

**PM2**:
```bash
# Stop current version
pm2 stop aladdin

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
pnpm build
pm2 restart aladdin
```

**Docker**:
```bash
# Stop current container
docker stop aladdin-app

# Run previous image
docker run -p 3000:3000 aladdin-app:previous-tag
```

---

## 📝 Post-Deployment Tasks

### Immediate (Within 1 hour)

- [ ] Verify all pages load correctly
- [ ] Test user authentication
- [ ] Test project creation
- [ ] Test orchestrator chat
- [ ] Check error logs
- [ ] Monitor performance metrics

### Short Term (Within 24 hours)

- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Verify email delivery
- [ ] Test all API endpoints
- [ ] Review user feedback
- [ ] Check resource usage

### Medium Term (Within 1 week)

- [ ] Analyze performance metrics
- [ ] Review error patterns
- [ ] Optimize slow queries
- [ ] Update documentation
- [ ] Plan next iteration

---

## 🚨 Emergency Contacts

```
Technical Lead: [NAME] - [EMAIL] - [PHONE]
DevOps: [NAME] - [EMAIL] - [PHONE]
Database Admin: [NAME] - [EMAIL] - [PHONE]
```

---

## 📚 Additional Resources

- **Documentation**: `docs/` folder
- **API Reference**: `docs/api/` folder
- **Architecture**: `docs/architecture/` folder
- **Testing Guide**: `docs/testing/` folder

---

## ✅ Sign-Off

**Prepared By**: AI Assistant  
**Date**: 2025-10-01  
**Status**: Ready for Review

**Approvals Required**:
- [ ] Technical Lead
- [ ] DevOps Engineer
- [ ] Security Review
- [ ] Product Owner

---

**Notes**:
- This checklist should be reviewed and updated before each deployment
- All checkboxes should be completed before production deployment
- Keep this document updated with actual deployment procedures


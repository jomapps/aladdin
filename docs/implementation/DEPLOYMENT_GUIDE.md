# Deployment Guide - Aladdin System

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Service Dependencies](#service-dependencies)
- [PayloadCMS Setup](#payloadcms-setup)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Server Specifications**:
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS or similar

**Software Requirements**:
- Node.js 18.20.2 or >= 20.9.0
- pnpm 9.x or 10.x
- MongoDB 6.x or 7.x
- Redis 7.x
- Docker & Docker Compose (optional)

### External Services

Required third-party services:
1. **Neo4j Cloud** (Brain Service database)
2. **Cloudflare R2** (Media storage)
3. **FAL.ai** (AI media generation)
4. **OpenRouter** (LLM operations)
5. **ElevenLabs** (Voice generation)
6. **Jina AI** (Embeddings)

---

## Environment Variables

### Required Variables

Create `.env` file in project root:

```bash
# ============================================================
# DATABASE CONFIGURATION
# ============================================================

# PayloadCMS Primary Database
DATABASE_URI=mongodb://127.0.0.1:27017/aladdin
MONGODB_URI=mongodb://127.0.0.1:27017/aladdin
PAYLOAD_SECRET=your_secure_random_secret_here

# ============================================================
# AUTHENTICATION
# ============================================================

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com

# ============================================================
# EXTERNAL SERVICES
# ============================================================

# OpenRouter (LLM Operations)
OPENROUTER_API_KEY=sk-or-v1-your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
OPENROUTER_BACKUP_MODEL=qwen/qwen3-vl-235b-a22b-thinking

# FAL.ai (Media Generation)
FAL_KEY=your_fal_api_key_here
FAL_TEXT_TO_IMAGE_MODEL=fal-ai/nano-banana
FAL_IMAGE_TO_IMAGE_MODEL=fal-ai/nano-banana/edit
FAL_VISION_QUERY_MODEL=fal-ai/moondream2/visual-query

# ElevenLabs (Voice Generation)
ELEVENLABS_API_KEY=sk_your_elevenlabs_key_here

# Jina AI (Embeddings)
JINA_API_KEY=jina_your_api_key_here

# Codebuff (Optional)
CODEBUFF_API_KEY=cb-pat-your_key_here

# ============================================================
# BRAIN SERVICE (Knowledge Graph)
# ============================================================

BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=your_brain_api_key_here

# Neo4j (for Brain Service - if self-hosted)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# ============================================================
# TASK SERVICE (Celery/Redis Queue)
# ============================================================

TASKS_API_URL=https://tasks.ft.tc
TASK_API_KEY=your_task_api_key_here

# Redis (for Task Queue - if self-hosted)
REDIS_URL=redis://localhost:6379/0

# ============================================================
# CLOUDFLARE R2 (Media Storage)
# ============================================================

R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_ENDPOINT=https://your_endpoint.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://media.your-domain.com

# ============================================================
# EMAIL (SMTP)
# ============================================================

SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USER=no-reply@your-domain.com
SMTP_PASS=your_smtp_password
FROM_EMAIL=no-reply@your-domain.com
FROM_NAME="Aladdin System"
ADMIN_EMAIL=admin@your-domain.com

# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

# URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com,https://brain.ft.tc,https://tasks.ft.tc

# Environment
NODE_ENV=production
LOG_LEVEL=info

# WebSocket
WS_PORT=3001
WS_HOST=0.0.0.0
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_RECONNECT_ATTEMPTS=5

# Agent System
AGENT_MAX_RETRIES=3
AGENT_RETRY_DELAY=1000
AGENT_TIMEOUT=300000
AGENT_MAX_CONCURRENT_EXECUTIONS=10

# Quality & Performance
QUALITY_CACHE_TTL=3600
QUALITY_MIN_THRESHOLD=60
QUALITY_ENABLE_CACHE=true

# Monitoring
ENABLE_PERFORMANCE_MONITORING=true

# Event Streaming
EVENT_BUFFER_SIZE=100
EVENT_FLUSH_INTERVAL=5000
EVENT_RETENTION_DAYS=30

# Audit Trail
AUDIT_EXPORT_MAX_RATE=10
AUDIT_EXPORT_RATE_WINDOW=60000
AUDIT_CACHE_TTL=300
AUDIT_MAX_PAGE_SIZE=100
```

### Environment Variable Categories

#### Critical (Required for Boot)
```bash
DATABASE_URI
MONGODB_URI
PAYLOAD_SECRET
```

#### Essential (Required for Features)
```bash
OPENROUTER_API_KEY
BRAIN_SERVICE_BASE_URL
BRAIN_SERVICE_API_KEY
TASKS_API_URL
TASK_API_KEY
R2_*
```

#### Optional (Feature-Specific)
```bash
FAL_KEY                    # For image generation
ELEVENLABS_API_KEY         # For voice synthesis
CODEBUFF_API_KEY          # For code assistance
```

---

## Service Dependencies

### 1. MongoDB Setup

#### Production MongoDB (Atlas)

1. Create MongoDB Atlas cluster
2. Whitelist application IP
3. Create database user
4. Get connection string

```bash
# Atlas connection string
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/aladdin?retryWrites=true&w=majority
```

#### Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create admin user
mongosh
> use admin
> db.createUser({
    user: "aladdin_admin",
    pwd: "secure_password",
    roles: ["readWriteAnyDatabase"]
  })

# Connection string
DATABASE_URI=mongodb://aladdin_admin:secure_password@localhost:27017/aladdin?authSource=admin
```

### 2. Redis Setup

#### Production Redis (Redis Cloud)

1. Create Redis Cloud account
2. Create database instance
3. Get connection details

```bash
REDIS_URL=redis://default:password@redis-endpoint:port
```

#### Self-Hosted Redis

```bash
# Install Redis
sudo apt-get install -y redis-server

# Configure
sudo nano /etc/redis/redis.conf
# Set: bind 0.0.0.0
# Set: requirepass your_secure_password

# Start service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Connection string
REDIS_URL=redis://:your_secure_password@localhost:6379/0
```

### 3. Brain Service Setup

The Brain Service is a separate microservice that must be deployed:

```bash
# Clone brain service repo
git clone https://github.com/your-org/brain-service.git
cd brain-service

# Configure
cp .env.example .env
nano .env

# Required for Brain Service:
# NEO4J_URI=neo4j+s://...
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=...
# JINA_API_KEY=...
# API_KEY=your_brain_api_key

# Deploy
docker-compose up -d

# Verify
curl https://brain.ft.tc/api/v1/health
```

### 4. Task Service Setup

Task service handles async operations:

```bash
# Clone task service repo
git clone https://github.com/your-org/task-service.git
cd task-service

# Configure
cp .env.example .env
nano .env

# Required for Task Service:
# REDIS_URL=redis://...
# CELERY_BROKER_URL=redis://...
# CELERY_RESULT_BACKEND=redis://...
# API_KEY=your_task_api_key
# OPENROUTER_API_KEY=...

# Deploy
docker-compose up -d

# Verify workers
celery -A app.celery inspect active

# Check health
curl https://tasks.ft.tc/api/v1/health
```

---

## PayloadCMS Setup

### Initial Configuration

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_APP_URL,
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- Aladdin',
      favicon: '/favicon.ico',
    },
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI!,
  }),
  editor: lexicalEditor({}),
  collections: [
    // Import all collections
    Projects,
    Departments,
    CharacterReferences,
    Episodes,
    Users,
    Media,
    // ... other collections
  ],
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.R2_BUCKET_NAME!,
      config: {
        endpoint: process.env.R2_ENDPOINT!,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      },
    }),
  ],
})
```

### Admin User Creation

```bash
# Create first admin user
pnpm payload create-first-user

# Or programmatically
node scripts/create-admin.js
```

```javascript
// scripts/create-admin.js
import { getPayload } from 'payload'
import config from './payload.config.js'

const payload = await getPayload({ config })

await payload.create({
  collection: 'users',
  data: {
    email: 'admin@your-domain.com',
    password: 'secure_admin_password',
    roles: ['admin'],
  },
})

console.log('✅ Admin user created')
```

---

## Production Deployment

### Option 1: Docker Deployment

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # Aladdin Application
  aladdin:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads

  # MongoDB
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
      - MONGO_INITDB_DATABASE=aladdin
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongodb_data:
  redis_data:
```

#### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN pnpm build

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Deploy Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f aladdin

# Stop
docker-compose down

# Restart
docker-compose restart aladdin
```

### Option 2: Traditional VPS Deployment

#### 1. Install Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Install PM2
sudo npm install -g pm2
```

#### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/aladdin.git
cd aladdin

# Install dependencies
pnpm install

# Build production
pnpm build

# Copy environment
cp .env.example .env
nano .env # Configure all variables
```

#### 3. PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'aladdin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
    },
  ],
}
```

#### 4. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs aladdin
```

### Option 3: Vercel Deployment

#### vercel.json

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URI": "@database_uri",
    "PAYLOAD_SECRET": "@payload_secret",
    "BRAIN_SERVICE_BASE_URL": "@brain_service_url",
    "BRAIN_SERVICE_API_KEY": "@brain_api_key",
    "TASKS_API_URL": "@tasks_api_url",
    "TASK_API_KEY": "@task_api_key"
  }
}
```

#### Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URI production
vercel env add PAYLOAD_SECRET production
# ... add all required env vars
```

---

## Nginx Configuration

### Reverse Proxy Setup

```nginx
# /etc/nginx/sites-available/aladdin
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /api/orchestrator/ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Media files (if serving from local)
    location /uploads {
        alias /var/www/aladdin/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aladdin /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Monitoring & Maintenance

### Health Monitoring

```bash
# Create health check script
cat > /usr/local/bin/aladdin-health.sh << 'EOF'
#!/bin/bash

# Check application
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application: OK"
else
    echo "❌ Application: DOWN"
    pm2 restart aladdin
fi

# Check MongoDB
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB: OK"
else
    echo "❌ MongoDB: DOWN"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: DOWN"
fi

# Check Brain Service
if curl -f https://brain.ft.tc/api/v1/health > /dev/null 2>&1; then
    echo "✅ Brain Service: OK"
else
    echo "❌ Brain Service: DOWN"
fi

# Check Task Service
if curl -f https://tasks.ft.tc/api/v1/health > /dev/null 2>&1; then
    echo "✅ Task Service: OK"
else
    echo "❌ Task Service: DOWN"
fi
EOF

chmod +x /usr/local/bin/aladdin-health.sh

# Add to crontab (run every 5 minutes)
crontab -e
# Add: */5 * * * * /usr/local/bin/aladdin-health.sh >> /var/log/aladdin-health.log 2>&1
```

### Backup Strategy

```bash
# MongoDB backup script
cat > /usr/local/bin/aladdin-backup.sh << 'EOF'
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/aladdin"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PayloadCMS database
mongodump --db=aladdin --out=$BACKUP_DIR/payload_$TIMESTAMP

# Backup all gather databases
for db in $(mongosh --quiet --eval "db.adminCommand('listDatabases').databases.filter(d => d.name.startsWith('aladdin-gather-')).map(d => d.name).join(' ')"); do
    mongodump --db=$db --out=$BACKUP_DIR/gather_$TIMESTAMP
done

# Compress
tar -czf $BACKUP_DIR/aladdin_backup_$TIMESTAMP.tar.gz $BACKUP_DIR/*_$TIMESTAMP

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup completed: aladdin_backup_$TIMESTAMP.tar.gz"
EOF

chmod +x /usr/local/bin/aladdin-backup.sh

# Schedule daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /usr/local/bin/aladdin-backup.sh >> /var/log/aladdin-backup.log 2>&1
```

### Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/aladdin

# Add:
/var/www/aladdin/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
pm2 logs aladdin --lines 100

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use

# Solutions:
pm2 delete aladdin
pm2 start ecosystem.config.js
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
mongosh $DATABASE_URI

# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

#### 3. Brain/Task Service Unreachable

```bash
# Test connectivity
curl -v https://brain.ft.tc/api/v1/health
curl -v https://tasks.ft.tc/api/v1/health

# Check API keys
echo $BRAIN_SERVICE_API_KEY
echo $TASK_API_KEY

# Verify in application logs
pm2 logs aladdin | grep "Brain\|Task"
```

#### 4. Memory Issues

```bash
# Check memory usage
pm2 list
free -h

# Restart with memory limit
pm2 delete aladdin
pm2 start ecosystem.config.js --max-memory-restart 1G
```

#### 5. Upload/Media Issues

```bash
# Check R2 configuration
aws s3 ls s3://$R2_BUCKET_NAME \
  --endpoint-url=$R2_ENDPOINT \
  --profile r2

# Verify permissions
ls -la /var/www/aladdin/uploads
```

### Performance Optimization

#### Enable Caching

```typescript
// Add Redis caching
import { redis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const cacheKey = `api:${request.url}`

  // Check cache
  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json(JSON.parse(cached))
  }

  // Fetch data
  const data = await fetchData()

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(data))

  return NextResponse.json(data)
}
```

#### Database Indexing

```bash
# Check index usage
mongosh
> use aladdin
> db.projects.getIndexes()
> db.projects.explain().find({ slug: 'test' })

# Add missing indexes
> db.projects.createIndex({ slug: 1 })
```

---

## Security Checklist

- [ ] All environment variables secured
- [ ] MongoDB authentication enabled
- [ ] Redis password protected
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured (UFW)
- [ ] Regular security updates
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Sensitive data encrypted
- [ ] Backup encryption enabled
- [ ] Access logs monitored
- [ ] Webhook signatures verified

---

## Support

For deployment assistance:
- Documentation: /docs/implementation/
- GitHub Issues: https://github.com/aladdin/issues
- Email: devops@aladdin.io

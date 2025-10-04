# Application Deployment

**Purpose**: Deploy Aladdin application on Ubuntu server with PM2  
**Process Manager**: PM2  
**Updated**: October 4, 2025

---

## 🔧 Environment Configuration

### 1. Clone Repository

```bash
# Navigate to application directory
cd /var/www/aladdin

# Clone the repository
git clone https://github.com/your-org/aladdin.git .

# Verify clone
ls -la
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env.production

# Edit with production values
nano .env.production
```

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URI=mongodb://localhost:27017/aladdin
DATABASE_URI_OPEN=mongodb://localhost:27017
PAYLOAD_SECRET=<generate-random-32+-char-string>

# Authentication
NEXTAUTH_SECRET=<generate-random-32+-char-string>
NEXTAUTH_URL=https://your-domain.com

# OpenRouter (LLM operations)
OPENROUTER_API_KEY=<your-openrouter-key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# Fal.ai (Media generation)
FAL_KEY=<your-fal-key>
FAL_TEXT_TO_IMAGE_MODEL=fal-ai/nano-banana
FAL_IMAGE_TO_IMAGE_MODEL=fal-ai/nano-banana/edit

# Cloudflare R2 Storage
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=<your-bucket>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://<your-cdn-url>

# Brain Service
BRAIN_SERVICE_BASE_URL=https://brain.ft.tc
BRAIN_SERVICE_API_KEY=<your-brain-key>

# Redis
REDIS_URL=redis://localhost:6379/0

# SMTP (Email)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-pass>
FROM_EMAIL=noreply@your-domain.com

# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Generate Secrets

```bash
# Generate Payload secret
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32
```

---

## 🚀 Deploy with PM2

### 1. Create PM2 Ecosystem File

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'aladdin',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env_file: '.env.production'
  }]
}
EOF
```

### 2. Build Application

```bash
# Build Next.js application
pnpm build

# Verify build
ls -la .next/
```

### 3. Start Application

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

### 4. Configure PM2 Startup

```bash
# Run the command that PM2 outputs (as root)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u aladdin --hp /home/aladdin
```

### 5. PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs aladdin

# View real-time logs
pm2 logs aladdin --lines 100

# Restart application
pm2 restart aladdin

# Stop application
pm2 stop aladdin

# Monitor application
pm2 monit

# Reload with zero downtime
pm2 reload aladdin

# List all processes
pm2 list

# Delete application
pm2 delete aladdin
```

---

## 🌐 Configure Nginx

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/aladdin
```

### 2. Nginx Configuration Content

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=50r/s;

# Upstream to Node.js
upstream aladdin_upstream {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL certificates (will be added by certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client body size (for file uploads)
    client_max_body_size 100M;
    
    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Rate limiting on API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://aladdin_upstream;
    }
    
    # General proxy
    location / {
        limit_req zone=general_limit burst=100 nodelay;
        proxy_pass http://aladdin_upstream;
    }
    
    # Static files with caching
    location /_next/static/ {
        proxy_pass http://aladdin_upstream;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        proxy_pass http://aladdin_upstream;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

### 3. Enable Nginx Site

```bash
# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/aladdin /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate Setup

### 1. Install SSL with Let's Encrypt

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Create certbot directory
sudo mkdir -p /var/www/certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start Nginx
sudo systemctl start nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

### 2. Setup Automatic Renewal

```bash
# Open crontab
sudo crontab -e

# Add this line for daily renewal check
0 0 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

---

## 📊 Monitoring & Logging

### 1. Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/aladdin
```

**Logrotate Configuration:**
```
/var/www/aladdin/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Basic Monitoring Script

```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash

# Check PM2 status
pm2_status=$(pm2 jlist | jq -r '.[0].pm2_env.status')
if [ "$pm2_status" != "online" ]; then
    echo "Aladdin is not running! Status: $pm2_status"
    # Send alert (email, Slack, etc.)
fi

# Check memory usage
memory_usage=$(pm2 jlist | jq -r '.[0].monit.memory')
if [ "$memory_usage" -gt 2000000000 ]; then  # 2GB
    echo "High memory usage: $((memory_usage / 1024 / 1024))MB"
fi

# Check disk space
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 80 ]; then
    echo "High disk usage: ${disk_usage}%"
fi

# Check MongoDB
if ! systemctl is-active --quiet mongod; then
    echo "MongoDB is not running!"
fi

# Check Redis
if ! systemctl is-active --quiet redis-server; then
    echo "Redis is not running!"
fi
EOF

chmod +x monitor.sh

# Add to crontab (every 5 minutes)
crontab -e
# Add: */5 * * * * /var/www/aladdin/monitor.sh >> /var/www/aladdin/logs/monitor.log 2>&1
```

---

## 🔄 Deployment Updates

### Update Application

```bash
cd /var/www/aladdin

# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Build application
pnpm build

# Reload with PM2 (zero-downtime)
pm2 reload ecosystem.config.js
```

### Database Migrations

```bash
# Run PayloadCMS migrations
pnpm payload migrate

# Seed new data if needed
pnpm db:seed
```

---

## ✅ Post-Deployment Checklist

### Immediate (Within 1 hour)

- [ ] Application accessible at https://your-domain.com
- [ ] SSL certificate valid and HTTPS working
- [ ] User authentication working
- [ ] Project creation functional
- [ ] Orchestrator chat responding
- [ ] PM2 status healthy (all green)
- [ ] No critical errors in logs
- [ ] API endpoints responding

### Short Term (Within 24 hours)

- [ ] Monitor PM2 logs for errors
- [ ] Check database performance
- [ ] Verify email delivery
- [ ] Monitor memory usage
- [ ] Check disk space
- [ ] Review Nginx access logs
- [ ] Test all major features
- [ ] Verify AI agent functionality

---

## 📚 Related Documentation

- [Deployment Prerequisites](./deployment-prerequisites.md) - Server setup
- [Environment Variables](./environment-variables.md) - Configuration reference
- [SSL Configuration](./ssl.md) - HTTPS setup details
- [Monitoring Setup](./monitoring.md) - Production monitoring
- [Security Hardening](./security-hardening.md) - Security best practices
- [Troubleshooting](../09-troubleshooting/) - Common issues

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Next Review**: January 4, 2026
# Deployment Guide - Ubuntu Server (No Docker)

**Target Environment**: Ubuntu 20.04+ Server  
**Date**: October 2, 2025  
**Version**: 1.0.0

---

## 🎯 Deployment Strategy

**Platform**: Native Ubuntu Server (systemd services)  
**No Docker**: Direct installation for better performance and simpler management  
**Process Manager**: PM2 for Node.js applications  
**Reverse Proxy**: Nginx  
**SSL**: Let's Encrypt (certbot)

---

## 📋 Prerequisites

### Server Requirements
- Ubuntu 20.04 LTS or later
- Minimum 8GB RAM
- Minimum 4 CPU cores
- 100GB+ disk space
- Root or sudo access

### Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 globally
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install MongoDB (if not using external service)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## 🔧 Environment Configuration

### 1. Clone Repository
```bash
cd /var/www
sudo git clone <repository-url> aladdin
cd aladdin
sudo chown -R $USER:$USER /var/www/aladdin
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment
```bash
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URI=mongodb://localhost:27017/aladdin
PAYLOAD_SECRET=<generate-random-32+-char-string>

# Authentication
NEXTAUTH_SECRET=<generate-random-32+-char-string>
NEXTAUTH_URL=https://your-domain.com

# OpenRouter (LLM operations)
OPENROUTER_API_KEY=<your-key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-sonnet-4.5

# Fal.ai (Media generation)
FAL_KEY=<your-key>
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
BRAIN_SERVICE_API_KEY=<your-key>

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
```

---

## 🏗️ Build Application

```bash
# Build for production
pnpm build

# Test production build locally
NODE_ENV=production pnpm start
# Verify at http://localhost:3000
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

### 2. Start Application
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command that PM2 outputs
```

### 3. PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs aladdin

# Restart application
pm2 restart aladdin

# Stop application
pm2 stop aladdin

# Monitor
pm2 monit
```

---

## 🌐 Configure Nginx

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/aladdin
```

**Nginx Configuration:**
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

### 2. Enable Site
```bash
# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/aladdin /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate

### Install SSL with Let's Encrypt
```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Start Nginx
sudo systemctl start nginx

# Test auto-renewal
sudo certbot renew --dry-run

# Setup automatic renewal
sudo crontab -e
# Add this line:
0 0 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

---

## 📊 Monitoring & Logging

### 1. Setup Logging
```bash
# Create log rotation
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

### 2. Monitoring Commands
```bash
# System resources
htop

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
pm2 logs aladdin

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log
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

# Build
pnpm build

# Reload with PM2 (zero-downtime)
pm2 reload ecosystem.config.js
```

---

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs aladdin --lines 100

# Check if port is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart aladdin
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Memory Issues
```bash
# Check memory usage
free -h

# Check PM2 memory
pm2 list

# Restart with memory cleanup
pm2 reload aladdin
```

---

## ✅ Post-Deployment Checklist

### Immediate (Within 1 hour)
- [ ] Verify application is accessible at https://your-domain.com
- [ ] Test user authentication
- [ ] Test project creation
- [ ] Test orchestrator chat
- [ ] Check PM2 status (all green)
- [ ] Check error logs (no critical errors)
- [ ] Verify SSL certificate is valid
- [ ] Test API endpoints

### Short Term (Within 24 hours)
- [ ] Monitor PM2 logs for errors
- [ ] Check database performance
- [ ] Verify email delivery
- [ ] Monitor memory usage
- [ ] Check disk space
- [ ] Review Nginx access logs
- [ ] Test all major features

### Medium Term (Within 1 week)
- [ ] Setup monitoring (Sentry, New Relic, etc.)
- [ ] Configure backups
- [ ] Review performance metrics
- [ ] Optimize slow queries
- [ ] Plan scaling strategy

---

## 🎯 Production Checklist

### Security
- [ ] All environment variables secured
- [ ] API endpoints have authentication
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SSL/HTTPS enforced
- [ ] Security headers configured
- [ ] Firewall rules configured
- [ ] SSH key-based authentication
- [ ] Fail2ban installed

### Performance
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Caching configured
- [ ] CDN configured
- [ ] Database indexes created
- [ ] Redis caching active

### Backup Strategy
- [ ] Database backups automated
- [ ] File storage backups configured
- [ ] Backup restoration tested
- [ ] Off-site backup location

---

## 📞 Support

For deployment issues:
1. Check PM2 logs: `pm2 logs aladdin`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system resources: `htop`
4. Review this guide's troubleshooting section

---

**Document Version**: 1.0.0  
**Last Updated**: October 2, 2025  
**Target**: Ubuntu 20.04+ Server (No Docker)

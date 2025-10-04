# Ubuntu Deployment Guide

**Target Environment**: Ubuntu 20.04+ Server  
**Deployment Method**: Native Ubuntu Server (No Docker)  
**Process Manager**: PM2  
**Last Updated**: October 4, 2025

---

## 🎯 Deployment Strategy

**Platform**: Native Ubuntu Server with systemd services  
**No Docker**: Direct installation for better performance and simpler management  
**Process Manager**: PM2 for Node.js applications  
**Reverse Proxy**: Nginx  
**SSL**: Let's Encrypt (certbot)

---

## 📋 Prerequisites

### Server Requirements

**Minimum:**
- Ubuntu 20.04 LTS or later
- 8GB RAM
- 4 CPU cores
- 100GB+ disk space
- Root or sudo access

**Recommended:**
- Ubuntu 22.04 LTS
- 16GB RAM
- 8 CPU cores
- 500GB+ SSD storage
- Dedicated GPU for media processing

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

# Install FFmpeg for video processing
sudo apt install -y ffmpeg

# Install Git
sudo apt install -y git
```

---

## 🔧 Environment Configuration

### 1. Create Application User

```bash
# Create dedicated user
sudo adduser aladdin
sudo usermod -aG sudo aladdin

# Switch to aladdin user
sudo su - aladdin
```

### 2. Clone Repository

```bash
# Clone to /var/www (or /home/aladdin)
cd /var/www
sudo git clone https://github.com/your-org/aladdin.git
sudo chown -R aladdin:aladdin /var/www/aladdin
cd aladdin
```

### 3. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Build application
pnpm build
```

### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URI=mongodb://localhost:27017/aladdin
DATABASE_URI_OPEN=mongodb://localhost:27017
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
NEXT_PUBLIC_APP_URL=https://your-domain.com
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
# Run the command that PM2 outputs (as root)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u aladdin --hp /home/aladdin
```

### 3. PM2 Management Commands

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

# Reload with zero downtime
pm2 reload aladdin
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

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

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

## 🚨 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs aladdin --lines 100

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
pm2 env 0

# Restart PM2
pm2 restart aladdin
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --eval "db.adminCommand('ismaster')"

# Restart MongoDB
sudo systemctl restart mongod
```

### Memory Issues

```bash
# Check memory usage
free -h

# Check PM2 memory
pm2 list

# Check Node.js process memory
ps aux | grep node

# Restart with memory cleanup
pm2 reload aladdin
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

### Medium Term (Within 1 week)

- [ ] Setup monitoring (Sentry, New Relic, etc.)
- [ ] Configure backups
- [ ] Review performance metrics
- [ ] Optimize slow queries
- [ ] Plan scaling strategy
- [ ] Document any custom configurations
- [ ] Test disaster recovery procedures

---

## 📚 Related Documentation

- [Environment Variables](./environment-variables.md) - Complete configuration reference
- [Monitoring Setup](./monitoring.md) - Production monitoring guide
- [SSL Configuration](./ssl.md) - SSL/TLS setup details
- [Backup Strategy](./backup.md) - Data backup procedures
- [System Overview](../02-architecture/system-overview.md) - Architecture understanding
- [Technology Stack](../02-architecture/tech-stack.md) - Technology details
- [Quick Start Guide](../01-getting-started/quick-start.md) - Local development setup
- [Operations Guide](../08-operations/) - Production operations

---

## 🔒 Security Hardening

### Basic Security

```bash
# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw deny 3000  # Block direct access to Node.js

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### Application Security

- [ ] All environment variables secured
- [ ] API endpoints have authentication
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular security updates

---

## 📞 Support

### Emergency Contacts

1. **Application Issues**: Check PM2 logs first
2. **Server Issues**: Check system logs
3. **Database Issues**: Check MongoDB logs
4. **Network Issues**: Check Nginx logs

### Debug Commands

```bash
# System status
sudo systemctl status nginx mongod redis-server

# Application status
pm2 status
pm2 logs aladdin

# Resource usage
htop
df -h
free -h

# Network status
sudo netstat -tlnp
```

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Target**: Ubuntu 20.04+ Server (No Docker)
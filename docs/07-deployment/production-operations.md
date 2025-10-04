# Production Operations

**Purpose**: Ongoing maintenance, monitoring, and security for production deployment  
**Updated**: October 4, 2025

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

# Check Node.js version
node --version  # Should be 20.x
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

# Check Nginx status
sudo systemctl status nginx
```

### Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh --eval "db.adminCommand('ismaster')"

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB configuration
cat /etc/mongod.conf
```

### Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Restart Redis
sudo systemctl restart redis-server
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

# Check for memory leaks
pm2 monit
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check certificate files
ls -la /etc/letsencrypt/live/your-domain.com/

# Verify certificate
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout
```

---

## 🔒 Security Hardening

### Basic Security

```bash
# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw deny 3000  # Block direct access to Node.js

# Check firewall status
sudo ufw status verbose

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check fail2ban status
sudo fail2ban-client status
```

### Application Security

- [ ] All environment variables secured
- [ ] API endpoints have authentication
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular security updates

### Security Updates

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Check for security updates
sudo apt list --upgradable

# Update Node.js packages
cd /var/www/aladdin
pnpm update

# Audit for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

---

## 📊 Performance Monitoring

### System Monitoring

```bash
# Check system load
uptime

# Check CPU usage
top
htop

# Check memory usage
free -h

# Check disk usage
df -h

# Check disk I/O
iotop

# Check network connections
netstat -tulpn
ss -tulpn
```

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# Check PM2 logs
pm2 logs aladdin

# Check application metrics
pm2 show aladdin

# Check cluster status
pm2 describe aladdin
```

### Database Monitoring

```bash
# MongoDB stats
mongosh --eval "db.stats()"

# Check MongoDB connections
mongosh --eval "db.serverStatus().connections"

# Check MongoDB operations
mongosh --eval "db.serverStatus().opcounters"

# Redis info
redis-cli info
```

---

## 🔄 Backup Strategy

### Database Backups

```bash
# Create backup script
cat > backup-mongodb.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="aladdin"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/aladdin_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: aladdin_$DATE.tar.gz"
EOF

chmod +x backup-mongodb.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/aladdin/backup-mongodb.sh
```

### Application Backups

```bash
# Create application backup script
cat > backup-app.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/aladdin"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/aladdin"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Backup environment files
cp $APP_DIR/.env.production $BACKUP_DIR/env_$DATE

# Backup PM2 configuration
pm2 save > $BACKUP_DIR/pm2_$DATE.json

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "env_*" -mtime +7 -delete
find $BACKUP_DIR -name "pm2_*" -mtime +7 -delete

echo "Application backup completed: app_$DATE.tar.gz"
EOF

chmod +x backup-app.sh

# Add to crontab (daily at 3 AM)
crontab -e
# Add: 0 3 * * * /var/www/aladdin/backup-app.sh
```

### Restore from Backup

```bash
# Restore MongoDB
mongorestore --db aladdin /var/backups/mongodb/20241004_020000/aladdin

# Restore application
tar -xzf /var/backups/aladdin/app_20241004_030000.tar.gz -C /var/www/aladdin

# Restore environment
cp /var/backups/aladdin/env_20241004_030000 /var/www/aladdin/.env.production

# Restart application
pm2 restart aladdin
```

---

## 📈 Scaling Guide

### Vertical Scaling

```bash
# Add more memory
# 1. Check current memory
free -h

# 2. Create swap file (if needed)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 3. Increase PM2 memory limit
pm2 delete aladdin
# Edit ecosystem.config.js to increase max_memory_restart
pm2 start ecosystem.config.js
```

### Horizontal Scaling

```bash
# Add more PM2 instances
pm2 delete aladdin

# Edit ecosystem.config.js
# Change instances: 'max' to specific number
# instances: 4,

pm2 start ecosystem.config.js
```

### Database Scaling

```bash
# MongoDB optimization
# Edit /etc/mongod.conf
# Add:
# operationProfiling:
#   slowOpThresholdMs: 100
#   mode: slowOp

# Restart MongoDB
sudo systemctl restart mongod

# Create indexes
mongosh aladdin
# db.collection.createIndex({field: 1})
```

---

## 📝 Maintenance Tasks

### Daily Tasks

- [ ] Check PM2 status
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Check memory usage
- [ ] Verify backups completed

### Weekly Tasks

- [ ] Update system packages
- [ ] Check SSL certificate expiry
- [ ] Review performance metrics
- [ ] Test backup restoration
- [ ] Audit security logs

### Monthly Tasks

- [ ] Update Node.js packages
- [ ] Review and rotate secrets
- [ ] Optimize database queries
- [ ] Clean up old logs
- [ ] Update documentation

---

## 📞 Support & Emergency Contacts

### Emergency Commands

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

### Emergency Procedures

1. **Application Down**
   - Check PM2 status
   - Review error logs
   - Restart services
   - Check system resources

2. **Database Issues**
   - Check MongoDB status
   - Review database logs
   - Check disk space
   - Restore from backup if needed

3. **High Load**
   - Check system resources
   - Identify bottlenecks
   - Scale resources
   - Optimize queries

---

## 📚 Related Documentation

- [Deployment Prerequisites](./deployment-prerequisites.md) - Server setup
- [Application Deployment](./application-deployment.md) - Deploy steps
- [Environment Variables](./environment-variables.md) - Configuration
- [Monitoring Setup](./monitoring.md) - Detailed monitoring
- [Security Hardening](./security-hardening.md) - Security guide
- [Troubleshooting](../09-troubleshooting/) - Common issues

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Next Review**: January 4, 2026
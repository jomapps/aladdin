# Deployment Prerequisites

**Purpose**: Server requirements and initial setup for Ubuntu deployment  
**Target Environment**: Ubuntu 20.04+ Server  
**Updated**: October 4, 2025

---

## 🎯 Deployment Strategy

**Platform**: Native Ubuntu Server with systemd services  
**No Docker**: Direct installation for better performance and simpler management  
**Process Manager**: PM2 for Node.js applications  
**Reverse Proxy**: Nginx  
**SSL**: Let's Encrypt (certbot)

---

## 📋 Server Requirements

### Minimum Specifications

- **OS**: Ubuntu 20.04 LTS or later
- **RAM**: 8GB
- **CPU**: 4 cores
- **Storage**: 100GB+ disk space
- **Access**: Root or sudo access

### Recommended Specifications

- **OS**: Ubuntu 22.04 LTS
- **RAM**: 16GB
- **CPU**: 8 cores
- **Storage**: 500GB+ SSD storage
- **GPU**: Dedicated GPU for media processing (optional)

---

## 🛠️ Required Software Installation

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20.x LTS

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Install Package Manager

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Install Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Install Web Server

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx
```

### Install SSL Certificate Tool

```bash
# Install certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Install Database (MongoDB)

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
sudo systemctl status mongod
```

### Install Cache Server (Redis)

```bash
# Install Redis
sudo apt install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify installation
sudo systemctl status redis-server
redis-cli ping  # Should return PONG
```

### Install Media Processing Tools

```bash
# Install FFmpeg for video processing
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
```

### Install Version Control

```bash
# Install Git
sudo apt install -y git

# Verify installation
git --version

# Configure Git (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 🔧 System Configuration

### Create Application User

```bash
# Create dedicated user for Aladdin
sudo adduser aladdin

# Add user to sudo group
sudo usermod -aG sudo aladdin

# Switch to aladdin user
sudo su - aladdin
```

### Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/aladdin

# Set ownership to aladdin user
sudo chown -R aladdin:aladdin /var/www/aladdin

# Navigate to application directory
cd /var/www/aladdin
```

### Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH access
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Check firewall status
sudo ufw status

# Block direct access to Node.js port (optional)
sudo ufw deny 3000
```

---

## 📊 Resource Planning

### Memory Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Next.js Application | 2GB | 4GB |
| MongoDB | 2GB | 4GB |
| Redis | 512MB | 1GB |
| System OS | 1GB | 2GB |
| **Total** | **5.5GB** | **11GB** |

### CPU Requirements

| Load Type | Minimum | Recommended |
|-----------|---------|-------------|
| Light (1-3 users) | 2 cores | 4 cores |
| Medium (4-10 users) | 4 cores | 8 cores |
| Heavy (10+ users) | 8 cores | 16+ cores |

### Storage Requirements

| Data Type | Estimated Size | Growth Rate |
|-----------|----------------|-------------|
| Application Code | 500MB | Static |
| MongoDB Data | 10GB+ | 1GB/month per project |
| Media Files | 50GB+ | 5GB/month per project |
| Logs | 1GB+ | 100MB/month |
| **Total First Year** | **61.5GB+** | **6GB+/month** |

---

## 🧪 Verification Checklist

### System Verification

- [ ] Ubuntu 20.04+ installed
- [ ] System packages updated
- [ ] Firewall configured
- [ ] Application user created
- [ ] Directory structure created

### Software Verification

- [ ] Node.js 20.x installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] PM2 installed (`pm2 --version`)
- [ ] Nginx installed and running (`sudo systemctl status nginx`)
- [ ] MongoDB installed and running (`sudo systemctl status mongod`)
- [ ] Redis installed and running (`sudo systemctl status redis-server`)
- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] Git installed (`git --version`)

### Network Verification

- [ ] Server accessible via SSH
- [ ] Nginx default page accessible (http://your-server-ip)
- [ ] Firewall rules configured
- [ ] Domain name pointing to server (if applicable)

---

## 📚 Related Documentation

- [Ubuntu Deployment Guide](./ubuntu-deployment.md) - Complete deployment steps
- [Environment Variables](./environment-variables.md) - Configuration reference
- [SSL Configuration](./ssl.md) - HTTPS setup
- [Monitoring Setup](./monitoring.md) - Production monitoring
- [System Overview](../02-architecture/system-overview.md) - Architecture understanding

---

## 🆘 Troubleshooting

### Common Installation Issues

1. **Node.js Version Issues**
   ```bash
   # Remove old versions
   sudo apt remove nodejs npm
   
   # Clean apt cache
   sudo apt autoremove
   sudo apt autoclean
   
   # Reinstall using NodeSource
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **MongoDB Won't Start**
   ```bash
   # Check MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   
   # Check configuration
   cat /etc/mongod.conf
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis status
   sudo systemctl status redis-server
   
   # Test connection
   redis-cli ping
   
   # Check Redis config
   cat /etc/redis/redis.conf
   ```

### Permission Issues

```bash
# Fix directory permissions
sudo chown -R aladdin:aladdin /var/www/aladdin
sudo chmod -R 755 /var/www/aladdin

# Fix PM2 permissions
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u aladdin --hp /home/aladdin
```

---

**Document Version**: 1.0.0  
**Last Updated**: October 4, 2025  
**Next Review**: January 4, 2026
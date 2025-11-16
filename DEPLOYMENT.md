# Qoqnuz Music - VPS Deployment Guide

Complete guide to deploy Qoqnuz Music on an Ubuntu VPS.

## Prerequisites

- Ubuntu 20.04/22.04 VPS
- Domain name (optional but recommended)
- Supabase project with credentials
- Cloudflare R2 bucket with credentials
- SSH access to your VPS

---

## Part 1: VPS Initial Setup

### 1. Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### 2. Update System

```bash
apt update && apt upgrade -y
```

### 3. Create Non-Root User (Optional but Recommended)

```bash
# Create user
adduser qoqnuz

# Add to sudo group
usermod -aG sudo qoqnuz

# Switch to new user
su - qoqnuz
```

### 4. Install Node.js (v18 or higher)

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version
```

### 5. Install pnpm

```bash
npm install -g pnpm
pnpm --version
```

### 6. Install PostgreSQL Client (for Supabase migrations)

```bash
sudo apt install -y postgresql-client
```

### 7. Install Git

```bash
sudo apt install -y git
```

---

## Part 2: Clone and Configure Application

### 1. Clone Repository

```bash
cd /home/qoqnuz  # or your preferred directory

# Clone the repo
git clone https://github.com/waqarahm3d/qoqnuzmedia.git
cd qoqnuzmedia

# Checkout the frontend branch
git checkout claude/analyze-project-01P6FZXPRsTB7k6QxY8QoYFh
```

### 2. Install Dependencies

```bash
cd web
pnpm install
```

### 3. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Add your actual credentials:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=qoqnuz-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com  # or http://your-vps-ip:3000
NODE_ENV=production

# Admin Configuration
ADMIN_EMAILS=your-admin-email@example.com
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Part 3: Database Setup (Supabase)

### 1. Run Migrations

```bash
cd /home/qoqnuz/qoqnuzmedia

# Get your Supabase database URL from Supabase Dashboard > Project Settings > Database
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres

# Run migrations
psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  -f supabase/migrations/20250114000000_initial_schema.sql

psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  -f supabase/migrations/20250115000000_add_profile_fields.sql

psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  -f supabase/migrations/20250115000001_add_genres.sql

psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  -f supabase/migrations/20250115000002_add_user_ban.sql

psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  -f supabase/migrations/20250115000003_add_email_to_profiles.sql
```

### 2. Seed Database (Optional)

```bash
psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  -f supabase/seed.sql
```

---

## Part 4: Build Application

### 1. Build Next.js App

```bash
cd /home/qoqnuz/qoqnuzmedia/web

# Build for production
pnpm build

# Test the build
pnpm start
```

**Visit:** `http://your-vps-ip:3000` to verify it works

Press `Ctrl+C` to stop the test server.

---

## Part 5: Production Deployment Options

Choose one of the following methods:

---

## Option A: PM2 (Recommended for VPS)

### 1. Install PM2

```bash
sudo npm install -g pm2
```

### 2. Create PM2 Ecosystem File

```bash
cd /home/qoqnuz/qoqnuzmedia/web
nano ecosystem.config.js
```

**Add this content:**

```javascript
module.exports = {
  apps: [
    {
      name: 'qoqnuz-music',
      script: 'pnpm',
      args: 'start',
      cwd: '/home/qoqnuz/qoqnuzmedia/web',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/qoqnuz/logs/qoqnuz-error.log',
      out_file: '/home/qoqnuz/logs/qoqnuz-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
```

**Save and exit**

### 3. Create Logs Directory

```bash
mkdir -p /home/qoqnuz/logs
```

### 4. Start Application with PM2

```bash
cd /home/qoqnuz/qoqnuzmedia/web

# Start the app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command that PM2 outputs
```

### 5. Manage PM2 Process

```bash
# Check status
pm2 status

# View logs
pm2 logs qoqnuz-music

# Restart app
pm2 restart qoqnuz-music

# Stop app
pm2 stop qoqnuz-music

# Monitor
pm2 monit
```

---

## Option B: Systemd Service

### 1. Create Systemd Service File

```bash
sudo nano /etc/systemd/system/qoqnuz-music.service
```

**Add this content:**

```ini
[Unit]
Description=Qoqnuz Music Streaming Platform
After=network.target

[Service]
Type=simple
User=qoqnuz
WorkingDirectory=/home/qoqnuz/qoqnuzmedia/web
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save and exit**

### 2. Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start qoqnuz-music

# Enable on boot
sudo systemctl enable qoqnuz-music

# Check status
sudo systemctl status qoqnuz-music

# View logs
sudo journalctl -u qoqnuz-music -f
```

---

## Part 6: Setup Nginx Reverse Proxy

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/qoqnuz-music
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or VPS IP

    # Increase client body size for file uploads
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for streaming
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

**Save and exit**

### 3. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/qoqnuz-music /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow SSH (if not already allowed)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Part 7: Setup SSL with Let's Encrypt (Optional but Recommended)

**Only if you have a domain name pointing to your VPS**

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Replace with your actual domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 3. Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up auto-renewal
```

---

## Part 8: Deployment Script for Updates

Create a deployment script for easy updates:

```bash
nano /home/qoqnuz/deploy.sh
```

**Add this content:**

```bash
#!/bin/bash

echo "🚀 Deploying Qoqnuz Music..."

# Navigate to project
cd /home/qoqnuz/qoqnuzmedia

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin claude/analyze-project-01P6FZXPRsTB7k6QxY8QoYFh

# Install dependencies
echo "📦 Installing dependencies..."
cd web
pnpm install

# Build application
echo "🔨 Building application..."
pnpm build

# Restart PM2 (or systemd)
echo "♻️  Restarting application..."
pm2 restart qoqnuz-music
# OR if using systemd:
# sudo systemctl restart qoqnuz-music

echo "✅ Deployment complete!"
echo "🌐 Visit: http://your-domain.com"
```

**Make it executable:**

```bash
chmod +x /home/qoqnuz/deploy.sh
```

**Run deployments:**

```bash
/home/qoqnuz/deploy.sh
```

---

## Part 9: Monitoring and Maintenance

### 1. Check Application Logs

**PM2:**
```bash
pm2 logs qoqnuz-music --lines 100
```

**Systemd:**
```bash
sudo journalctl -u qoqnuz-music -f
```

### 2. Check Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 3. Monitor System Resources

```bash
# With PM2
pm2 monit

# System resources
htop  # Install with: sudo apt install htop
```

### 4. Database Backups

```bash
# Backup Supabase database
pg_dump "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  > backup-$(date +%Y%m%d).sql

# Restore backup
psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" \
  < backup-20250116.sql
```

---

## Part 10: Troubleshooting

### App Not Starting

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 PID

# Check environment variables
cat /home/qoqnuz/qoqnuzmedia/web/.env.local

# Rebuild
cd /home/qoqnuz/qoqnuzmedia/web
pnpm build
```

### Nginx Errors

```bash
# Test nginx config
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

### Database Connection Issues

```bash
# Test connection
psql "postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres" -c "SELECT 1"

# Check Supabase project settings for correct URL
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R qoqnuz:qoqnuz /home/qoqnuz/qoqnuzmedia

# Fix permissions
chmod -R 755 /home/qoqnuz/qoqnuzmedia
```

---

## Summary

Your app should now be running at:

- **HTTP:** `http://your-vps-ip` or `http://your-domain.com`
- **HTTPS:** `https://your-domain.com` (if SSL configured)

**Key URLs:**
- Landing Page: `/`
- App Home: `/home`
- Search: `/search`
- Library: `/library`
- Admin Portal: `/admin`
- Sign In: `/auth/signin`

**Management Commands:**

```bash
# View app status
pm2 status

# View logs
pm2 logs qoqnuz-music

# Restart app
pm2 restart qoqnuz-music

# Deploy updates
/home/qoqnuz/deploy.sh
```

---

## Security Checklist

- [ ] Change default SSH port
- [ ] Setup SSH key authentication
- [ ] Disable root SSH login
- [ ] Configure UFW firewall
- [ ] Install fail2ban
- [ ] Setup SSL/HTTPS
- [ ] Regular system updates
- [ ] Database backups
- [ ] Monitor logs regularly

---

## Performance Optimization

### 1. Enable Gzip in Nginx

Add to your nginx config:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 2. Cache Static Assets

Next.js automatically optimizes static assets, but you can add nginx caching:

```nginx
location /_next/static {
    proxy_cache STATIC;
    proxy_pass http://localhost:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### 3. PM2 Cluster Mode

Already configured in the ecosystem.config.js with `instances: 'max'`

---

## Need Help?

- Check application logs: `pm2 logs qoqnuz-music`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify environment variables in `.env.local`
- Ensure Supabase and R2 credentials are correct
- Test database connection

---

**Your Qoqnuz Music app is now live! 🎵🚀**

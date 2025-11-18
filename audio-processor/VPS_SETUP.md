# VPS Setup Guide - Audio Processor Service

Complete step-by-step guide to set up your VPS for the audio downloading and processing system.

## Prerequisites

- Fresh Ubuntu 22.04 LTS VPS
- Root or sudo access
- At least 2GB RAM (4GB+ recommended)
- At least 20GB storage (more depending on usage)
- SSH access to your VPS

---

## Step 1: Initial VPS Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-vps-ip
# OR if using a non-root user:
ssh username@your-vps-ip
```

### 1.2 Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential software-properties-common curl wget git
```

### 1.3 Create Service User (Recommended for Security)

```bash
# Create a dedicated user for the service
sudo adduser audioprocessor

# Add user to sudo group
sudo usermod -aG sudo audioprocessor

# Switch to the new user
su - audioprocessor
```

---

## Step 2: Install Python 3.11+

### 2.1 Add Python PPA and Install

```bash
# Add deadsnakes PPA for latest Python versions
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Install pip
sudo apt install -y python3-pip

# Verify installation
python3.11 --version
# Should output: Python 3.11.x
```

### 2.2 Set Python 3.11 as Default (Optional)

```bash
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
sudo update-alternatives --config python3
# Select Python 3.11 from the list
```

---

## Step 3: Install FFmpeg (Critical for Audio Processing)

### 3.1 Install FFmpeg from Official Repository

```bash
# Install FFmpeg
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
# Should output FFmpeg version information

# Verify it includes all necessary codecs
ffmpeg -codecs | grep mp3
ffmpeg -codecs | grep aac
```

### 3.2 Alternative: Install Latest FFmpeg (If you need newer version)

```bash
# Add PPA for latest FFmpeg
sudo add-apt-repository ppa:savoury1/ffmpeg4 -y
sudo apt update
sudo apt install -y ffmpeg
```

---

## Step 4: Install Redis (For Queue Management)

### 4.1 Install Redis Server

```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should output: PONG
```

### 4.2 Configure Redis (Optional but Recommended)

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Recommended changes:
# 1. Set max memory: maxmemory 256mb
# 2. Set eviction policy: maxmemory-policy allkeys-lru
# 3. Enable persistence: save 900 1

# Restart Redis after changes
sudo systemctl restart redis-server
```

---

## Step 5: Install PostgreSQL (For Job Tracking)

### 5.1 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 5.2 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run:
CREATE DATABASE audio_processor;
CREATE USER audioprocessor WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE audio_processor TO audioprocessor;
\q

# Test connection
psql -U audioprocessor -d audio_processor -h localhost
# Enter password when prompted
```

---

## Step 6: Install Python Dependencies

### 6.1 Create Project Directory

```bash
# Create project directory
mkdir -p ~/audio-processor
cd ~/audio-processor

# Create Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel
```

### 6.2 Install Core Python Packages

```bash
# Install yt-dlp (YouTube downloader)
pip install yt-dlp

# Install audio processing libraries
pip install pydub

# Install FastAPI and web server
pip install fastapi uvicorn[standard]

# Install async HTTP client
pip install httpx aiohttp

# Install task queue
pip install celery redis

# Install database ORM
pip install sqlalchemy psycopg2-binary alembic

# Install utilities
pip install python-dotenv python-multipart aiofiles

# Install progress tracking
pip install tqdm

# Install metadata handling
pip install mutagen Pillow
```

### 6.3 Install SoundCloud Downloader

```bash
# Install scdl (SoundCloud downloader)
pip install scdl

# Verify installation
scdl --version
```

### 6.4 Create Requirements File

```bash
cat > requirements.txt << 'EOF'
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Downloaders
yt-dlp==2024.1.1
scdl==2.7.3

# Audio Processing
pydub==0.25.1
mutagen==1.47.0

# Task Queue
celery==5.3.6
redis==5.0.1

# Database
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1

# HTTP Clients
httpx==0.26.0
aiohttp==3.9.1

# Utilities
python-dotenv==1.0.0
aiofiles==23.2.1
tqdm==4.66.1
Pillow==10.2.0

# Monitoring
prometheus-client==0.19.0
EOF

# Install all dependencies
pip install -r requirements.txt
```

---

## Step 7: Install Additional System Dependencies

### 7.1 Install Audio Codecs and Libraries

```bash
# Install audio codecs
sudo apt install -y libavcodec-extra libavformat-dev libavutil-dev libswresample-dev

# Install media libraries
sudo apt install -y libmp3lame-dev libopus-dev libvorbis-dev

# Install image processing libraries (for thumbnails)
sudo apt install -y libjpeg-dev libpng-dev
```

---

## Step 8: Install Nginx (Reverse Proxy)

### 8.1 Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### 8.2 Configure Nginx for API

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/audio-processor

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /downloads/ {
        alias /home/audioprocessor/audio-processor/downloads/;
        autoindex off;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/audio-processor /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 9: Install SSL Certificate (Optional but Recommended)

### 9.1 Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 10: Configure Firewall

### 10.1 Setup UFW Firewall

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 11: Setup Systemd Services

### 11.1 Create FastAPI Service

```bash
sudo nano /etc/systemd/system/audio-processor-api.service
```

Add this content:

```ini
[Unit]
Description=Audio Processor API Service
After=network.target postgresql.service redis-server.service

[Service]
Type=notify
User=audioprocessor
Group=audioprocessor
WorkingDirectory=/home/audioprocessor/audio-processor
Environment="PATH=/home/audioprocessor/audio-processor/venv/bin"
ExecStart=/home/audioprocessor/audio-processor/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 11.2 Create Celery Worker Service

```bash
sudo nano /etc/systemd/system/audio-processor-worker.service
```

Add this content:

```ini
[Unit]
Description=Audio Processor Celery Worker
After=network.target redis-server.service

[Service]
Type=forking
User=audioprocessor
Group=audioprocessor
WorkingDirectory=/home/audioprocessor/audio-processor
Environment="PATH=/home/audioprocessor/audio-processor/venv/bin"
ExecStart=/home/audioprocessor/audio-processor/venv/bin/celery -A app.celery_app worker --loglevel=info --concurrency=2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 11.3 Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable audio-processor-api
sudo systemctl enable audio-processor-worker

# Services will be started after we deploy the application
```

---

## Step 12: Create Directory Structure

```bash
cd ~/audio-processor

# Create directory structure
mkdir -p {app,downloads,logs,temp}
mkdir -p downloads/{youtube,soundcloud,processed}
mkdir -p app/{api,services,models,utils}

# Set permissions
chmod 755 downloads
chmod 755 logs
chmod 755 temp
```

---

## Step 13: Environment Configuration

```bash
# Create .env file
nano .env
```

Add this content:

```bash
# Application
APP_NAME=Audio Processor
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-super-secret-key-change-this

# Database
DATABASE_URL=postgresql://audioprocessor:your_secure_password_here@localhost/audio_processor

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Storage
DOWNLOAD_DIR=/home/audioprocessor/audio-processor/downloads
TEMP_DIR=/home/audioprocessor/audio-processor/temp
MAX_STORAGE_GB=100

# Audio Settings
AUDIO_FORMAT=mp3
AUDIO_BITRATE=320
NORMALIZE_AUDIO=true

# Rate Limiting
MAX_CONCURRENT_DOWNLOADS=3
RATE_LIMIT_PER_MINUTE=10

# API Keys (if needed)
YOUTUBE_API_KEY=your-youtube-api-key
SOUNDCLOUD_CLIENT_ID=your-soundcloud-client-id

# Security
ALLOWED_HOSTS=your-domain.com,your-vps-ip
API_KEY=your-api-key-for-authentication
```

---

## Step 14: Verify Installation

### 14.1 Check All Services

```bash
# Check Python
python3.11 --version

# Check FFmpeg
ffmpeg -version

# Check Redis
redis-cli ping

# Check PostgreSQL
sudo systemctl status postgresql

# Check pip packages
source ~/audio-processor/venv/bin/activate
pip list
```

### 14.2 Test yt-dlp

```bash
# Test yt-dlp (use a short test video)
yt-dlp --version
yt-dlp -F https://www.youtube.com/watch?v=jNQXAC9IVRw
```

---

## Step 15: Security Hardening

### 15.1 Configure SSH Security

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# PermitRootLogin no
# PasswordAuthentication no  # Only if you have SSH keys set up
# Port 2222  # Change default SSH port

# Restart SSH
sudo systemctl restart sshd
```

### 15.2 Install Fail2Ban

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Copy configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Enable and start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Step 16: Setup Monitoring (Optional)

### 16.1 Install System Monitoring

```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install disk usage analyzer
sudo apt install -y ncdu

# Monitor services
sudo journalctl -u audio-processor-api -f
sudo journalctl -u audio-processor-worker -f
```

---

## Next Steps

After completing this setup, you're ready to:

1. Deploy the application code
2. Run database migrations
3. Start the services
4. Test the API endpoints

## Troubleshooting

### FFmpeg not found
```bash
which ffmpeg
# If empty, reinstall
sudo apt install -y ffmpeg
```

### Redis connection issues
```bash
sudo systemctl status redis-server
sudo systemctl restart redis-server
```

### PostgreSQL connection issues
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

### Permission issues
```bash
sudo chown -R audioprocessor:audioprocessor ~/audio-processor
chmod -R 755 ~/audio-processor
```

### Python package issues
```bash
source ~/audio-processor/venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

---

## Maintenance Commands

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Python packages
source ~/audio-processor/venv/bin/activate
pip install --upgrade -r requirements.txt

# Clear temp files
rm -rf ~/audio-processor/temp/*

# Check disk usage
df -h
ncdu ~/audio-processor/downloads

# View logs
tail -f ~/audio-processor/logs/app.log
sudo journalctl -u audio-processor-api -n 100
```

---

## Resources

- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Celery Documentation](https://docs.celeryq.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Your VPS is now ready for the audio processor application!**

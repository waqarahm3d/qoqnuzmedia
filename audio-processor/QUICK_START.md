# Audio Processor - Quick Start Guide

## Fastest Way to Get Started on Your VPS

### Step 1: Connect and Update

```bash
ssh your-username@your-vps-ip
sudo apt update && sudo apt upgrade -y
```

### Step 2: Run the Auto-Setup Script

```bash
# Download and run the setup script
curl -o setup.sh https://raw.githubusercontent.com/your-repo/audio-processor/main/setup.sh
chmod +x setup.sh
./setup.sh
```

OR manually install core dependencies:

```bash
# Install Python 3.11
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install FFmpeg
sudo apt install -y ffmpeg

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### Step 3: Setup Database

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE audio_processor;"
sudo -u postgres psql -c "CREATE USER audioprocessor WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE audio_processor TO audioprocessor;"
```

### Step 4: Deploy the Application

```bash
# Clone or upload the audio-processor directory
cd ~
# If using git:
# git clone your-repo-url audio-processor

# Navigate to project
cd audio-processor

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 5: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://audioprocessor:your_password@localhost/audio_processor

# Redis
REDIS_URL=redis://localhost:6379/0

# Directories (will be created automatically)
DOWNLOAD_DIR=/home/your-username/audio-processor/downloads
TEMP_DIR=/home/your-username/audio-processor/temp

# Audio Settings
AUDIO_FORMAT=mp3
AUDIO_BITRATE=320
NORMALIZE_AUDIO=true

# Security
API_KEY=your-secret-api-key-change-this
WHITELIST_ENABLED=true
WHITELISTED_CHANNELS=UC_channel_id_1,UC_channel_id_2

# Download Limits
MAX_CONCURRENT_DOWNLOADS=3
RATE_LIMIT_PER_MINUTE=10
EOF
```

### Step 6: Initialize Database

```bash
# Still in virtual environment
python -c "from app.database import init_db; init_db()"
```

### Step 7: Start the Services

#### Option A: Manual Start (for testing)

```bash
# Terminal 1 - Start API
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 - Start Worker
source venv/bin/activate
celery -A app.celery_app worker --loglevel=info
```

#### Option B: Systemd Services (for production)

```bash
# Copy the service files
sudo cp systemd/audio-processor-api.service /etc/systemd/system/
sudo cp systemd/audio-processor-worker.service /etc/systemd/system/

# Update the service files with your username
sudo sed -i 's/audioprocessor/your-username/g' /etc/systemd/system/audio-processor-*.service

# Reload and start
sudo systemctl daemon-reload
sudo systemctl start audio-processor-api
sudo systemctl start audio-processor-worker
sudo systemctl enable audio-processor-api
sudo systemctl enable audio-processor-worker

# Check status
sudo systemctl status audio-processor-api
sudo systemctl status audio-processor-worker
```

### Step 8: Test the System

```bash
# Test the API
curl http://localhost:8000/health

# Submit a test download (use your own YouTube video)
curl -X POST http://localhost:8000/api/v1/download \
  -H "X-API-Key: your-secret-api-key-change-this" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
    "source_type": "youtube",
    "download_type": "single"
  }'

# Check job status (replace JOB_ID with the ID from above)
curl http://localhost:8000/api/v1/jobs/JOB_ID \
  -H "X-API-Key: your-secret-api-key-change-this"
```

### Step 9: Setup Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/audio-processor
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/audio-processor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 10: Monitor and Maintain

```bash
# View logs
sudo journalctl -u audio-processor-api -f
sudo journalctl -u audio-processor-worker -f

# Check disk usage
df -h
du -sh ~/audio-processor/downloads

# View active jobs
curl http://localhost:8000/api/v1/jobs?status=active \
  -H "X-API-Key: your-secret-api-key-change-this"
```

## 🚀 You're All Set!

Your audio processor is now running. Access the web interface at:
- Local: `http://localhost:8000`
- Remote: `http://your-vps-ip:8000` or `http://your-domain.com`

## Common Issues & Solutions

### FFmpeg not found
```bash
sudo apt install -y ffmpeg
ffmpeg -version
```

### Redis connection failed
```bash
sudo systemctl status redis-server
sudo systemctl restart redis-server
redis-cli ping  # Should return PONG
```

### Database connection error
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"  # List databases
```

### Permission denied errors
```bash
chmod -R 755 ~/audio-processor
chown -R $USER:$USER ~/audio-processor
```

## What's Next?

1. **Add Your Content Sources**: Update `WHITELISTED_CHANNELS` in `.env`
2. **Test Downloads**: Use the web interface or API
3. **Setup Automation**: Create cron jobs for scheduled downloads
4. **Monitor Storage**: Set up alerts for disk space
5. **Backup**: Regular backups of database and downloads

## Need Help?

- Check logs: `~/audio-processor/logs/`
- System logs: `sudo journalctl -xe`
- Test components individually before running full system

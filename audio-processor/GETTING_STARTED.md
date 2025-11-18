# Getting Started with Audio Processor

**Welcome!** This guide will get you up and running quickly.

---

## 🚀 Choose Your Path

### Path 1: Quick Start (Recommended for Testing)
**Time: ~10 minutes**

Perfect if you want to test the system quickly.

1. **Read**: [QUICK_START.md](QUICK_START.md)
2. **Do**: Follow Steps 1-10
3. **Result**: Working system for testing

### Path 2: Full VPS Setup (Production-Ready)
**Time: ~1 hour**

Perfect for production deployment with full control.

1. **Read**: [VPS_SETUP.md](VPS_SETUP.md)
2. **Do**: Complete all 16 steps
3. **Result**: Production-ready deployment

### Path 3: Docker Deployment (Easiest)
**Time: ~15 minutes**

Perfect for most users - isolated, scalable, easy to maintain.

1. **Read**: [DEPLOYMENT.md](DEPLOYMENT.md) - Docker section
2. **Do**: Follow Docker deployment steps
3. **Result**: Containerized production deployment

---

## 📋 Prerequisites

Before you start, ensure you have:

- [ ] VPS or server with Ubuntu 22.04 LTS
- [ ] SSH access to your server
- [ ] Domain name (optional but recommended)
- [ ] Basic command line knowledge

---

## 🎯 Quick Decision Guide

**Choose Quick Start if:**
- You want to test the system first
- You're learning how it works
- You need it running ASAP

**Choose Full VPS Setup if:**
- You need production deployment
- You want full control
- You're comfortable with Linux administration

**Choose Docker if:**
- You want the easiest deployment
- You need to scale easily
- You prefer containerized applications

---

## 📚 Documentation Overview

### Essential Guides
1. **[README.md](README.md)** - Project overview and features
2. **[QUICK_START.md](QUICK_START.md)** - Get running in 10 minutes
3. **[VPS_SETUP.md](VPS_SETUP.md)** - Complete VPS setup (16 steps)
4. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment options and production guide

### Reference
- **[.env.example](.env.example)** - All configuration options
- **[requirements.txt](requirements.txt)** - Python dependencies
- **[docker-compose.yml](docker-compose.yml)** - Docker configuration

---

## 🔑 First Steps (After Installation)

### 1. Configure Your API Key

```bash
# Generate a secure API key
openssl rand -hex 32

# Add to .env file
echo "API_KEY=your_generated_key" >> .env
```

### 2. Test the Installation

```bash
# Check health
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","environment":"production",...}
```

### 3. Access the Web Interface

Open browser: `http://your-server-ip:8000`

- Enter your API key
- Submit a test download
- Monitor progress

### 4. Test API Directly

```bash
# Submit a download
curl -X POST http://localhost:8000/api/v1/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=YOUR_VIDEO",
    "source_type": "youtube",
    "download_type": "single"
  }'

# Returns: {"job_id":"...","status":"queued",...}

# Check job status
curl http://localhost:8000/api/v1/jobs/JOB_ID \
  -H "X-API-Key: your-api-key"
```

---

## 🔧 Essential Configuration

### For Testing (Minimal Setup)

```bash
# .env file
DATABASE_URL=postgresql://user:pass@localhost/audio_processor
REDIS_URL=redis://localhost:6379/0
API_KEY=test-api-key
DOWNLOAD_DIR=/home/user/audio-processor/downloads
```

### For Production (Complete Setup)

```bash
# .env file
# Use strong passwords and keys
DATABASE_URL=postgresql://audioprocessor:STRONG_PASSWORD@localhost/audio_processor
REDIS_URL=redis://localhost:6379/0
API_KEY=STRONG_API_KEY_HERE
SECRET_KEY=STRONG_SECRET_KEY

# Enable whitelist for your content only
WHITELIST_ENABLED=true
WHITELISTED_CHANNELS=UC_your_youtube_channel_id
WHITELISTED_SOUNDCLOUD=your_soundcloud_username

# Storage
DOWNLOAD_DIR=/path/to/downloads
MAX_STORAGE_GB=100

# Audio quality
AUDIO_FORMAT=mp3
AUDIO_BITRATE=320
NORMALIZE_AUDIO=true

# Rate limiting
MAX_CONCURRENT_DOWNLOADS=3
RATE_LIMIT_PER_MINUTE=10
```

---

## 📖 Usage Examples

### Example 1: Download Single YouTube Video

```bash
curl -X POST http://localhost:8000/api/v1/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "source_type": "youtube",
    "download_type": "single"
  }'
```

### Example 2: Download YouTube Playlist

```bash
curl -X POST http://localhost:8000/api/v1/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID",
    "source_type": "youtube",
    "download_type": "playlist"
  }'
```

### Example 3: Download SoundCloud Track

```bash
curl -X POST http://localhost:8000/api/v1/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://soundcloud.com/artist/track",
    "source_type": "soundcloud",
    "download_type": "single"
  }'
```

### Example 4: Check System Statistics

```bash
curl http://localhost:8000/api/v1/stats \
  -H "X-API-Key: your-api-key"
```

---

## 🛠️ Common Tasks

### Start Services

```bash
# Docker
docker-compose up -d

# Systemd
sudo systemctl start audio-processor-api
sudo systemctl start audio-processor-worker
```

### View Logs

```bash
# Docker
docker-compose logs -f

# Systemd
sudo journalctl -u audio-processor-api -f
```

### Stop Services

```bash
# Docker
docker-compose down

# Systemd
sudo systemctl stop audio-processor-api
sudo systemctl stop audio-processor-worker
```

### Update the Application

```bash
# Pull latest code
git pull

# Docker - rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Manual - restart services
pip install -r requirements.txt
sudo systemctl restart audio-processor-api
sudo systemctl restart audio-processor-worker
```

---

## 🔍 Monitoring

### Check System Health

```bash
curl http://localhost:8000/api/v1/health/detailed
```

### Monitor Active Jobs

```bash
curl http://localhost:8000/api/v1/jobs?status_filter=downloading \
  -H "X-API-Key: your-api-key"
```

### View Celery Tasks (Flower)

Access: `http://your-server:5555`

---

## 🆘 Troubleshooting Quick Reference

### API Won't Start
```bash
# Check port 8000
sudo lsof -i :8000

# Check logs
docker-compose logs api
# OR
sudo journalctl -u audio-processor-api -n 50
```

### Downloads Failing
```bash
# Check FFmpeg
ffmpeg -version

# Check yt-dlp
yt-dlp --version

# Update yt-dlp
pip install --upgrade yt-dlp
```

### Database Connection Error
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U audioprocessor -d audio_processor -h localhost
```

### Storage Full
```bash
# Check disk space
df -h

# Clean temp files
rm -rf ~/audio-processor/temp/*

# Check download directory size
du -sh ~/audio-processor/downloads
```

---

## 📞 Getting Help

### Documentation
1. Start with [README.md](README.md)
2. Check [QUICK_START.md](QUICK_START.md)
3. Read [VPS_SETUP.md](VPS_SETUP.md)
4. Review [DEPLOYMENT.md](DEPLOYMENT.md)

### Logs
- Application: `logs/app.log`
- Docker: `docker-compose logs`
- Systemd: `sudo journalctl -u audio-processor-*`

### Health Checks
- Basic: `curl http://localhost:8000/health`
- Detailed: `curl http://localhost:8000/api/v1/health/detailed`

---

## 🎉 Next Steps

After getting started:

1. **Test with a sample download** - Use your own content
2. **Configure whitelist** - Add your channels/users
3. **Set up monitoring** - Use Flower for Celery monitoring
4. **Configure webhooks** - Get notified when downloads complete
5. **Integrate with Qoqnuz** - Connect to your music platform

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Web Interface (Port 8000)                      │
│  └─> FastAPI Application                        │
│       └─> REST API Endpoints                    │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Background Workers                             │
│  └─> Celery Workers                             │
│       ├─> YouTube Downloader                    │
│       ├─> SoundCloud Downloader                 │
│       └─> Audio Processor                       │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Data Stores                                    │
│  ├─> PostgreSQL (Jobs, Tracks, Stats)          │
│  └─> Redis (Task Queue, Results)               │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  File System                                    │
│  ├─> downloads/ (Processed audio files)        │
│  ├─> temp/ (Temporary files)                   │
│  └─> logs/ (Application logs)                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

**You're all set! Happy downloading! 🎵**

Choose your path above and start building your audio library!

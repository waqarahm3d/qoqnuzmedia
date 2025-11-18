# Audio Processor - Deployment Guide

Complete deployment guide for production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [VPS Deployment (Manual)](#vps-deployment-manual)
4. [Docker Deployment](#docker-deployment)
5. [Configuration](#configuration)
6. [Starting Services](#starting-services)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 22.04 LTS (recommended) or compatible Linux distribution
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB, recommended based on usage
- **Network**: Stable internet connection

### Software Requirements
- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- FFmpeg
- Nginx (optional, for production)

---

## Deployment Options

### Option 1: Manual VPS Deployment
- Full control over configuration
- Better for customization
- Follow [VPS_SETUP.md](VPS_SETUP.md) for detailed steps

### Option 2: Docker Deployment
- Fastest deployment
- Isolated environment
- Easy scaling
- Recommended for most users

---

## VPS Deployment (Manual)

### Step 1: Follow VPS Setup Guide

Complete all steps in [VPS_SETUP.md](VPS_SETUP.md):
- Install Python 3.11
- Install FFmpeg
- Install PostgreSQL
- Install Redis
- Configure systemd services

### Step 2: Clone or Upload Application

```bash
cd ~
# If using git:
git clone your-repo-url audio-processor
# OR upload files manually

cd audio-processor
```

### Step 3: Create Virtual Environment

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment

```bash
cp .env.example .env
nano .env
```

Update these critical values:
- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `API_KEY`
- `DOWNLOAD_DIR`
- `WHITELISTED_CHANNELS` (if using whitelist)

### Step 5: Initialize Database

```bash
source venv/bin/activate
python -c "from app.database import init_db; init_db()"
```

### Step 6: Start Services

#### Option A: Manual Start (for testing)

```bash
# Terminal 1 - API
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Terminal 2 - Worker
source venv/bin/activate
celery -A app.celery_app worker --loglevel=info --concurrency=2

# Terminal 3 - Beat (scheduler)
source venv/bin/activate
celery -A app.celery_app beat --loglevel=info
```

#### Option B: Systemd Services (recommended for production)

```bash
# Copy service files (if not already done in VPS_SETUP.md)
sudo cp systemd/*.service /etc/systemd/system/

# Update service files with your username
sudo sed -i 's/audioprocessor/your-username/g' /etc/systemd/system/audio-processor-*.service

# Start services
sudo systemctl daemon-reload
sudo systemctl start audio-processor-api
sudo systemctl start audio-processor-worker
sudo systemctl enable audio-processor-api
sudo systemctl enable audio-processor-worker

# Check status
sudo systemctl status audio-processor-api
sudo systemctl status audio-processor-worker
```

---

## Docker Deployment

### Step 1: Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Prepare Environment

```bash
cd audio-processor

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Update these Docker-specific variables:
```bash
DB_PASSWORD=your_secure_database_password
SECRET_KEY=your-secret-key
API_KEY=your-api-key
MAX_STORAGE_GB=100
WHITELIST_ENABLED=true
WHITELISTED_CHANNELS=your_channel_ids
```

### Step 3: Create Download Directories

```bash
mkdir -p downloads temp logs
chmod 755 downloads temp logs
```

### Step 4: Build and Start Containers

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 5: Initialize Database

```bash
# Run database initialization
docker-compose exec api python -c "from app.database import init_db; init_db()"
```

### Step 6: Verify Deployment

```bash
# Check health
curl http://localhost:8000/health

# Check detailed health
curl http://localhost:8000/api/v1/health/detailed
```

---

## Configuration

### Essential Configuration

#### 1. API Key Setup
```bash
# Generate a secure API key
openssl rand -hex 32

# Add to .env
API_KEY=your_generated_key
```

#### 2. Database Configuration
```bash
# For manual deployment
DATABASE_URL=postgresql://audioprocessor:password@localhost/audio_processor

# For Docker deployment (handled automatically)
DB_PASSWORD=your_password
```

#### 3. Whitelist Configuration (for own content)
```bash
WHITELIST_ENABLED=true
WHITELISTED_CHANNELS=UC_your_youtube_channel_id,UC_another_channel
WHITELISTED_SOUNDCLOUD=your_soundcloud_username
```

#### 4. Storage Configuration
```bash
DOWNLOAD_DIR=/path/to/downloads
MAX_STORAGE_GB=100  # Adjust based on your needs
```

### Optional Configuration

#### Webhook Notifications
```bash
WEBHOOK_ENABLED=true
WEBHOOK_URL=https://your-platform.com/webhook/downloads
```

#### Audio Quality
```bash
AUDIO_FORMAT=mp3
AUDIO_BITRATE=320  # kbps
NORMALIZE_AUDIO=true
```

---

## Starting Services

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d api

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f api
docker-compose logs -f worker

# Execute commands in container
docker-compose exec api python -c "print('Hello')"
```

### Systemd Commands (Manual Deployment)

```bash
# Start services
sudo systemctl start audio-processor-api
sudo systemctl start audio-processor-worker

# Stop services
sudo systemctl stop audio-processor-api
sudo systemctl stop audio-processor-worker

# Restart services
sudo systemctl restart audio-processor-api

# View logs
sudo journalctl -u audio-processor-api -f
sudo journalctl -u audio-processor-worker -f

# Enable auto-start on boot
sudo systemctl enable audio-processor-api
sudo systemctl enable audio-processor-worker
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Basic health check
curl http://localhost:8000/health

# Detailed health check
curl http://localhost:8000/api/v1/health/detailed

# Check specific job
curl -H "X-API-Key: your-api-key" \
  http://localhost:8000/api/v1/jobs/JOB_ID
```

### Monitoring Tools

#### Flower (Celery Monitoring)
Access at: `http://your-server:5555`

```bash
# Start Flower (if not using Docker)
celery -A app.celery_app flower --port=5555
```

#### System Metrics

```bash
# Check disk usage
df -h
du -sh /path/to/downloads

# Check memory usage
free -h

# Check CPU usage
htop

# Check service status
sudo systemctl status audio-processor-*
```

### Log Management

```bash
# View application logs
tail -f logs/app.log

# View Celery logs
tail -f logs/celery.log

# Docker logs
docker-compose logs -f --tail=100

# Systemd logs
sudo journalctl -u audio-processor-api -n 100
```

### Database Maintenance

```bash
# Backup database
pg_dump -U audioprocessor audio_processor > backup_$(date +%Y%m%d).sql

# Restore database
psql -U audioprocessor audio_processor < backup_20240101.sql

# Clean old stats (keep last 30 days)
# Run via Python
python << EOF
from app.database import get_db_session
from app.models import SystemStats
from datetime import datetime, timedelta

with get_db_session() as db:
    cutoff = datetime.utcnow() - timedelta(days=30)
    db.query(SystemStats).filter(SystemStats.recorded_at < cutoff).delete()
    db.commit()
EOF
```

### Cleanup Tasks

```bash
# Clean temporary files
rm -rf temp/*

# Clean old logs (older than 30 days)
find logs/ -name "*.log" -mtime +30 -delete

# Clean failed downloads
# Access API endpoint
curl -X DELETE -H "X-API-Key: your-api-key" \
  http://localhost:8000/api/v1/jobs/cleanup/failed
```

---

## Troubleshooting

### Common Issues

#### API Not Starting

```bash
# Check logs
sudo journalctl -u audio-processor-api -n 50

# Common causes:
# 1. Port 8000 already in use
sudo lsof -i :8000
# Kill process if needed
sudo kill -9 PID

# 2. Database connection error
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U audioprocessor -d audio_processor -h localhost
```

#### Worker Not Processing Jobs

```bash
# Check worker status
sudo systemctl status audio-processor-worker

# Check Redis
redis-cli ping

# Check Celery
celery -A app.celery_app inspect active

# Restart worker
sudo systemctl restart audio-processor-worker
```

#### Download Failures

```bash
# Check FFmpeg
ffmpeg -version

# Check yt-dlp
yt-dlp --version

# Update yt-dlp
pip install --upgrade yt-dlp

# Check disk space
df -h

# Check permissions
ls -la downloads/
```

#### Permission Errors

```bash
# Fix ownership
sudo chown -R $USER:$USER /path/to/audio-processor

# Fix permissions
chmod -R 755 /path/to/audio-processor/downloads
chmod -R 755 /path/to/audio-processor/temp
chmod -R 755 /path/to/audio-processor/logs
```

### Debug Mode

Enable debug mode for detailed error messages:

```bash
# In .env
DEBUG=True
ENVIRONMENT=development

# Restart services
sudo systemctl restart audio-processor-api
```

### Getting Help

1. Check logs for error messages
2. Verify all services are running
3. Test individual components
4. Check system resources (disk, memory, CPU)
5. Review configuration files

---

## Production Checklist

Before going to production:

- [ ] Change default `SECRET_KEY`
- [ ] Set strong `API_KEY`
- [ ] Configure database with strong password
- [ ] Enable whitelist if using for own content
- [ ] Set up SSL/TLS (via Nginx or Cloudflare)
- [ ] Configure firewall (UFW)
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Test download and processing
- [ ] Set up log rotation
- [ ] Configure resource limits
- [ ] Test failover and recovery
- [ ] Document custom configuration

---

## Scaling

### Horizontal Scaling

```bash
# Add more Celery workers
docker-compose scale worker=4

# Or with systemd, create additional worker services
sudo cp /etc/systemd/system/audio-processor-worker.service \
  /etc/systemd/system/audio-processor-worker-2.service

# Edit and start
sudo systemctl start audio-processor-worker-2
```

### Performance Tuning

```bash
# Increase worker concurrency
# In docker-compose.yml or systemd service:
--concurrency=4

# Adjust PostgreSQL connection pool
# In config.py:
pool_size=20
max_overflow=40
```

---

## Security Best Practices

1. **API Key**: Use strong, random API keys
2. **Database**: Use strong passwords, restrict access
3. **Firewall**: Only expose necessary ports
4. **Updates**: Keep all dependencies up to date
5. **Backups**: Regular automated backups
6. **Monitoring**: Monitor for suspicious activity
7. **Rate Limiting**: Configure appropriate limits
8. **Whitelist**: Enable for authorized content only

---

## Support

For issues and questions:
- Check [VPS_SETUP.md](VPS_SETUP.md) for setup help
- Check [QUICK_START.md](QUICK_START.md) for quick reference
- Review logs for error messages
- Check [README.md](README.md) for general documentation

---

**Your Audio Processor is now deployed and ready to use!** 🚀

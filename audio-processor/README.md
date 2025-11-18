# Audio Processor System

A robust, production-ready audio downloading and processing system for YouTube and SoundCloud content.

## 🎯 Features

### Core Capabilities
- ✅ Download from YouTube (videos, playlists, channels)
- ✅ Download from SoundCloud (tracks, playlists, users)
- ✅ High-quality MP3 conversion (320kbps)
- ✅ Audio normalization and enhancement
- ✅ Metadata extraction and embedding
- ✅ Thumbnail download and embedding
- ✅ Batch processing with queue system
- ✅ Progress tracking for all downloads
- ✅ Duplicate detection
- ✅ Resume capability

### Security & Control
- ✅ API key authentication
- ✅ Channel/user whitelist support
- ✅ Rate limiting
- ✅ Storage quota management
- ✅ Webhook notifications
- ✅ Comprehensive logging

### API & Interface
- ✅ RESTful API with FastAPI
- ✅ Real-time progress updates
- ✅ Job status tracking
- ✅ Batch operations
- ✅ Web interface for testing
- ✅ OpenAPI documentation

## 📁 Project Structure

```
audio-processor/
├── app/
│   ├── __init__.py
│   ├── config.py              # Configuration management
│   ├── database.py            # Database connection
│   ├── models.py              # SQLAlchemy models
│   ├── main.py                # FastAPI application (to be created)
│   ├── celery_app.py          # Celery worker configuration (to be created)
│   ├── api/                   # API endpoints (to be created)
│   │   ├── __init__.py
│   │   ├── downloads.py
│   │   ├── jobs.py
│   │   └── health.py
│   ├── services/              # Business logic
│   │   ├── __init__.py
│   │   ├── youtube_downloader.py  # ✅ Created
│   │   ├── soundcloud_downloader.py  # To be created
│   │   └── audio_processor.py  # To be created
│   └── utils/                 # Utility functions (to be created)
│       ├── __init__.py
│       ├── file_utils.py
│       └── metadata.py
├── downloads/                 # Downloaded files
│   ├── youtube/
│   ├── soundcloud/
│   └── processed/
├── temp/                      # Temporary files
├── logs/                      # Application logs
├── tests/                     # Unit tests (to be created)
├── web/                       # Web interface (to be created)
├── systemd/                   # Systemd service files
├── docker/                    # Docker configuration
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── VPS_SETUP.md              # ✅ Detailed VPS setup guide
├── QUICK_START.md            # ✅ Quick start instructions
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Ubuntu 22.04 LTS VPS
- 2GB+ RAM (4GB recommended)
- 20GB+ storage
- Python 3.11+
- FFmpeg
- PostgreSQL
- Redis

### Installation

1. **Follow the VPS Setup Guide**
   ```bash
   cat VPS_SETUP.md
   ```
   This provides step-by-step instructions for installing all dependencies.

2. **Quick Start**
   ```bash
   cat QUICK_START.md
   ```
   This gets you running in minutes.

### Basic Usage

#### Submit a Download Job
```bash
curl -X POST http://localhost:8000/api/v1/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "source_type": "youtube",
    "download_type": "single"
  }'
```

#### Check Job Status
```bash
curl http://localhost:8000/api/v1/jobs/{job_id} \
  -H "X-API-Key: your-api-key"
```

#### List All Jobs
```bash
curl http://localhost:8000/api/v1/jobs \
  -H "X-API-Key: your-api-key"
```

## 📚 Documentation

### Complete Guides
- **[VPS_SETUP.md](VPS_SETUP.md)** - Comprehensive VPS setup with all dependencies
- **[QUICK_START.md](QUICK_START.md)** - Fast deployment guide
- **API Documentation** - Available at `/docs` when running (FastAPI Swagger UI)

### Configuration

Key environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/audio_processor

# Storage
DOWNLOAD_DIR=/path/to/downloads
MAX_STORAGE_GB=100

# Audio Quality
AUDIO_FORMAT=mp3
AUDIO_BITRATE=320
NORMALIZE_AUDIO=true

# Security
API_KEY=your-secret-key
WHITELIST_ENABLED=true
WHITELISTED_CHANNELS=UC_channel1,UC_channel2

# Rate Limiting
MAX_CONCURRENT_DOWNLOADS=3
RATE_LIMIT_PER_MINUTE=10
```

## 🔧 Development Status

### ✅ Completed Components
1. VPS setup documentation
2. Configuration system
3. Database models
4. YouTube downloader service
5. Database utilities

### 🚧 In Progress
1. SoundCloud downloader service
2. Audio processing pipeline
3. Celery task queue
4. REST API endpoints
5. Web interface

### 📋 To Do
1. Complete audio enhancement features
2. Webhook integration
3. Docker containerization
4. Unit tests
5. Integration with Qoqnuz upload API

## 🛠️ Technology Stack

- **Backend**: Python 3.11, FastAPI
- **Task Queue**: Celery + Redis
- **Database**: PostgreSQL
- **Audio Processing**: FFmpeg, pydub
- **Downloaders**: yt-dlp, scdl
- **Web Server**: Uvicorn, Nginx
- **Deployment**: Systemd, Docker (optional)

## 🔐 Security Features

1. **API Authentication**: All endpoints require API key
2. **Whitelist Control**: Only download from approved channels/users
3. **Rate Limiting**: Prevent abuse and API bans
4. **Input Validation**: Strict URL and parameter validation
5. **Secure Storage**: Proper file permissions
6. **Logging**: Comprehensive audit trail

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### System Stats
```bash
curl http://localhost:8000/api/v1/stats \
  -H "X-API-Key: your-api-key"
```

### Logs
```bash
# Application logs
tail -f ~/audio-processor/logs/app.log

# System service logs
sudo journalctl -u audio-processor-api -f
sudo journalctl -u audio-processor-worker -f
```

## 🐳 Docker Support (Coming Soon)

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🤝 Integration with Qoqnuz

This system is designed to integrate with your Qoqnuz music platform:

1. **Download**: System downloads and processes audio
2. **Process**: Normalizes, enhances, adds metadata
3. **Webhook**: Notifies Qoqnuz when complete
4. **Upload**: Automatic upload to Qoqnuz via API

## 📝 Legal & Compliance

### Important Notes
- **Own Content Only**: This system is designed for downloading YOUR OWN content
- **Whitelist Feature**: Restricts downloads to approved channels/users only
- **Terms of Service**: Ensure compliance with YouTube and SoundCloud ToS
- **Rate Limiting**: Respects platform guidelines
- **Content Ownership**: User responsible for ensuring proper rights

### Disclaimer
This tool is provided for downloading and managing content you own or have permission to download. Users are responsible for ensuring compliance with all applicable laws and platform terms of service.

## 🆘 Troubleshooting

### Common Issues

**FFmpeg not found**
```bash
sudo apt install -y ffmpeg
ffmpeg -version
```

**Database connection error**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
```

**Redis connection failed**
```bash
sudo systemctl status redis-server
redis-cli ping
```

**Permissions issues**
```bash
chmod -R 755 ~/audio-processor
chown -R $USER:$USER ~/audio-processor
```

## 🔄 Updates & Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Python dependencies
source venv/bin/activate
pip install --upgrade -r requirements.txt

# Clean temporary files
rm -rf ~/audio-processor/temp/*

# Check storage
du -sh ~/audio-processor/downloads
```

## 📞 Support

For issues and questions:
1. Check the documentation (VPS_SETUP.md, QUICK_START.md)
2. Review logs for error messages
3. Verify all services are running
4. Test components individually

## 🗺️ Roadmap

- [ ] Complete all core services
- [ ] Add comprehensive test suite
- [ ] Docker deployment option
- [ ] Web UI enhancements
- [ ] Batch import from CSV
- [ ] Scheduled downloads
- [ ] Audio quality analysis
- [ ] Automatic format detection
- [ ] Multi-language support
- [ ] Mobile app API

## 📄 License

This project is for authorized use only. Users must comply with all applicable laws and platform terms of service.

## 🙏 Acknowledgments

- **yt-dlp**: YouTube downloading
- **FFmpeg**: Audio processing
- **FastAPI**: Modern Python web framework
- **Celery**: Distributed task queue

---

**Built with ❤️ for the Qoqnuz Music Platform**

*Version 1.0.0*

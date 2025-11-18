"""
Configuration Management
Handles environment variables and application settings
"""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "Audio Processor"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-this-secret-key-in-production"
    API_KEY: str = "your-api-key-for-authentication"

    # Database
    DATABASE_URL: str = "postgresql://audioprocessor:password@localhost/audio_processor"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Storage Paths
    BASE_DIR: Path = Path(__file__).parent.parent
    DOWNLOAD_DIR: Path = BASE_DIR / "downloads"
    TEMP_DIR: Path = BASE_DIR / "temp"
    LOG_DIR: Path = BASE_DIR / "logs"

    # Storage Limits
    MAX_STORAGE_GB: int = 100
    MAX_FILE_SIZE_MB: int = 500

    # Audio Settings
    AUDIO_FORMAT: str = "mp3"
    AUDIO_BITRATE: int = 320  # kbps
    AUDIO_SAMPLE_RATE: int = 48000  # Hz
    NORMALIZE_AUDIO: bool = True
    NOISE_REDUCTION: bool = False

    # Download Settings
    MAX_CONCURRENT_DOWNLOADS: int = 3
    RATE_LIMIT_PER_MINUTE: int = 10
    DOWNLOAD_TIMEOUT: int = 3600  # seconds
    RETRY_ATTEMPTS: int = 3
    RETRY_DELAY: int = 5  # seconds

    # YouTube Settings
    YOUTUBE_API_KEY: Optional[str] = None
    YOUTUBE_QUALITY: str = "bestaudio"

    # SoundCloud Settings
    SOUNDCLOUD_CLIENT_ID: Optional[str] = None
    SOUNDCLOUD_AUTH_TOKEN: Optional[str] = None

    # Security
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1"]
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Whitelist (for authorized content only)
    WHITELISTED_CHANNELS: list[str] = []  # YouTube channel IDs
    WHITELISTED_SOUNDCLOUD: list[str] = []  # SoundCloud user URLs
    WHITELIST_ENABLED: bool = False

    # Webhook Notifications
    WEBHOOK_URL: Optional[str] = None
    WEBHOOK_ENABLED: bool = False

    # File Naming
    FILENAME_TEMPLATE: str = "{artist} - {title}"
    FOLDER_BY_SOURCE: bool = True
    FOLDER_BY_DATE: bool = True

    @validator("DOWNLOAD_DIR", "TEMP_DIR", "LOG_DIR", pre=True)
    def create_directories(cls, v):
        """Ensure directories exist"""
        path = Path(v)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @validator("ALLOWED_HOSTS", "CORS_ORIGINS", "WHITELISTED_CHANNELS", "WHITELISTED_SOUNDCLOUD", pre=True)
    def parse_list(cls, v):
        """Parse comma-separated strings into lists"""
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Ensure subdirectories exist
(settings.DOWNLOAD_DIR / "youtube").mkdir(exist_ok=True)
(settings.DOWNLOAD_DIR / "soundcloud").mkdir(exist_ok=True)
(settings.DOWNLOAD_DIR / "processed").mkdir(exist_ok=True)
settings.TEMP_DIR.mkdir(exist_ok=True)
settings.LOG_DIR.mkdir(exist_ok=True)

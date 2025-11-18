"""
Supabase-specific configuration for audio processor
This configuration adapts the audio processor to work with Supabase database
"""

from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent


class SupabaseSettings(BaseSettings):
    """
    Configuration settings for Supabase integration
    """

    # =========================================================================
    # Supabase Connection
    # =========================================================================
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Database URL (PostgreSQL connection string for direct DB access)
    # Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # =========================================================================
    # Application Settings
    # =========================================================================
    APP_NAME: str = "Audio Processor"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this")
    API_KEY: str = os.getenv("AUDIO_PROCESSOR_API_KEY", "")

    # =========================================================================
    # Redis Configuration
    # =========================================================================
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # =========================================================================
    # Celery Configuration
    # =========================================================================
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

    # =========================================================================
    # Storage Settings (using Cloudflare R2)
    # =========================================================================
    # Downloads go to local temp, then uploaded to R2 via Next.js API
    DOWNLOAD_DIR: Path = Path(os.getenv("DOWNLOAD_DIR", str(BASE_DIR / "downloads")))
    TEMP_DIR: Path = Path(os.getenv("TEMP_DIR", str(BASE_DIR / "temp")))
    MAX_STORAGE_GB: int = int(os.getenv("MAX_STORAGE_GB", "100"))
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "500"))

    # =========================================================================
    # Audio Processing Settings
    # =========================================================================
    AUDIO_FORMAT: str = os.getenv("AUDIO_FORMAT", "mp3")
    AUDIO_BITRATE: int = int(os.getenv("AUDIO_BITRATE", "320"))
    AUDIO_SAMPLE_RATE: int = int(os.getenv("AUDIO_SAMPLE_RATE", "48000"))
    NORMALIZE_AUDIO: bool = os.getenv("NORMALIZE_AUDIO", "true").lower() == "true"
    NOISE_REDUCTION: bool = os.getenv("NOISE_REDUCTION", "false").lower() == "true"

    # =========================================================================
    # Download Settings
    # =========================================================================
    MAX_CONCURRENT_DOWNLOADS: int = int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "3"))
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
    DOWNLOAD_TIMEOUT: int = int(os.getenv("DOWNLOAD_TIMEOUT", "3600"))
    RETRY_ATTEMPTS: int = int(os.getenv("RETRY_ATTEMPTS", "3"))
    RETRY_DELAY: int = int(os.getenv("RETRY_DELAY", "5"))

    # =========================================================================
    # Whitelist Configuration
    # =========================================================================
    WHITELIST_ENABLED: bool = os.getenv("WHITELIST_ENABLED", "false").lower() == "true"

    # =========================================================================
    # Callback Configuration
    # =========================================================================
    # Callback URL for status updates (Qoqnuz Next.js API)
    CALLBACK_URL: str = os.getenv("CALLBACK_URL", "")

    # Main app URL
    NEXT_APP_URL: str = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = SupabaseSettings()

# Ensure directories exist
settings.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

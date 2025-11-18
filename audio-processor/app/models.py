"""
Database Models
Defines the database schema for job tracking
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import validates

Base = declarative_base()


class JobStatus(str, Enum):
    """Download job status"""
    PENDING = "pending"
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SourceType(str, Enum):
    """Content source platform"""
    YOUTUBE = "youtube"
    SOUNDCLOUD = "soundcloud"


class DownloadType(str, Enum):
    """Type of download"""
    SINGLE = "single"
    PLAYLIST = "playlist"
    CHANNEL = "channel"


class DownloadJob(Base):
    """Download job tracking"""
    __tablename__ = "download_jobs"

    id = Column(String, primary_key=True)  # UUID
    source_type = Column(String, nullable=False)  # youtube/soundcloud
    download_type = Column(String, nullable=False)  # single/playlist/channel
    url = Column(Text, nullable=False)
    status = Column(String, default=JobStatus.PENDING)

    # Progress tracking
    total_items = Column(Integer, default=0)
    completed_items = Column(Integer, default=0)
    failed_items = Column(Integer, default=0)
    progress_percent = Column(Float, default=0.0)

    # Metadata
    title = Column(String, nullable=True)
    artist = Column(String, nullable=True)
    thumbnail_url = Column(Text, nullable=True)

    # Results
    downloaded_files = Column(JSON, default=[])  # List of file paths
    output_directory = Column(Text, nullable=True)

    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Settings snapshot
    settings = Column(JSON, default={})  # Store job-specific settings

    # Celery task ID
    task_id = Column(String, nullable=True)

    # User/API key tracking
    api_key = Column(String, nullable=True)
    user_id = Column(String, nullable=True)

    def __repr__(self):
        return f"<DownloadJob {self.id} - {self.source_type} - {self.status}>"

    @property
    def is_complete(self) -> bool:
        """Check if job is in a terminal state"""
        return self.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]

    @property
    def duration(self) -> float | None:
        """Calculate job duration in seconds"""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        elif self.started_at:
            return (datetime.utcnow() - self.started_at).total_seconds()
        return None

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "source_type": self.source_type,
            "download_type": self.download_type,
            "url": self.url,
            "status": self.status,
            "progress": {
                "total_items": self.total_items,
                "completed_items": self.completed_items,
                "failed_items": self.failed_items,
                "percent": round(self.progress_percent, 2)
            },
            "metadata": {
                "title": self.title,
                "artist": self.artist,
                "thumbnail_url": self.thumbnail_url
            },
            "results": {
                "downloaded_files": self.downloaded_files,
                "output_directory": self.output_directory
            },
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "timestamps": {
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "started_at": self.started_at.isoformat() if self.started_at else None,
                "completed_at": self.completed_at.isoformat() if self.completed_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
                "duration": self.duration
            },
            "task_id": self.task_id
        }


class ProcessedTrack(Base):
    """Processed audio track metadata"""
    __tablename__ = "processed_tracks"

    id = Column(String, primary_key=True)  # UUID
    job_id = Column(String, nullable=False)  # Reference to DownloadJob

    # Source information
    source_type = Column(String, nullable=False)
    source_url = Column(Text, nullable=False)
    source_id = Column(String, nullable=True)  # YouTube video ID, SoundCloud track ID

    # File information
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    duration = Column(Float, nullable=True)  # seconds

    # Audio properties
    format = Column(String, default="mp3")
    bitrate = Column(Integer, nullable=True)  # kbps
    sample_rate = Column(Integer, nullable=True)  # Hz

    # Metadata
    title = Column(String, nullable=True)
    artist = Column(String, nullable=True)
    album = Column(String, nullable=True)
    thumbnail_path = Column(Text, nullable=True)

    # Processing flags
    is_normalized = Column(Boolean, default=False)
    is_enhanced = Column(Boolean, default=False)

    # Hash for duplicate detection
    file_hash = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ProcessedTrack {self.id} - {self.title}>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "job_id": self.job_id,
            "source": {
                "type": self.source_type,
                "url": self.source_url,
                "id": self.source_id
            },
            "file": {
                "path": self.file_path,
                "size": self.file_size,
                "duration": self.duration
            },
            "audio": {
                "format": self.format,
                "bitrate": self.bitrate,
                "sample_rate": self.sample_rate
            },
            "metadata": {
                "title": self.title,
                "artist": self.artist,
                "album": self.album,
                "thumbnail_path": self.thumbnail_path
            },
            "processing": {
                "is_normalized": self.is_normalized,
                "is_enhanced": self.is_enhanced
            },
            "file_hash": self.file_hash,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None
        }


class SystemStats(Base):
    """System statistics and monitoring"""
    __tablename__ = "system_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Storage stats
    total_storage_used = Column(Integer, default=0)  # bytes
    total_files = Column(Integer, default=0)

    # Job stats
    total_jobs = Column(Integer, default=0)
    completed_jobs = Column(Integer, default=0)
    failed_jobs = Column(Integer, default=0)
    active_jobs = Column(Integer, default=0)

    # Processing stats
    total_downloads = Column(Integer, default=0)
    total_duration_processed = Column(Float, default=0.0)  # total audio hours

    # Platform breakdown
    youtube_downloads = Column(Integer, default=0)
    soundcloud_downloads = Column(Integer, default=0)

    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "storage": {
                "total_used_bytes": self.total_storage_used,
                "total_used_gb": round(self.total_storage_used / (1024**3), 2),
                "total_files": self.total_files
            },
            "jobs": {
                "total": self.total_jobs,
                "completed": self.completed_jobs,
                "failed": self.failed_jobs,
                "active": self.active_jobs
            },
            "processing": {
                "total_downloads": self.total_downloads,
                "total_duration_hours": round(self.total_duration_processed / 3600, 2)
            },
            "platforms": {
                "youtube": self.youtube_downloads,
                "soundcloud": self.soundcloud_downloads
            },
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }

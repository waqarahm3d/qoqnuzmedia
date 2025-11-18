"""
File Utility Functions
Helper functions for file operations
"""

import os
import shutil
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from ..config import settings

logger = logging.getLogger(__name__)


def get_directory_size(directory: str) -> int:
    """
    Get total size of directory in bytes

    Args:
        directory: Path to directory

    Returns:
        Size in bytes
    """
    total_size = 0
    try:
        for dirpath, dirnames, filenames in os.walk(directory):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                if os.path.exists(filepath):
                    total_size += os.path.getsize(filepath)
    except Exception as e:
        logger.error(f"Error calculating directory size: {e}")
    return total_size


def get_available_space(directory: str) -> int:
    """
    Get available disk space

    Args:
        directory: Path to check

    Returns:
        Available space in bytes
    """
    try:
        stat = shutil.disk_usage(directory)
        return stat.free
    except Exception as e:
        logger.error(f"Error getting available space: {e}")
        return 0


def check_storage_quota() -> dict:
    """
    Check if storage quota is exceeded

    Returns:
        Dictionary with storage information
    """
    try:
        download_dir_size = get_directory_size(str(settings.DOWNLOAD_DIR))
        available_space = get_available_space(str(settings.DOWNLOAD_DIR))

        max_storage_bytes = settings.MAX_STORAGE_GB * 1024 * 1024 * 1024

        return {
            'used_bytes': download_dir_size,
            'used_gb': round(download_dir_size / (1024 ** 3), 2),
            'available_bytes': available_space,
            'available_gb': round(available_space / (1024 ** 3), 2),
            'max_storage_gb': settings.MAX_STORAGE_GB,
            'quota_exceeded': download_dir_size > max_storage_bytes,
            'usage_percent': round((download_dir_size / max_storage_bytes) * 100, 2) if max_storage_bytes > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error checking storage quota: {e}")
        return {}


def clean_temp_files(older_than_hours: int = 24) -> int:
    """
    Clean temporary files older than specified hours

    Args:
        older_than_hours: Remove files older than this many hours

    Returns:
        Number of files deleted
    """
    deleted_count = 0
    try:
        now = datetime.now().timestamp()
        max_age_seconds = older_than_hours * 3600

        for file_path in settings.TEMP_DIR.glob("*"):
            if file_path.is_file():
                file_age = now - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    file_path.unlink()
                    deleted_count += 1
                    logger.info(f"Deleted temp file: {file_path}")

        logger.info(f"Cleaned {deleted_count} temporary files")
    except Exception as e:
        logger.error(f"Error cleaning temp files: {e}")

    return deleted_count


def organize_downloads_by_date(source_dir: Path) -> None:
    """
    Organize downloaded files into date-based folders

    Args:
        source_dir: Source directory containing files
    """
    try:
        for file_path in source_dir.glob("*.mp3"):
            if file_path.is_file():
                # Get file creation date
                file_date = datetime.fromtimestamp(file_path.stat().st_ctime)
                date_folder = source_dir / file_date.strftime("%Y-%m-%d")
                date_folder.mkdir(exist_ok=True)

                # Move file to date folder
                dest_path = date_folder / file_path.name
                if not dest_path.exists():
                    shutil.move(str(file_path), str(dest_path))
                    logger.info(f"Organized file: {file_path} -> {dest_path}")

    except Exception as e:
        logger.error(f"Error organizing downloads: {e}")


def find_duplicate_files(directory: str) -> List[dict]:
    """
    Find duplicate files in directory based on size and name

    Args:
        directory: Directory to search

    Returns:
        List of duplicate file groups
    """
    duplicates = []
    try:
        files_by_size = {}

        # Group files by size
        for file_path in Path(directory).rglob("*"):
            if file_path.is_file():
                size = file_path.stat().st_size
                if size not in files_by_size:
                    files_by_size[size] = []
                files_by_size[size].append(str(file_path))

        # Find duplicates
        for size, files in files_by_size.items():
            if len(files) > 1:
                duplicates.append({
                    'size': size,
                    'size_mb': round(size / (1024 * 1024), 2),
                    'count': len(files),
                    'files': files
                })

    except Exception as e:
        logger.error(f"Error finding duplicates: {e}")

    return duplicates


def create_download_directory(job_id: str, source_type: str, date_subfolder: bool = True) -> Path:
    """
    Create organized download directory for a job

    Args:
        job_id: Job ID
        source_type: Source platform (youtube/soundcloud)
        date_subfolder: Create date-based subfolder

    Returns:
        Path to created directory
    """
    try:
        # Base directory for source type
        base_dir = settings.DOWNLOAD_DIR / source_type

        # Add date subfolder if requested
        if date_subfolder and settings.FOLDER_BY_DATE:
            today = datetime.now().strftime("%Y-%m-%d")
            download_dir = base_dir / today / job_id
        else:
            download_dir = base_dir / job_id

        # Create directory
        download_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Created download directory: {download_dir}")
        return download_dir

    except Exception as e:
        logger.error(f"Error creating download directory: {e}")
        raise


def safe_delete_file(file_path: str) -> bool:
    """
    Safely delete a file with error handling

    Args:
        file_path: Path to file to delete

    Returns:
        True if successful, False otherwise
    """
    try:
        path = Path(file_path)
        if path.exists() and path.is_file():
            path.unlink()
            logger.info(f"Deleted file: {file_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {e}")
        return False


def safe_delete_directory(directory_path: str, recursive: bool = False) -> bool:
    """
    Safely delete a directory

    Args:
        directory_path: Path to directory
        recursive: Delete recursively

    Returns:
        True if successful, False otherwise
    """
    try:
        path = Path(directory_path)
        if path.exists() and path.is_dir():
            if recursive:
                shutil.rmtree(path)
            else:
                path.rmdir()  # Only works if empty
            logger.info(f"Deleted directory: {directory_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting directory {directory_path}: {e}")
        return False


def count_files_by_extension(directory: str) -> dict:
    """
    Count files by extension in directory

    Args:
        directory: Directory to analyze

    Returns:
        Dictionary with extension counts
    """
    counts = {}
    try:
        for file_path in Path(directory).rglob("*"):
            if file_path.is_file():
                ext = file_path.suffix.lower()
                if ext:
                    counts[ext] = counts.get(ext, 0) + 1
                else:
                    counts['no_extension'] = counts.get('no_extension', 0) + 1
    except Exception as e:
        logger.error(f"Error counting files: {e}")

    return counts


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format

    Args:
        size_bytes: Size in bytes

    Returns:
        Formatted string (e.g., "1.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def format_duration(seconds: float) -> str:
    """
    Format duration in human-readable format

    Args:
        seconds: Duration in seconds

    Returns:
        Formatted string (e.g., "1h 23m 45s")
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    parts = []
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if secs > 0 or not parts:
        parts.append(f"{secs}s")

    return " ".join(parts)


def get_file_metadata(file_path: str) -> dict:
    """
    Get basic file metadata

    Args:
        file_path: Path to file

    Returns:
        Dictionary with file metadata
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return {}

        stat = path.stat()

        return {
            'name': path.name,
            'size': stat.st_size,
            'size_formatted': format_file_size(stat.st_size),
            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'extension': path.suffix.lower(),
            'is_file': path.is_file(),
            'is_dir': path.is_dir()
        }
    except Exception as e:
        logger.error(f"Error getting file metadata: {e}")
        return {}

"""
Celery Tasks
Asynchronous background tasks for downloading and processing
"""

import logging
import uuid
from datetime import datetime
from typing import Dict
import requests
from celery import Task
from .celery_app import celery_app
from .services.youtube_downloader import YouTubeDownloader
from .services.soundcloud_downloader import SoundCloudDownloader
from .services.audio_processor import AudioProcessor
from .database import get_db_session
from .models import DownloadJob, ProcessedTrack, JobStatus, SystemStats
from .utils.file_utils import (
    check_storage_quota,
    clean_temp_files,
    get_directory_size,
    count_files_by_extension
)
from .config import settings

logger = logging.getLogger(__name__)


class CallbackTask(Task):
    """Base task class with progress callback support"""

    def update_progress(self, job_id: str, progress_data: Dict):
        """Update job progress in database"""
        try:
            with get_db_session() as db:
                job = db.query(DownloadJob).filter(DownloadJob.id == job_id).first()
                if job:
                    # Update progress
                    if 'percent' in progress_data:
                        job.progress_percent = float(progress_data['percent'])

                    if 'status' in progress_data:
                        if progress_data['status'] == 'downloading':
                            job.status = JobStatus.DOWNLOADING
                        elif progress_data['status'] == 'processing':
                            job.status = JobStatus.PROCESSING

                    job.updated_at = datetime.utcnow()
                    db.commit()

        except Exception as e:
            logger.error(f"Error updating progress for job {job_id}: {e}")


@celery_app.task(base=CallbackTask, bind=True, name='app.tasks.download_task')
def download_task(self, job_id: str, url: str, source_type: str, download_type: str) -> Dict:
    """
    Download audio from URL

    Args:
        job_id: Job ID
        url: Source URL
        source_type: 'youtube' or 'soundcloud'
        download_type: 'single', 'playlist', or 'channel'

    Returns:
        Dictionary with download results
    """
    logger.info(f"Starting download task for job {job_id}: {url}")

    try:
        # Update job status
        with get_db_session() as db:
            job = db.query(DownloadJob).filter(DownloadJob.id == job_id).first()
            if not job:
                raise Exception(f"Job {job_id} not found")

            job.status = JobStatus.DOWNLOADING
            job.started_at = datetime.utcnow()
            job.task_id = self.request.id
            db.commit()

        # Check storage quota
        storage_info = check_storage_quota()
        if storage_info.get('quota_exceeded', False):
            raise Exception("Storage quota exceeded")

        # Progress callback
        def progress_callback(progress_data):
            self.update_progress(job_id, progress_data)

        results = []

        # Download based on source type
        if source_type == 'youtube':
            downloader = YouTubeDownloader(progress_callback=progress_callback)

            if download_type == 'single':
                result = downloader.download_single(url)
                results = [result]
            elif download_type == 'playlist':
                results = downloader.download_playlist(url)
            elif download_type == 'channel':
                results = downloader.download_channel(url)
            else:
                raise ValueError(f"Invalid download type: {download_type}")

        elif source_type == 'soundcloud':
            downloader = SoundCloudDownloader(progress_callback=progress_callback)

            if download_type == 'single':
                result = downloader.download_single(url)
                results = [result]
            elif download_type == 'playlist':
                results = downloader.download_playlist(url)
            elif download_type == 'channel':
                results = downloader.download_user_tracks(url)
            else:
                raise ValueError(f"Invalid download type: {download_type}")

        else:
            raise ValueError(f"Invalid source type: {source_type}")

        # Process downloaded files
        processor = AudioProcessor()
        downloaded_files = []
        total_items = len(results)
        completed_items = 0
        failed_items = 0

        for result in results:
            if result.get('success'):
                try:
                    # Process the audio file
                    file_path = result['file_path']

                    # Extract metadata
                    audio_info = processor.get_audio_info(file_path)

                    # Embed metadata if available
                    if result.get('title') and result.get('artist'):
                        processor.embed_metadata(
                            file_path,
                            title=result.get('title'),
                            artist=result.get('artist'),
                            artwork_url=result.get('thumbnail')
                        )

                    # Save to processed tracks
                    track_id = str(uuid.uuid4())
                    with get_db_session() as db:
                        track = ProcessedTrack(
                            id=track_id,
                            job_id=job_id,
                            source_type=source_type,
                            source_url=url,
                            file_path=file_path,
                            file_size=audio_info.get('file_size', 0),
                            duration=audio_info.get('metadata', {}).get('duration', 0),
                            format=settings.AUDIO_FORMAT,
                            bitrate=settings.AUDIO_BITRATE,
                            title=result.get('title'),
                            artist=result.get('artist'),
                            is_normalized=settings.NORMALIZE_AUDIO,
                            file_hash=audio_info.get('file_hash')
                        )
                        db.add(track)
                        db.commit()

                    downloaded_files.append(file_path)
                    completed_items += 1

                except Exception as e:
                    logger.error(f"Error processing file {result.get('file_path')}: {e}")
                    failed_items += 1
            else:
                failed_items += 1

        # Update job with results
        with get_db_session() as db:
            job = db.query(DownloadJob).filter(DownloadJob.id == job_id).first()
            if job:
                job.status = JobStatus.COMPLETED
                job.completed_at = datetime.utcnow()
                job.total_items = total_items
                job.completed_items = completed_items
                job.failed_items = failed_items
                job.progress_percent = 100.0
                job.downloaded_files = downloaded_files
                db.commit()

        # Send webhook if configured
        if settings.WEBHOOK_ENABLED and settings.WEBHOOK_URL:
            send_webhook_notification(job_id, 'download_completed', {
                'total_items': total_items,
                'completed_items': completed_items,
                'failed_items': failed_items,
                'files': downloaded_files
            })

        logger.info(f"Download task completed for job {job_id}: {completed_items}/{total_items} successful")

        return {
            'success': True,
            'job_id': job_id,
            'total_items': total_items,
            'completed_items': completed_items,
            'failed_items': failed_items,
            'files': downloaded_files
        }

    except Exception as e:
        logger.error(f"Download task failed for job {job_id}: {e}")

        # Update job status to failed
        with get_db_session() as db:
            job = db.query(DownloadJob).filter(DownloadJob.id == job_id).first()
            if job:
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                db.commit()

        # Send webhook for failure
        if settings.WEBHOOK_ENABLED and settings.WEBHOOK_URL:
            send_webhook_notification(job_id, 'download_failed', {'error': str(e)})

        raise


@celery_app.task(name='app.tasks.process_audio_task')
def process_audio_task(file_path: str, job_id: str) -> Dict:
    """
    Process audio file (normalize, enhance, etc.)

    Args:
        file_path: Path to audio file
        job_id: Associated job ID

    Returns:
        Processing results
    """
    try:
        logger.info(f"Processing audio file: {file_path}")

        processor = AudioProcessor()

        # Process the audio
        result = processor.process_audio(
            file_path,
            normalize_audio=settings.NORMALIZE_AUDIO
        )

        logger.info(f"Audio processing completed: {file_path}")
        return result

    except Exception as e:
        logger.error(f"Audio processing failed for {file_path}: {e}")
        raise


@celery_app.task(name='app.tasks.cleanup_temp_files_task')
def cleanup_temp_files_task() -> int:
    """
    Cleanup temporary files (periodic task)

    Returns:
        Number of files deleted
    """
    try:
        logger.info("Running temp files cleanup")
        deleted_count = clean_temp_files(older_than_hours=24)
        logger.info(f"Cleanup completed: {deleted_count} files deleted")
        return deleted_count
    except Exception as e:
        logger.error(f"Cleanup task failed: {e}")
        return 0


@celery_app.task(name='app.tasks.update_system_stats_task')
def update_system_stats_task() -> Dict:
    """
    Update system statistics (periodic task)

    Returns:
        Updated statistics
    """
    try:
        logger.info("Updating system statistics")

        with get_db_session() as db:
            # Count jobs
            total_jobs = db.query(DownloadJob).count()
            completed_jobs = db.query(DownloadJob).filter(
                DownloadJob.status == JobStatus.COMPLETED
            ).count()
            failed_jobs = db.query(DownloadJob).filter(
                DownloadJob.status == JobStatus.FAILED
            ).count()
            active_jobs = db.query(DownloadJob).filter(
                DownloadJob.status.in_([JobStatus.DOWNLOADING, JobStatus.PROCESSING, JobStatus.QUEUED])
            ).count()

            # Count processed tracks
            total_downloads = db.query(ProcessedTrack).count()
            youtube_downloads = db.query(ProcessedTrack).filter(
                ProcessedTrack.source_type == 'youtube'
            ).count()
            soundcloud_downloads = db.query(ProcessedTrack).filter(
                ProcessedTrack.source_type == 'soundcloud'
            ).count()

            # Get total files count
            file_counts = count_files_by_extension(str(settings.DOWNLOAD_DIR))
            total_files = sum(file_counts.values())

            # Get storage used
            total_storage_used = get_directory_size(str(settings.DOWNLOAD_DIR))

            # Calculate total duration
            total_duration = db.query(ProcessedTrack).with_entities(
                ProcessedTrack.duration
            ).all()
            total_duration_seconds = sum([d[0] or 0 for d in total_duration])

            # Create stats record
            stats = SystemStats(
                total_storage_used=total_storage_used,
                total_files=total_files,
                total_jobs=total_jobs,
                completed_jobs=completed_jobs,
                failed_jobs=failed_jobs,
                active_jobs=active_jobs,
                total_downloads=total_downloads,
                total_duration_processed=total_duration_seconds,
                youtube_downloads=youtube_downloads,
                soundcloud_downloads=soundcloud_downloads
            )

            db.add(stats)
            db.commit()

            logger.info("System statistics updated successfully")

            return stats.to_dict()

    except Exception as e:
        logger.error(f"Stats update task failed: {e}")
        return {}


def send_webhook_notification(job_id: str, event: str, data: Dict) -> bool:
    """
    Send webhook notification

    Args:
        job_id: Job ID
        event: Event type
        data: Event data

    Returns:
        True if successful, False otherwise
    """
    try:
        if not settings.WEBHOOK_URL:
            return False

        payload = {
            'job_id': job_id,
            'event': event,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }

        response = requests.post(
            settings.WEBHOOK_URL,
            json=payload,
            timeout=10
        )

        response.raise_for_status()
        logger.info(f"Webhook sent successfully for job {job_id}: {event}")
        return True

    except Exception as e:
        logger.error(f"Failed to send webhook: {e}")
        return False

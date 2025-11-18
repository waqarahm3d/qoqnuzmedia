"""
Statistics API Endpoints
System and usage statistics
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta

from ..database import get_db
from ..models import DownloadJob, ProcessedTrack, SystemStats, JobStatus
from .dependencies import verify_api_key
from ..utils.file_utils import check_storage_quota, count_files_by_extension
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats")
async def get_system_stats(
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get overall system statistics

    Returns storage, job counts, and processing metrics
    """
    try:
        # Get latest stats from database
        latest_stats = db.query(SystemStats).order_by(desc(SystemStats.recorded_at)).first()

        # Get storage info
        storage_info = check_storage_quota()

        # Get file counts by extension
        file_counts = count_files_by_extension(str(settings.DOWNLOAD_DIR))

        # Get user's job stats
        user_jobs = db.query(DownloadJob).filter(DownloadJob.api_key == api_key)
        user_total_jobs = user_jobs.count()
        user_completed = user_jobs.filter(DownloadJob.status == JobStatus.COMPLETED).count()
        user_failed = user_jobs.filter(DownloadJob.status == JobStatus.FAILED).count()
        user_active = user_jobs.filter(
            DownloadJob.status.in_([JobStatus.DOWNLOADING, JobStatus.PROCESSING, JobStatus.QUEUED])
        ).count()

        # Get user's track counts
        user_job_ids = [job.id for job in user_jobs.all()]
        user_tracks = db.query(ProcessedTrack).filter(ProcessedTrack.job_id.in_(user_job_ids))
        user_total_tracks = user_tracks.count()
        user_youtube_tracks = user_tracks.filter(ProcessedTrack.source_type == 'youtube').count()
        user_soundcloud_tracks = user_tracks.filter(ProcessedTrack.source_type == 'soundcloud').count()

        return {
            'system': latest_stats.to_dict() if latest_stats else {},
            'storage': storage_info,
            'file_counts': file_counts,
            'user_stats': {
                'jobs': {
                    'total': user_total_jobs,
                    'completed': user_completed,
                    'failed': user_failed,
                    'active': user_active
                },
                'tracks': {
                    'total': user_total_tracks,
                    'youtube': user_youtube_tracks,
                    'soundcloud': user_soundcloud_tracks
                }
            }
        }

    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats/recent")
async def get_recent_activity(
    days: int = 7,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get recent activity statistics

    - **days**: Number of days to look back (default: 7)
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get recent jobs
        recent_jobs = db.query(DownloadJob).filter(
            DownloadJob.api_key == api_key,
            DownloadJob.created_at >= cutoff_date
        )

        # Group by status
        jobs_by_status = {}
        for status in JobStatus:
            count = recent_jobs.filter(DownloadJob.status == status.value).count()
            jobs_by_status[status.value] = count

        # Group by date
        jobs_by_date = db.query(
            func.date(DownloadJob.created_at).label('date'),
            func.count(DownloadJob.id).label('count')
        ).filter(
            DownloadJob.api_key == api_key,
            DownloadJob.created_at >= cutoff_date
        ).group_by(
            func.date(DownloadJob.created_at)
        ).all()

        # Get recent tracks
        job_ids = [job.id for job in recent_jobs.all()]
        recent_tracks = db.query(ProcessedTrack).filter(
            ProcessedTrack.job_id.in_(job_ids),
            ProcessedTrack.created_at >= cutoff_date
        )

        # Tracks by platform
        youtube_count = recent_tracks.filter(ProcessedTrack.source_type == 'youtube').count()
        soundcloud_count = recent_tracks.filter(ProcessedTrack.source_type == 'soundcloud').count()

        return {
            'period_days': days,
            'jobs': {
                'total': recent_jobs.count(),
                'by_status': jobs_by_status,
                'by_date': [
                    {'date': str(item.date), 'count': item.count}
                    for item in jobs_by_date
                ]
            },
            'tracks': {
                'total': recent_tracks.count(),
                'youtube': youtube_count,
                'soundcloud': soundcloud_count
            }
        }

    except Exception as e:
        logger.error(f"Error getting recent activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/stats/performance")
async def get_performance_stats(
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get performance statistics

    Returns average processing times and success rates
    """
    try:
        # Get completed jobs
        completed_jobs = db.query(DownloadJob).filter(
            DownloadJob.api_key == api_key,
            DownloadJob.status == JobStatus.COMPLETED,
            DownloadJob.duration.isnot(None)
        ).all()

        if not completed_jobs:
            return {
                'message': 'No completed jobs yet',
                'metrics': {}
            }

        # Calculate averages
        total_duration = sum([job.duration or 0 for job in completed_jobs])
        avg_duration = total_duration / len(completed_jobs) if completed_jobs else 0

        total_items = sum([job.total_items for job in completed_jobs])
        total_completed_items = sum([job.completed_items for job in completed_jobs])
        success_rate = (total_completed_items / total_items * 100) if total_items > 0 else 0

        # Get fastest and slowest jobs
        fastest_job = min(completed_jobs, key=lambda x: x.duration or float('inf'))
        slowest_job = max(completed_jobs, key=lambda x: x.duration or 0)

        return {
            'average_job_duration_seconds': round(avg_duration, 2),
            'total_completed_jobs': len(completed_jobs),
            'total_items_processed': total_items,
            'total_items_successful': total_completed_items,
            'success_rate_percent': round(success_rate, 2),
            'fastest_job': {
                'id': fastest_job.id,
                'duration_seconds': fastest_job.duration,
                'items': fastest_job.total_items
            },
            'slowest_job': {
                'id': slowest_job.id,
                'duration_seconds': slowest_job.duration,
                'items': slowest_job.total_items
            }
        }

    except Exception as e:
        logger.error(f"Error getting performance stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

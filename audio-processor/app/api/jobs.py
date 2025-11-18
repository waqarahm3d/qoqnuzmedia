"""
Jobs API Endpoints
Query and manage download jobs
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List

from ..database import get_db
from ..models import DownloadJob, ProcessedTrack, JobStatus
from .dependencies import verify_api_key
from ..celery_app import celery_app

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/jobs")
async def list_jobs(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    source_type: Optional[str] = Query(None, description="Filter by source (youtube/soundcloud)"),
    limit: int = Query(50, ge=1, le=500, description="Number of jobs to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    List all download jobs with optional filtering

    - **status_filter**: Filter by status (pending/queued/downloading/processing/completed/failed)
    - **source_type**: Filter by platform (youtube/soundcloud)
    - **limit**: Number of results (max 500)
    - **offset**: Pagination offset
    """
    try:
        query = db.query(DownloadJob).filter(DownloadJob.api_key == api_key)

        # Apply filters
        if status_filter:
            query = query.filter(DownloadJob.status == status_filter)

        if source_type:
            query = query.filter(DownloadJob.source_type == source_type)

        # Get total count
        total = query.count()

        # Get jobs
        jobs = query.order_by(desc(DownloadJob.created_at)).offset(offset).limit(limit).all()

        return {
            'total': total,
            'limit': limit,
            'offset': offset,
            'jobs': [job.to_dict() for job in jobs]
        }

    except Exception as e:
        logger.error(f"Error listing jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get detailed information about a specific job

    - **job_id**: Job ID to query
    """
    try:
        job = db.query(DownloadJob).filter(
            DownloadJob.id == job_id,
            DownloadJob.api_key == api_key
        ).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )

        # Get associated processed tracks
        tracks = db.query(ProcessedTrack).filter(ProcessedTrack.job_id == job_id).all()

        job_data = job.to_dict()
        job_data['tracks'] = [track.to_dict() for track in tracks]

        # Get Celery task status if available
        if job.task_id:
            try:
                task = celery_app.AsyncResult(job.task_id)
                job_data['task_state'] = task.state
                if task.info:
                    job_data['task_info'] = task.info
            except:
                pass

        return job_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/jobs/{job_id}")
async def cancel_job(
    job_id: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Cancel a running or queued job

    - **job_id**: Job ID to cancel
    """
    try:
        job = db.query(DownloadJob).filter(
            DownloadJob.id == job_id,
            DownloadJob.api_key == api_key
        ).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )

        if job.is_complete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is already complete and cannot be cancelled"
            )

        # Cancel Celery task
        if job.task_id:
            celery_app.control.revoke(job.task_id, terminate=True)

        # Update job status
        job.status = JobStatus.CANCELLED
        db.commit()

        logger.info(f"Job {job_id} cancelled")

        return {
            'success': True,
            'message': f'Job {job_id} cancelled successfully'
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/jobs/{job_id}/tracks")
async def get_job_tracks(
    job_id: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get all processed tracks for a job

    - **job_id**: Job ID to query
    """
    try:
        # Verify job exists and belongs to user
        job = db.query(DownloadJob).filter(
            DownloadJob.id == job_id,
            DownloadJob.api_key == api_key
        ).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )

        # Get tracks
        tracks = db.query(ProcessedTrack).filter(ProcessedTrack.job_id == job_id).all()

        return {
            'job_id': job_id,
            'total_tracks': len(tracks),
            'tracks': [track.to_dict() for track in tracks]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tracks for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/jobs/{job_id}/retry")
async def retry_job(
    job_id: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Retry a failed job

    - **job_id**: Job ID to retry
    """
    try:
        job = db.query(DownloadJob).filter(
            DownloadJob.id == job_id,
            DownloadJob.api_key == api_key
        ).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )

        if job.status != JobStatus.FAILED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only failed jobs can be retried"
            )

        # Reset job status
        job.status = JobStatus.PENDING
        job.error_message = None
        job.retry_count += 1
        db.commit()

        # Re-queue the task
        from ..tasks import download_task
        task = download_task.delay(
            job_id=job_id,
            url=job.url,
            source_type=job.source_type,
            download_type=job.download_type
        )

        job.task_id = task.id
        job.status = JobStatus.QUEUED
        db.commit()

        logger.info(f"Job {job_id} retried (attempt {job.retry_count})")

        return {
            'success': True,
            'message': f'Job {job_id} queued for retry',
            'retry_count': job.retry_count
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/tracks")
async def list_tracks(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    source_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    List all processed tracks

    - **limit**: Number of results (max 500)
    - **offset**: Pagination offset
    - **source_type**: Filter by platform (youtube/soundcloud)
    """
    try:
        # Get jobs for this API key
        job_ids = [job.id for job in db.query(DownloadJob).filter(DownloadJob.api_key == api_key).all()]

        query = db.query(ProcessedTrack).filter(ProcessedTrack.job_id.in_(job_ids))

        if source_type:
            query = query.filter(ProcessedTrack.source_type == source_type)

        total = query.count()
        tracks = query.order_by(desc(ProcessedTrack.created_at)).offset(offset).limit(limit).all()

        return {
            'total': total,
            'limit': limit,
            'offset': offset,
            'tracks': [track.to_dict() for track in tracks]
        }

    except Exception as e:
        logger.error(f"Error listing tracks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/tracks/{track_id}")
async def get_track(
    track_id: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get detailed information about a specific track

    - **track_id**: Track ID to query
    """
    try:
        track = db.query(ProcessedTrack).filter(ProcessedTrack.id == track_id).first()

        if not track:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Track {track_id} not found"
            )

        # Verify ownership
        job = db.query(DownloadJob).filter(
            DownloadJob.id == track.job_id,
            DownloadJob.api_key == api_key
        ).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        return track.to_dict()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting track {track_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

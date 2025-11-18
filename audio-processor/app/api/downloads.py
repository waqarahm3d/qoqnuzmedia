"""
Download API Endpoints
Submit and manage download jobs
"""

import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl, validator
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import DownloadJob, JobStatus, SourceType, DownloadType
from ..tasks import download_task
from .dependencies import verify_api_key, check_storage_available
from ..services.youtube_downloader import YouTubeDownloader
from ..services.soundcloud_downloader import SoundCloudDownloader
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class DownloadRequest(BaseModel):
    """Download request model"""
    url: str
    source_type: str  # 'youtube' or 'soundcloud'
    download_type: str  # 'single', 'playlist', 'channel'

    @validator('url')
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError("URL is required")
        return v.strip()

    @validator('source_type')
    def validate_source_type(cls, v):
        if v not in ['youtube', 'soundcloud']:
            raise ValueError("source_type must be 'youtube' or 'soundcloud'")
        return v

    @validator('download_type')
    def validate_download_type(cls, v):
        if v not in ['single', 'playlist', 'channel']:
            raise ValueError("download_type must be 'single', 'playlist', or 'channel'")
        return v


class DownloadResponse(BaseModel):
    """Download response model"""
    job_id: str
    status: str
    message: str
    estimated_items: Optional[int] = None


@router.post("/download", response_model=DownloadResponse)
async def submit_download(
    request: DownloadRequest,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Submit a download job

    - **url**: YouTube or SoundCloud URL
    - **source_type**: Platform (youtube/soundcloud)
    - **download_type**: Type of download (single/playlist/channel)

    Returns job ID and status
    """
    try:
        # Check storage quota
        check_storage_available()

        # Validate URL for the platform
        if request.source_type == 'youtube':
            downloader = YouTubeDownloader()
            if not downloader.validate_url(request.url):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid YouTube URL"
                )

            # Check whitelist
            if settings.WHITELIST_ENABLED:
                if not downloader.check_whitelist(request.url):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Channel not in whitelist"
                    )

            # Extract info
            try:
                info = downloader.extract_info(request.url)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to extract video info: {str(e)}"
                )

        elif request.source_type == 'soundcloud':
            downloader = SoundCloudDownloader()
            if not downloader.validate_url(request.url):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid SoundCloud URL"
                )

            # Check whitelist
            if settings.WHITELIST_ENABLED:
                if not downloader.check_whitelist(request.url):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="User not in whitelist"
                    )

            # Extract info
            try:
                info = downloader.extract_info(request.url)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to extract track info: {str(e)}"
                )

        # Create job
        job_id = str(uuid.uuid4())
        job = DownloadJob(
            id=job_id,
            source_type=request.source_type,
            download_type=request.download_type,
            url=request.url,
            status=JobStatus.PENDING,
            title=info.get('title', 'Unknown'),
            artist=info.get('uploader') or info.get('artist', 'Unknown'),
            thumbnail_url=info.get('thumbnail'),
            total_items=info.get('total_videos', 0) if request.download_type != 'single' else 1,
            api_key=api_key,
            settings={
                'audio_format': settings.AUDIO_FORMAT,
                'bitrate': settings.AUDIO_BITRATE,
                'normalize': settings.NORMALIZE_AUDIO
            }
        )

        db.add(job)
        db.commit()
        db.refresh(job)

        # Queue the download task
        task = download_task.delay(
            job_id=job_id,
            url=request.url,
            source_type=request.source_type,
            download_type=request.download_type
        )

        # Update job with task ID
        job.task_id = task.id
        job.status = JobStatus.QUEUED
        db.commit()

        logger.info(f"Download job created: {job_id} for {request.url}")

        return DownloadResponse(
            job_id=job_id,
            status="queued",
            message="Download job queued successfully",
            estimated_items=job.total_items
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting download: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit download: {str(e)}"
        )


@router.post("/download/batch")
async def submit_batch_download(
    urls: list[str],
    source_type: str,
    download_type: str = "single",
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Submit multiple download jobs at once

    - **urls**: List of URLs to download
    - **source_type**: Platform (youtube/soundcloud)
    - **download_type**: Type of download (single/playlist/channel)

    Returns list of job IDs
    """
    try:
        # Check storage quota
        check_storage_available()

        if not urls or len(urls) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one URL is required"
            )

        if len(urls) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 50 URLs allowed per batch"
            )

        job_ids = []

        for url in urls:
            try:
                # Submit individual download
                request = DownloadRequest(
                    url=url,
                    source_type=source_type,
                    download_type=download_type
                )

                response = await submit_download(request, db, api_key)
                job_ids.append({
                    'url': url,
                    'job_id': response.job_id,
                    'status': 'queued'
                })

            except Exception as e:
                logger.error(f"Failed to queue {url}: {e}")
                job_ids.append({
                    'url': url,
                    'job_id': None,
                    'status': 'failed',
                    'error': str(e)
                })

        return {
            'total_submitted': len(urls),
            'successful': len([j for j in job_ids if j['status'] == 'queued']),
            'failed': len([j for j in job_ids if j['status'] == 'failed']),
            'jobs': job_ids
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting batch download: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit batch download: {str(e)}"
        )

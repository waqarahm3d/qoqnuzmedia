"""
Health Check API Endpoints
System health and monitoring
"""

import logging
import subprocess
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from ..database import engine
from ..config import settings
from ..utils.file_utils import check_storage_quota, get_available_space

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with all system components

    Returns health status of:
    - API
    - Database
    - Redis
    - Celery workers
    - Storage
    - External dependencies (FFmpeg, yt-dlp, scdl)
    """
    health_status = {
        'status': 'healthy',
        'components': {}
    }

    # Check API
    health_status['components']['api'] = {
        'status': 'healthy',
        'environment': settings.ENVIRONMENT
    }

    # Check Database
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health_status['components']['database'] = {
            'status': 'healthy',
            'type': 'postgresql'
        }
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['components']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }

    # Check Redis
    try:
        import redis
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        health_status['components']['redis'] = {
            'status': 'healthy'
        }
    except Exception as e:
        health_status['status'] = 'degraded'
        health_status['components']['redis'] = {
            'status': 'unhealthy',
            'error': str(e)
        }

    # Check Celery workers
    try:
        from ..celery_app import celery_app
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()

        if active_workers:
            health_status['components']['celery'] = {
                'status': 'healthy',
                'workers': len(active_workers),
                'worker_names': list(active_workers.keys())
            }
        else:
            health_status['status'] = 'degraded'
            health_status['components']['celery'] = {
                'status': 'unhealthy',
                'error': 'No active workers found'
            }
    except Exception as e:
        health_status['status'] = 'degraded'
        health_status['components']['celery'] = {
            'status': 'unhealthy',
            'error': str(e)
        }

    # Check Storage
    try:
        storage_info = check_storage_quota()
        if storage_info.get('quota_exceeded', False):
            health_status['status'] = 'degraded'

        health_status['components']['storage'] = {
            'status': 'healthy' if not storage_info.get('quota_exceeded') else 'warning',
            'used_gb': storage_info.get('used_gb', 0),
            'available_gb': storage_info.get('available_gb', 0),
            'quota_gb': settings.MAX_STORAGE_GB,
            'usage_percent': storage_info.get('usage_percent', 0)
        }
    except Exception as e:
        health_status['components']['storage'] = {
            'status': 'unknown',
            'error': str(e)
        }

    # Check FFmpeg
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            health_status['components']['ffmpeg'] = {
                'status': 'healthy',
                'version': version_line
            }
        else:
            health_status['components']['ffmpeg'] = {
                'status': 'unhealthy',
                'error': 'FFmpeg not working properly'
            }
    except Exception as e:
        health_status['status'] = 'degraded'
        health_status['components']['ffmpeg'] = {
            'status': 'unhealthy',
            'error': str(e)
        }

    # Check yt-dlp
    try:
        result = subprocess.run(
            ['yt-dlp', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            health_status['components']['yt-dlp'] = {
                'status': 'healthy',
                'version': result.stdout.strip()
            }
        else:
            health_status['components']['yt-dlp'] = {
                'status': 'unhealthy',
                'error': 'yt-dlp not working properly'
            }
    except Exception as e:
        health_status['components']['yt-dlp'] = {
            'status': 'warning',
            'error': str(e)
        }

    # Check scdl
    try:
        result = subprocess.run(
            ['scdl', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            health_status['components']['scdl'] = {
                'status': 'healthy',
                'version': result.stdout.strip()
            }
        else:
            health_status['components']['scdl'] = {
                'status': 'unhealthy',
                'error': 'scdl not working properly'
            }
    except Exception as e:
        health_status['components']['scdl'] = {
            'status': 'warning',
            'error': str(e)
        }

    return health_status


@router.get("/health/ready")
async def readiness_check():
    """
    Readiness probe for container orchestration

    Returns 200 if system is ready to accept traffic
    """
    try:
        # Check database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        # Check storage availability
        available_space = get_available_space(str(settings.DOWNLOAD_DIR))
        if available_space < (1024 * 1024 * 1024):  # Less than 1GB
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Insufficient storage space"
            )

        return {'status': 'ready'}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )


@router.get("/health/live")
async def liveness_check():
    """
    Liveness probe for container orchestration

    Returns 200 if application is alive
    """
    return {'status': 'alive'}

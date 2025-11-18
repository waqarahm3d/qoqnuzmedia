"""
Celery Application Configuration
Handles asynchronous task processing for downloads
"""

import logging
from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure
from .config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "audio_processor",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task routing
    task_routes={
        'app.tasks.download_task': {'queue': 'downloads'},
        'app.tasks.process_audio_task': {'queue': 'processing'},
    },

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    worker_disable_rate_limits=False,

    # Task time limits
    task_time_limit=settings.DOWNLOAD_TIMEOUT + 300,  # 5 minutes extra
    task_soft_time_limit=settings.DOWNLOAD_TIMEOUT,

    # Result backend settings
    result_expires=86400,  # 24 hours
    result_backend_transport_options={'master_name': 'mymaster'},

    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Rate limiting
    task_default_rate_limit=f'{settings.RATE_LIMIT_PER_MINUTE}/m',

    # Concurrency
    worker_concurrency=settings.MAX_CONCURRENT_DOWNLOADS,

    # Beat schedule (for periodic tasks)
    beat_schedule={
        'cleanup-temp-files': {
            'task': 'app.tasks.cleanup_temp_files_task',
            'schedule': 3600.0,  # Every hour
        },
        'update-stats': {
            'task': 'app.tasks.update_system_stats_task',
            'schedule': 300.0,  # Every 5 minutes
        },
    },
)


# Task signal handlers
@task_prerun.connect
def task_prerun_handler(task_id, task, *args, **kwargs):
    """Log task start"""
    logger.info(f"Task started: {task.name} [{task_id}]")


@task_postrun.connect
def task_postrun_handler(task_id, task, *args, **kwargs):
    """Log task completion"""
    logger.info(f"Task completed: {task.name} [{task_id}]")


@task_failure.connect
def task_failure_handler(task_id, exception, *args, **kwargs):
    """Log task failure"""
    logger.error(f"Task failed [{task_id}]: {exception}")


# Auto-discover tasks
celery_app.autodiscover_tasks(['app'])


if __name__ == '__main__':
    celery_app.start()

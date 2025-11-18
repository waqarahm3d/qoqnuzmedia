"""
FastAPI Application
Main application entry point
"""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .config import settings
from .database import init_db, engine
from .models import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_DIR / 'app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    """
    # Startup
    logger.info("Starting Audio Processor API...")

    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    # Create download directories
    settings.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    settings.LOG_DIR.mkdir(parents=True, exist_ok=True)

    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Download directory: {settings.DOWNLOAD_DIR}")
    logger.info("Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down Audio Processor API...")
    engine.dispose()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Robust audio downloading and processing system for YouTube and SoundCloud",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint
    """
    from .utils.file_utils import check_storage_quota

    storage_info = check_storage_quota()

    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "storage": {
            "used_gb": storage_info.get('used_gb', 0),
            "available_gb": storage_info.get('available_gb', 0),
            "quota_gb": settings.MAX_STORAGE_GB
        }
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API information
    """
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "description": "Audio Processor API - Download and process audio from YouTube and SoundCloud",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "downloads": "/api/v1/download",
            "jobs": "/api/v1/jobs",
            "stats": "/api/v1/stats"
        }
    }


# Import and include routers
from .api import downloads, jobs, stats, health

app.include_router(downloads.router, prefix="/api/v1", tags=["Downloads"])
app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])
app.include_router(stats.router, prefix="/api/v1", tags=["Statistics"])
app.include_router(health.router, prefix="/api/v1", tags=["Health"])

# Mount static files (for web interface)
try:
    app.mount("/static", StaticFiles(directory="web/static"), name="static")
except:
    pass  # Static directory doesn't exist yet


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )

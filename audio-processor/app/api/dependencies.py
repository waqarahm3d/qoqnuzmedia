"""
API Dependencies
Shared dependencies for API endpoints
"""

from fastapi import Header, HTTPException, status
from fastapi.security import APIKeyHeader
from typing import Optional
from ..config import settings

# API Key security scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    """
    Verify API key from header

    Args:
        api_key: API key from X-API-Key header

    Returns:
        Valid API key

    Raises:
        HTTPException: If API key is invalid or missing
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is required. Include 'X-API-Key' header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    if api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return api_key


def check_storage_available():
    """
    Check if storage is available

    Raises:
        HTTPException: If storage quota exceeded
    """
    from ..utils.file_utils import check_storage_quota

    storage_info = check_storage_quota()
    if storage_info.get('quota_exceeded', False):
        raise HTTPException(
            status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
            detail=f"Storage quota exceeded. Used: {storage_info.get('used_gb', 0)}GB / {settings.MAX_STORAGE_GB}GB"
        )

"""
JWT Handler — Token creation and validation
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from backend.config import settings
import logging

logger = logging.getLogger(__name__)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode failed: {e}")
        return None


def verify_token(token: str) -> Optional[str]:
    """Return the user_id (sub) from a valid token, or None."""
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None

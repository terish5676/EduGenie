"""
Auth Router — Registration, Login, Profile endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends
from backend.schemas.schemas import UserRegister, UserLogin, TokenResponse, ForgotPasswordRequest
from backend.services.auth_service import create_user, authenticate_user
from backend.utils.jwt_handler import create_access_token
from backend.middleware.auth_middleware import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    """Register a new user and return JWT token."""
    try:
        user = await create_user(data.name, data.email, data.password)
        token = create_access_token({"sub": user["id"]})
        return {"access_token": token, "token_type": "bearer", "user": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Authenticate user and return JWT token."""
    user = await authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token = create_access_token({"sub": user["id"]})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return {"success": True, "user": current_user}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """Send password reset email (placeholder — add email service)."""
    return {
        "success": True,
        "message": "If an account exists with this email, you'll receive a reset link shortly."
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout (client should delete token)."""
    return {"success": True, "message": "Logged out successfully"}

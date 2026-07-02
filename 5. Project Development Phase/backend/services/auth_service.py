"""
Auth Service — User registration, login, and profile management
"""
from passlib.context import CryptContext
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional
from backend.database import get_collection
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def serialize_user(user: dict) -> dict:
    """Convert MongoDB user doc to JSON-serializable dict."""
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "avatar": user.get("avatar", ""),
        "plan": user.get("plan", "Standard Plan"),
        "created_at": user.get("created_at", datetime.now(timezone.utc)).isoformat(),
    }


async def create_user(name: str, email: str, password: str) -> dict:
    """Register a new user. Returns the created user dict."""
    users = get_collection("users")
    # Check duplicate email
    existing = await users.find_one({"email": email.lower()})
    if existing:
        raise ValueError("Email already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": name,
        "email": email.lower(),
        "hashed_password": hash_password(password),
        "avatar": "",
        "plan": "Standard Plan",
        "created_at": now,
        "updated_at": now,
        "settings": {
            "theme": "light",
            "notifications": True,
            "weekly_goal": 20,
            "ai_model": "gemini-1.5-flash",
        },
        "streak": 0,
        "last_active": now,
        "sessions_completed": 0,
    }
    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    logger.info(f"New user created: {email}")

    # Create initial progress record
    progress = get_collection("progress")
    await progress.insert_one({
        "user_id": str(result.inserted_id),
        "streak": 0,
        "focus_score": 0.0,
        "sessions_completed": 0,
        "weekly_goal": 20,
        "weekly_completed": 0,
        "daily_activity": [],
        "quiz_scores": [],
        "last_active": now,
    })
    return serialize_user(user_doc)


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Verify email+password. Returns serialized user or None."""
    users = get_collection("users")
    user = await users.find_one({"email": email.lower()})
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    # Update last_active
    await users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active": datetime.now(timezone.utc)}}
    )
    return serialize_user(user)


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Fetch a user by their MongoDB ObjectId string."""
    try:
        users = get_collection("users")
        user = await users.find_one({"_id": ObjectId(user_id)})
        if user:
            return serialize_user(user)
        return None
    except Exception:
        return None


async def update_user_profile(user_id: str, updates: dict) -> Optional[dict]:
    """Update user profile fields."""
    try:
        users = get_collection("users")
        updates["updated_at"] = datetime.now(timezone.utc)
        await users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates}
        )
        return await get_user_by_id(user_id)
    except Exception as e:
        logger.error(f"Profile update failed: {e}")
        return None

"""
Settings Router — User preferences and account management
"""
from fastapi import APIRouter, Depends, HTTPException
from backend.schemas.schemas import SettingsUpdate
from backend.middleware.auth_middleware import get_current_user
from backend.database import get_collection
from backend.services.auth_service import hash_password, verify_password
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/")
async def get_settings(current_user: dict = Depends(get_current_user)):
    """Get user settings."""
    users = get_collection("users")
    user = await users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "settings": user.get("settings", {}),
        "profile": {
            "name": user.get("name"),
            "email": user.get("email"),
            "avatar": user.get("avatar", ""),
            "plan": user.get("plan", "Standard Plan"),
        }
    }


@router.put("/")
async def update_settings(
    data: SettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user settings/preferences."""
    users = get_collection("users")
    updates = {}
    settings_updates = {}

    if data.theme:
        settings_updates["settings.theme"] = data.theme
    if data.ai_model:
        settings_updates["settings.ai_model"] = data.ai_model
    if data.notifications is not None:
        settings_updates["settings.notifications"] = data.notifications
    if data.weekly_goal:
        settings_updates["settings.weekly_goal"] = data.weekly_goal
    if data.display_name:
        updates["name"] = data.display_name

    all_updates = {**updates, **settings_updates}
    if all_updates:
        await users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": all_updates}
        )
    return {"success": True, "message": "Settings updated"}


@router.put("/password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user)
):
    """Change user password."""
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    users = get_collection("users")
    user = await users.find_one({"_id": ObjectId(current_user["id"])})
    if not verify_password(current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"hashed_password": hash_password(new_password)}}
    )
    return {"success": True, "message": "Password changed successfully"}


@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Delete user account and all associated data."""
    user_id = current_user["id"]
    for collection in ["users", "history", "notes", "bookmarks", "progress"]:
        col = get_collection(collection)
        if collection == "users":
            await col.delete_one({"_id": ObjectId(user_id)})
        else:
            await col.delete_many({"user_id": user_id})
    return {"success": True, "message": "Account deleted"}

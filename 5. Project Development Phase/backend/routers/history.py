"""
History Router — View and manage AI interaction history
"""
from fastapi import APIRouter, Depends, Query
from backend.middleware.auth_middleware import get_current_user
from backend.database import get_collection
from bson import ObjectId
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/history", tags=["History"])


def serialize_history(h: dict) -> dict:
    return {
        "id": str(h["_id"]),
        "tool": h.get("tool", ""),
        "prompt": h.get("prompt", ""),
        "response": h.get("response", ""),
        "created_at": h["created_at"].isoformat(),
    }


@router.get("/")
async def get_history(
    search: str = Query(default=""),
    tool: str = Query(default=""),
    limit: int = Query(default=50, le=200),
    current_user: dict = Depends(get_current_user)
):
    """Get user's AI interaction history."""
    history = get_collection("history")
    query = {"user_id": current_user["id"]}
    if search:
        query["prompt"] = {"$regex": search, "$options": "i"}
    if tool:
        query["tool"] = tool
    cursor = history.find(query).sort("created_at", -1).limit(limit)
    result = [serialize_history(h) async for h in cursor]
    return {"success": True, "history": result, "total": len(result)}


@router.delete("/")
async def clear_history(current_user: dict = Depends(get_current_user)):
    """Clear all history for current user."""
    history = get_collection("history")
    result = await history.delete_many({"user_id": current_user["id"]})
    return {"success": True, "deleted": result.deleted_count}


@router.delete("/{history_id}")
async def delete_history_item(
    history_id: str,
    current_user: dict = Depends(get_current_user)
):
    history = get_collection("history")
    await history.delete_one(
        {"_id": ObjectId(history_id), "user_id": current_user["id"]}
    )
    return {"success": True, "message": "History item deleted"}

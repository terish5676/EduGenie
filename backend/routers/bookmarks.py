"""
Bookmarks Router — Save, list, delete bookmarks
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.schemas.schemas import BookmarkCreate
from backend.middleware.auth_middleware import get_current_user
from backend.database import get_collection
from bson import ObjectId
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/bookmarks", tags=["Bookmarks"])


def serialize_bookmark(bm: dict) -> dict:
    return {
        "id": str(bm["_id"]),
        "title": bm["title"],
        "content": bm.get("content", ""),
        "category": bm.get("category", "General"),
        "source_tool": bm.get("source_tool", ""),
        "created_at": bm["created_at"].isoformat(),
    }


@router.get("/")
async def get_bookmarks(
    search: str = Query(default=""),
    category: str = Query(default=""),
    current_user: dict = Depends(get_current_user)
):
    bookmarks = get_collection("bookmarks")
    query = {"user_id": current_user["id"]}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    if category:
        query["category"] = category
    cursor = bookmarks.find(query).sort("created_at", -1)
    result = [serialize_bookmark(b) async for b in cursor]
    return {"success": True, "bookmarks": result, "total": len(result)}


@router.post("/", status_code=201)
async def create_bookmark(
    data: BookmarkCreate,
    current_user: dict = Depends(get_current_user)
):
    bookmarks = get_collection("bookmarks")
    doc = {
        "user_id": current_user["id"],
        "title": data.title,
        "content": data.content,
        "category": data.category,
        "source_tool": data.source_tool,
        "created_at": datetime.now(timezone.utc),
    }
    result = await bookmarks.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "bookmark": serialize_bookmark(doc)}


@router.delete("/{bookmark_id}")
async def delete_bookmark(
    bookmark_id: str,
    current_user: dict = Depends(get_current_user)
):
    bookmarks = get_collection("bookmarks")
    result = await bookmarks.delete_one(
        {"_id": ObjectId(bookmark_id), "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"success": True, "message": "Bookmark deleted"}


@router.get("/categories")
async def get_categories(current_user: dict = Depends(get_current_user)):
    bookmarks = get_collection("bookmarks")
    categories = await bookmarks.distinct("category", {"user_id": current_user["id"]})
    return {"success": True, "categories": categories}

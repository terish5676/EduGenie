"""
Notes Router — CRUD for personal notes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.schemas.schemas import NoteCreate, NoteUpdate
from backend.middleware.auth_middleware import get_current_user
from backend.database import get_collection
from bson import ObjectId
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/notes", tags=["Notes"])


def serialize_note(note: dict) -> dict:
    return {
        "id": str(note["_id"]),
        "title": note["title"],
        "content": note.get("content", ""),
        "folder": note.get("folder", "General"),
        "created_at": note["created_at"].isoformat(),
        "updated_at": note["updated_at"].isoformat(),
    }


@router.get("/")
async def get_notes(
    search: str = Query(default=""),
    folder: str = Query(default=""),
    current_user: dict = Depends(get_current_user)
):
    """Get all notes for current user with optional search/filter."""
    notes = get_collection("notes")
    query = {"user_id": current_user["id"]}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
        ]
    if folder:
        query["folder"] = folder
    cursor = notes.find(query).sort("updated_at", -1)
    result = [serialize_note(n) async for n in cursor]
    return {"success": True, "notes": result, "total": len(result)}


@router.post("/", status_code=201)
async def create_note(
    data: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new note."""
    notes = get_collection("notes")
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": current_user["id"],
        "title": data.title,
        "content": data.content,
        "folder": data.folder,
        "created_at": now,
        "updated_at": now,
    }
    result = await notes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return {"success": True, "note": serialize_note(doc)}


@router.put("/{note_id}")
async def update_note(
    note_id: str,
    data: NoteUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a note."""
    notes = get_collection("notes")
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc)
    result = await notes.update_one(
        {"_id": ObjectId(note_id), "user_id": current_user["id"]},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    note = await notes.find_one({"_id": ObjectId(note_id)})
    return {"success": True, "note": serialize_note(note)}


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a note."""
    notes = get_collection("notes")
    result = await notes.delete_one(
        {"_id": ObjectId(note_id), "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"success": True, "message": "Note deleted"}


@router.get("/folders")
async def get_folders(current_user: dict = Depends(get_current_user)):
    """Get all unique folders for the current user."""
    notes = get_collection("notes")
    folders = await notes.distinct("folder", {"user_id": current_user["id"]})
    return {"success": True, "folders": folders}

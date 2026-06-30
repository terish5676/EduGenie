"""
AI Router — All AI-powered educational tool endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from backend.schemas.schemas import (
    QARequest, ExplainRequest, QuizRequest, SummarizeRequest,
    RoadmapRequest, AIResponse
)
from backend.services.gemini_service import generate_text, generate_json, stream_text
from backend.services.file_service import extract_text_from_file
from backend.middleware.auth_middleware import get_current_user
from backend.database import get_collection
from backend.utils.prompts import (
    qa_prompt, explain_prompt, quiz_prompt, summarize_prompt, roadmap_prompt
)
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["AI Tools"])


async def save_history(user_id: str, tool: str, prompt_text: str, response: any):
    """Save AI interaction to user history."""
    try:
        history = get_collection("history")
        await history.insert_one({
            "user_id": user_id,
            "tool": tool,
            "prompt": prompt_text[:500],
            "response": response if isinstance(response, str) else str(response)[:2000],
            "created_at": datetime.now(timezone.utc),
        })
        # Update session count
        users = get_collection("users")
        from bson import ObjectId
        await users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"sessions_completed": 1}}
        )
        # Update progress
        progress = get_collection("progress")
        await progress.update_one(
            {"user_id": user_id},
            {"$inc": {"sessions_completed": 1, "weekly_completed": 1},
             "$set": {"last_active": datetime.now(timezone.utc)}},
            upsert=True
        )
    except Exception as e:
        logger.warning(f"History save failed: {e}")


@router.post("/qa")
async def intelligent_qa(
    req: QARequest,
    current_user: dict = Depends(get_current_user)
):
    """Answer educational questions using Gemini."""
    try:
        prompt = qa_prompt(req.question, req.context)
        result = await generate_text(prompt)
        await save_history(current_user["id"], "qa", req.question, result)
        return {"success": True, "result": result, "tool": "qa"}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/qa/stream")
async def intelligent_qa_stream(
    req: QARequest,
    current_user: dict = Depends(get_current_user)
):
    """Stream Q&A response for real-time output."""
    prompt = qa_prompt(req.question, req.context)

    async def generate():
        full_response = []
        async for chunk in stream_text(prompt):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
        await save_history(current_user["id"], "qa", req.question, "".join(full_response))

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/explain")
async def concept_explanation(
    req: ExplainRequest,
    current_user: dict = Depends(get_current_user)
):
    """Explain a concept with structured educational content."""
    try:
        prompt = explain_prompt(req.topic, req.level, req.style)
        result = await generate_text(prompt)
        await save_history(current_user["id"], "explain", req.topic, result)
        return {"success": True, "result": result, "tool": "explain"}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/quiz")
async def generate_quiz(
    req: QuizRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a quiz with questions and answers."""
    try:
        prompt = quiz_prompt(req.topic, req.difficulty, req.num_questions, req.quiz_type)
        result = await generate_json(prompt)
        await save_history(current_user["id"], "quiz", req.topic, result)
        return {"success": True, "result": result, "tool": "quiz"}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/summarize")
async def summarize_text(
    req: SummarizeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Summarize provided text."""
    try:
        prompt = summarize_prompt(req.text, req.mode)
        result = await generate_text(prompt)
        await save_history(current_user["id"], "summarize", req.text[:100], result)
        return {"success": True, "result": result, "tool": "summarize"}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/summarize/file")
async def summarize_file(
    mode: str = Form(default="detailed"),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Extract text from uploaded file and summarize it."""
    try:
        text = await extract_text_from_file(file)
        prompt = summarize_prompt(text, mode)
        result = await generate_text(prompt)
        await save_history(current_user["id"], "summarize", f"[File: {file.filename}]", result)
        return {"success": True, "result": result, "tool": "summarize", "filename": file.filename}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/roadmap")
async def learning_roadmap(
    req: RoadmapRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a personalized learning roadmap."""
    try:
        prompt = roadmap_prompt(req.topic, req.level, req.duration)
        result = await generate_json(prompt)
        await save_history(current_user["id"], "roadmap", req.topic, result)
        return {"success": True, "result": result, "tool": "roadmap"}
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

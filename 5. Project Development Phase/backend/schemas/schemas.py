"""
EduGenie Schemas — Pydantic request/response models
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# ─── Auth Schemas ───────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    plan: str = "Standard Plan"
    created_at: Optional[datetime] = None


# ─── AI Schemas ─────────────────────────────────────────────────
class QARequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    context: Optional[str] = ""


class ExplainRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=500)
    level: str = "intermediate"   # beginner | intermediate | advanced
    style: str = "detailed"       # simple | detailed | examples | analogy


class QuizRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=500)
    difficulty: str = "medium"    # easy | medium | hard
    num_questions: int = Field(default=5, ge=1, le=20)
    quiz_type: str = "mcq"        # mcq | true_false | fill_blank | short_answer


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=50, max_length=20000)
    mode: str = "detailed"        # short | detailed | bullets | takeaways | terms


class RoadmapRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=500)
    level: str = "beginner"       # beginner | intermediate | advanced
    duration: str = "3 months"


class AIResponse(BaseModel):
    success: bool = True
    result: Any
    tool: str
    tokens_used: Optional[int] = None


# ─── Notes Schemas ───────────────────────────────────────────────
class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = ""
    folder: str = "General"


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    folder: Optional[str] = None


class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    folder: str
    created_at: datetime
    updated_at: datetime


# ─── Bookmarks Schemas ───────────────────────────────────────────
class BookmarkCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: Optional[str] = ""
    category: str = "General"
    source_tool: Optional[str] = ""


class BookmarkResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    source_tool: str
    created_at: datetime


# ─── History Schemas ─────────────────────────────────────────────
class HistoryResponse(BaseModel):
    id: str
    tool: str
    prompt: str
    response: Any
    created_at: datetime


# ─── Progress Schemas ────────────────────────────────────────────
class ProgressUpdate(BaseModel):
    sessions_completed: int = 0
    quiz_score: Optional[float] = None
    topics_studied: List[str] = []
    tool_used: str = ""


class ProgressResponse(BaseModel):
    user_id: str
    streak: int
    focus_score: float
    sessions_completed: int
    weekly_goal: int
    weekly_completed: int
    daily_activity: List[Dict] = []
    quiz_scores: List[float] = []


# ─── Settings Schemas ────────────────────────────────────────────
class SettingsUpdate(BaseModel):
    theme: Optional[str] = None        # light | dark
    ai_model: Optional[str] = None
    notifications: Optional[bool] = None
    weekly_goal: Optional[int] = None
    display_name: Optional[str] = None

"""
EduGenie — FastAPI Main Application
Production-ready AI-powered educational platform
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import connect_db, disconnect_db
from backend.routers import auth, ai, notes, bookmarks, history, progress, settings as settings_router
import os

# ─── Logging Setup ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Lifespan (startup/shutdown) ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 EduGenie starting up...")
    await connect_db()
    yield
    logger.info("🛑 EduGenie shutting down...")
    await disconnect_db()


# ─── App Instance ────────────────────────────────────────────────
app = FastAPI(
    title="EduGenie API",
    description="AI-powered educational assistant API",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS Middleware ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static Files ────────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="frontend"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── Routers ─────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(notes.router)
app.include_router(bookmarks.router)
app.include_router(history.router)
app.include_router(progress.router)
app.include_router(settings_router.router)


# ─── Page Routes (serve HTML files) ──────────────────────────────
@app.get("/", response_class=FileResponse)
async def serve_landing():
    return FileResponse("frontend/index.html")


@app.get("/login", response_class=FileResponse)
async def serve_login():
    return FileResponse("frontend/login.html")


@app.get("/signup", response_class=FileResponse)
async def serve_signup():
    return FileResponse("frontend/signup.html")


@app.get("/forgot-password", response_class=FileResponse)
async def serve_forgot():
    return FileResponse("frontend/forgot-password.html")


@app.get("/dashboard", response_class=FileResponse)
async def serve_dashboard():
    return FileResponse("frontend/dashboard.html")


@app.get("/notes", response_class=FileResponse)
async def serve_notes():
    return FileResponse("frontend/notes.html")


@app.get("/bookmarks", response_class=FileResponse)
async def serve_bookmarks():
    return FileResponse("frontend/bookmarks.html")


@app.get("/progress", response_class=FileResponse)
async def serve_progress():
    return FileResponse("frontend/progress.html")


@app.get("/history", response_class=FileResponse)
async def serve_history():
    return FileResponse("frontend/history.html")


@app.get("/achievements", response_class=FileResponse)
async def serve_achievements():
    return FileResponse("frontend/achievements.html")


@app.get("/settings", response_class=FileResponse)
async def serve_settings():
    return FileResponse("frontend/settings.html")


# ─── Health Check ─────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# ─── Global Exception Handler ────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": "An internal server error occurred"}
    )

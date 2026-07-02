"""
EduGenie Configuration
Loads all settings from environment variables / .env file
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "EduGenie"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "edugenie"

    # JWT
    JWT_SECRET_KEY: str = "change-this-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Gemini AI
    GEMINI_API_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:8000,http://127.0.0.1:8000"

    # File Uploads
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

"""
EduGenie Database
MongoDB async connection using Motor
"""
from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import settings
import logging

logger = logging.getLogger(__name__)

# Global MongoDB client
client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Initialize MongoDB connection."""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        db = client[settings.MONGODB_DB_NAME]
        # Verify connection
        await client.admin.command("ping")
        logger.info(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")
        # Create indexes
        await create_indexes()
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        raise


async def disconnect_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    """Create database indexes for performance."""
    # Users
    await db.users.create_index("email", unique=True)
    # History
    await db.history.create_index([("user_id", 1), ("created_at", -1)])
    # Notes
    await db.notes.create_index([("user_id", 1), ("updated_at", -1)])
    # Bookmarks
    await db.bookmarks.create_index([("user_id", 1), ("created_at", -1)])
    # Progress
    await db.progress.create_index([("user_id", 1), ("date", -1)])
    logger.info("Database indexes created")


def get_db():
    """Return the database instance."""
    return db


def get_collection(name: str):
    """Return a specific collection."""
    return db[name]

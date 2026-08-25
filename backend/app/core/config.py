import os
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

class Settings:
    PROJECT_NAME: str = "PR System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pr-system-super-secure-secret-key-2026-xyz-0987654321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # MongoDB Settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "pr_system_db")
    USE_MOCK_DB_FALLBACK: bool = os.getenv("USE_MOCK_DB_FALLBACK", "true").lower() in ("true", "1", "yes")

    # File uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

settings = Settings()

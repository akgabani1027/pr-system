import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import database
from app.services.seed import seed_database
from app.api import auth, prs, analytics, users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB and seed default data
    await database.connect()
    try:
        await seed_database()
    except Exception as e:
        print(f"[!] Warning during database seed: {e}")
    yield
    # Shutdown
    await database.close()

app = FastAPI(
    title="PR System API",
    description="Full-stack Purchase Requisition (PR) Management & Approval Workflow API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for attachments
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(prs.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": "PR System API",
        "version": "1.0.0",
        "docs": "/docs",
        "database": "MongoDB" if not database.using_mock else "In-Memory / JSON Fallback",
        "status": "online"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database_connected": database.is_connected}

"""
HBTM Backend — FastAPI Application Entry Point

Main application that ties together the API layer, database, and agent system.
Run with: uvicorn main:app --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import APP_HOST, APP_PORT, APP_DEBUG
from db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events — startup and shutdown."""
    # ── Startup ──
    print("HBTM Backend starting up...")
    await init_db()
    print("Database initialized")

    # Initialize ChromaDB collections
    from db.vector_store import init_vector_store
    await init_vector_store()
    print("Vector store initialized")

    yield

    # ── Shutdown ──
    print("HBTM Backend shutting down...")


app = FastAPI(
    title="HBTM — Agentic AI Curator",
    description=(
        "AI-powered personal growth curator that analyzes your media consumption, "
        "tracks skill progress, and assigns daily growth tasks. "
        "Built with Google ADK for multi-agent orchestration."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "hbtm-backend"}


# ── Register API Routers ──
from api.routes_onboard import router as onboard_router
from api.routes_curate import router as curate_router
from api.routes_analyze import router as analyze_router
from api.routes_tasks import router as tasks_router
from api.routes_progress import router as progress_router
from api.routes_ingest import router as ingest_router
from api.routes_oauth import router as oauth_router
from api.routes_sandbox import router as sandbox_router
from api.routes_auth import router as auth_router
from api.routes_profile import router as profile_router

from fastapi.staticfiles import StaticFiles
from config import BASE_DIR

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(onboard_router, prefix="/api", tags=["Onboarding"])
app.include_router(curate_router, prefix="/api/curation", tags=["Curation"])
app.include_router(analyze_router, prefix="/api", tags=["Analysis"])
app.include_router(tasks_router, prefix="/api", tags=["Tasks"])
app.include_router(progress_router, prefix="/api/dashboard", tags=["Progress"])
app.include_router(ingest_router, prefix="/api", tags=["Ingestion"])
app.include_router(oauth_router)
app.include_router(sandbox_router)
app.include_router(profile_router, prefix="/api", tags=["Profile"])

# Mount uploads directory for audio/video playback
uploads_path = BASE_DIR / "data" / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=APP_HOST,
        port=APP_PORT,
        reload=APP_DEBUG,
    )

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import get_settings
from backend.api.routes import health, mentions, entities, narratives, briefs

settings = get_settings()

app = FastAPI(
    title="Insyt API",
    version="0.1.0",
    description="Context-intelligence platform for Indian enterprise brands",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(mentions.router, prefix="/api/mentions", tags=["mentions"])
app.include_router(entities.router, prefix="/api/entities", tags=["entities"])
app.include_router(narratives.router, prefix="/api/narratives", tags=["narratives"])
app.include_router(briefs.router, prefix="/api/briefs", tags=["briefs"])

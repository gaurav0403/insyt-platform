from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://insyt:insyt@localhost:5432/insyt"
    database_url_sync: str = "postgresql://insyt:insyt@localhost:5432/insyt"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Anthropic
    anthropic_api_key: str = ""

    # Ingestion APIs
    searchapi_key: str = ""  # searchapi.io — primary search
    serper_api_key: str = ""  # serper.dev — legacy/fallback
    twitter_api_key: str = ""  # twitterapi.io
    youtube_api_key: str = ""
    google_places_api_key: str = ""

    # App
    environment: str = "development"
    log_level: str = "INFO"
    client_name: str = "kalyan"

    # Frontend
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_prefix": "INSYT_", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str       # service_role — never expose to frontend

    # AI
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    AI_PROVIDER: str = "gemini"     # "gemini" or "openai"
    OPENAI_API_KEY: str = ""

    # Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 72
    STARTER_CREDITS: int = 3

    # Admin
    ADMIN_SECRET: str               # Static secret for admin endpoints

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()

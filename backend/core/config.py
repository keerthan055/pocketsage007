import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Resolve root .env regardless of cwd
ROOT_ENV = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "PocketSage AI"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:[YOUR-PASSWORD]@db.ntahzcydcotzmuqivsas.supabase.co:6543/postgres?sslmode=require")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_pocketsage_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520 # 8 days
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://[YOUR-PROJECT-REF].supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "[YOUR-SUPABASE-ANON-KEY]")

    class Config:
        env_file = str(ROOT_ENV)

settings = Settings()

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Community Hero Dispatch API"
    DEBUG: bool = False
    
    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/community_hero"
    
    # Cryptographic JWT Settings
    JWT_SECRET: str = "super_security_secret_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 Hours
    
    # Gamification Tuning
    POINTS_FOR_REPORTING: int = 50
    POINTS_FOR_VERIFYING: int = 20
    POINTS_FOR_RESOLUTION: int = 100

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

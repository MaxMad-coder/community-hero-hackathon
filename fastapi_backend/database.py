from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from fastapi_backend.config import settings

# In production, use standard connection pooling with high-availability configurations
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Contextual Dependency Injection injector for SQL database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

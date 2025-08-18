from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from config import settings

DATABASE_URL = f"postgresql+psycopg://{settings.db_user}:{settings.db_pass}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def ensure_pgvector(session):
    # Safe to run; init.sql handles it too. Here for defense-in-depth.
    session.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    session.commit()

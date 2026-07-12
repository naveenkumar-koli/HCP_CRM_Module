import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool

load_dotenv()

# Use PostgreSQL if DATABASE_URL is set, otherwise fall back to SQLite (dev)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm.db")

if DATABASE_URL.startswith("sqlite"):
    # SQLite needs check_same_thread=False
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Neon DB (serverless PostgreSQL) — use NullPool to avoid stale connections
    # pool_pre_ping tests connection before each use, preventing SSL abort errors
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args={"sslmode": "require", "connect_timeout": 10}
    )

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

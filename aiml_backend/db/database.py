from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    """
    FastAPI dependency for database session.
    """
    async with async_session_maker() as session:
        yield session

async def init_db():
    """
    Initialize database and create all tables.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

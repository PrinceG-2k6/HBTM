import asyncio
from db.database import async_session_maker
from services.curation_service import get_curated_feed
from tools.db_tools import get_user_by_email

async def main():
    async with async_session_maker() as db:
        user = await get_user_by_email(db, "bhandegaonkarsamarth2@gmail.com")
        if user:
            try:
                res = await get_curated_feed(db=db, user_id=user.id)
                print("SUCCESS keys:", res.keys())
            except Exception as e:
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
from db.database import async_session_maker
from api.routes_auth import register, RegisterRequest
from pydantic import BaseModel

async def main():
    req = RegisterRequest(
        name="test",
        email="test5@test.com",
        password="pass",
        role="Personal Growth Aspirant",
        onboarding={}
    )
    async with async_session_maker() as db:
        res = await register(req, db)
        print(res)

if __name__ == "__main__":
    asyncio.run(main())

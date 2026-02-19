import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

_pool = None

async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=os.getenv("DB_HOST", "77.37.68.210"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "crexe"),
            user=os.getenv("DB_USER", "nicoyapur"),
            password=os.getenv("DB_PASSWORD", "Yapur1234$"),
            min_size=2,
            max_size=10,
        )
    return _pool

async def fetch_all(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]

async def fetch_one(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None

async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

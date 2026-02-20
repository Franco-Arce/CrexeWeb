import asyncio
import asyncpg
from database import get_pool, close_pool

async def inspect():
    pool = await get_pool()
    async with pool.acquire() as conn:
        for t in ['dim_contactos', 'dim_bases', 'dim_subcategorias', 'fact_contactos']:
            row = await conn.fetchrow(f"SELECT * FROM {t} LIMIT 1")
            print(f"--- {t} ---")
            if row:
                print(dict(row).keys())
            else:
                print("Empty table")
    await close_pool()

asyncio.run(inspect())

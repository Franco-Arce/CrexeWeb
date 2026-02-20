import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.dashboard import router as dashboard_router
from routes.ai import router as ai_router


app = FastAPI(
    title="UniandesWeb API",
    description="Dashboard API for Uniandes Contact Center",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(ai_router)


@app.get("/")
async def root():
    return {"status": "ok", "app": "UniandesWeb API", "mode": "database"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

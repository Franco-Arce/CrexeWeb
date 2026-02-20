import os
import json
import httpx
import asyncio
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from routes.auth import require_auth
from database import fetch_all, fetch_one
from collections import Counter, defaultdict
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/ai", tags=["ai"])

MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


async def _groq_chat_async(messages: list, temperature: float = 0.3, max_tokens: int = 800) -> str:
    """Call Groq API directly via HTTP asynchronously."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise Exception("GROQ_API_KEY no configurada en el servidor")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = []
    context_data: Optional[dict] = {}


class ContextRequest(BaseModel):
    context_data: Optional[dict] = {}


@router.post("/chat")
async def ai_chat(body: ChatRequest, _user: str = Depends(require_auth)):
    try:
        context = json.dumps(body.context_data, default=str, ensure_ascii=False) if body.context_data else "{}"

        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un analista de datos experto del contact center Uniandes. "
                    "Respondes preguntas sobre leads, gestión y conversión usando los datos reales. "
                    "Sé conciso, usa números y porcentajes. Responde en español.\n\n"
                    f"DATOS ACTUALES:\n{context}"
                ),
            }
        ]

        for h in (body.history or [])[-6:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

        messages.append({"role": "user", "content": body.message})

        content = await _groq_chat_async(messages, temperature=0.3, max_tokens=800)
        return {"response": content}
    except Exception as e:
        print(f"[AI Chat Error] {e}")
        return {"response": f"Error: {str(e)[:200]}"}


@router.post("/insights")
async def ai_insights(body: ContextRequest, _user: str = Depends(require_auth)):
    try:
        context = json.dumps(body.context_data, default=str, ensure_ascii=False) if body.context_data else "{}"

        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un analista de datos del contact center Uniandes. "
                    "Genera exactamente 4 insights breves y accionables basados en los datos. "
                    "Formato JSON: [{\"icon\": \"trending_up|trending_down|alert|star\", \"title\": \"...\", \"description\": \"...\"}]. "
                    "Responde SOLO el JSON, sin texto adicional. Responde en español."
                ),
            },
            {"role": "user", "content": f"Datos actuales:\n{context}\n\nGenera 4 insights:"},
        ]

        raw = (await _groq_chat_async(messages, temperature=0.4, max_tokens=600)).strip()
        try:
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            insights = json.loads(raw)
        except (json.JSONDecodeError, IndexError):
            insights = [{"icon": "alert", "title": "Respuesta", "description": raw[:200]}]

        return {"insights": insights}
    except Exception as e:
        print(f"[AI Insights Error] {e}")
        return {"insights": [{"icon": "alert", "title": "Error", "description": str(e)[:200]}]}


@router.post("/predictions")
async def ai_predictions(body: ContextRequest, _user: str = Depends(require_auth)):
    try:
        context = json.dumps(body.context_data, default=str, ensure_ascii=False) if body.context_data else "{}"

        messages = [
            {
                "role": "system",
                "content": (
                    "Eres un analista predictivo del contact center Uniandes. "
                    "Basándote en las tendencias de las últimas semanas, predice los próximos 4 períodos. "
                    "Formato JSON: [{\"period\": \"Semana X\", \"predicted_leads\": N, \"predicted_efectivos\": N, \"confidence\": 0.0-1.0}]. "
                    "Responde SOLO el JSON, sin texto adicional."
                ),
            },
            {"role": "user", "content": f"Tendencia histórica:\n{context}\n\nPredice las próximas 4 semanas:"},
        ]

        raw = (await _groq_chat_async(messages, temperature=0.3, max_tokens=400)).strip()
        try:
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            predictions = json.loads(raw)
        except (json.JSONDecodeError, IndexError):
            predictions = []

        return {"predictions": predictions}
    except Exception as e:
        print(f"[AI Predictions Error] {e}")
        return {"predictions": []}


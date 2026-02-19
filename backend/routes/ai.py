import os
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from routes.auth import require_auth
from mock_data import get_contacts, get_facts
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from groq import Groq

router = APIRouter(prefix="/api/ai", tags=["ai"])

_client = None
MODEL = "llama-3.3-70b-versatile"


def get_groq():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY not configured")
        _client = Groq(api_key=api_key)
    return _client


def _get_data_context() -> str:
    """Build a summary of current data for AI context."""
    contacts = get_contacts()
    total = len(contacts)
    contactados = sum(1 for c in contacts if c["resultado_gestion"] == "Contactado")
    no_contactados = sum(1 for c in contacts if c["resultado_gestion"] == "No Contactado")
    efectivo = sum(1 for c in contacts if c["resultado_gestion"] == "Contacto Efectivo")

    medio_counts = Counter(c["medio"] for c in contacts).most_common(5)
    prog_counts = Counter(c["programa_interes"] for c in contacts if c.get("programa_interes")).most_common(5)

    # Weekly trends
    weekly = defaultdict(int)
    for c in contacts:
        if c.get("fecha_a_utilizar"):
            dt = datetime.strptime(c["fecha_a_utilizar"], "%Y-%m-%d")
            week_start = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
            weekly[week_start] += 1
    recent_weeks = sorted(weekly.items(), reverse=True)[:8]

    return json.dumps({
        "kpis": {
            "total_leads": total,
            "contactados": contactados,
            "no_contactados": no_contactados,
            "contacto_efectivo": efectivo,
        },
        "top_medios": [{"medio": m, "total": t} for m, t in medio_counts],
        "tendencia_semanal": [{"semana": s, "leads": l} for s, l in recent_weeks],
        "top_programas": [{"programa": p, "total": t} for p, t in prog_counts],
    }, default=str, ensure_ascii=False)


class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = []


@router.post("/chat")
async def ai_chat(body: ChatRequest, _user: str = Depends(require_auth)):
    context = _get_data_context()

    messages = [
        {
            "role": "system",
            "content": (
                "Eres un analista de datos experto del contact center Crexe. "
                "Respondes preguntas sobre leads, gestión y conversión usando los datos reales. "
                "Sé conciso, usa números y porcentajes. Responde en español.\n\n"
                f"DATOS ACTUALES:\n{context}"
            ),
        }
    ]

    for h in (body.history or [])[-6:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    messages.append({"role": "user", "content": body.message})

    chat = get_groq().chat.completions.create(model=MODEL, messages=messages, temperature=0.3, max_tokens=800)
    return {"response": chat.choices[0].message.content}


@router.get("/insights")
async def ai_insights(_user: str = Depends(require_auth)):
    context = _get_data_context()

    chat = get_groq().chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres un analista de datos del contact center Crexe. "
                    "Genera exactamente 4 insights breves y accionables basados en los datos. "
                    "Formato JSON: [{\"icon\": \"trending_up|trending_down|alert|star\", \"title\": \"...\", \"description\": \"...\"}]. "
                    "Responde SOLO el JSON, sin texto adicional. Responde en español."
                ),
            },
            {"role": "user", "content": f"Datos actuales:\n{context}\n\nGenera 4 insights:"},
        ],
        temperature=0.4,
        max_tokens=600,
    )

    raw = chat.choices[0].message.content.strip()
    try:
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        insights = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        insights = [{"icon": "alert", "title": "Sin datos suficientes", "description": raw[:200]}]

    return {"insights": insights}


@router.get("/predictions")
async def ai_predictions(_user: str = Depends(require_auth)):
    context = _get_data_context()

    chat = get_groq().chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres un analista predictivo del contact center Crexe. "
                    "Basándote en las tendencias de las últimas semanas, predice los próximos 4 períodos. "
                    "Formato JSON: [{\"period\": \"Semana X\", \"predicted_leads\": N, \"predicted_efectivos\": N, \"confidence\": 0.0-1.0}]. "
                    "Responde SOLO el JSON, sin texto adicional."
                ),
            },
            {"role": "user", "content": f"Tendencia histórica:\n{context}\n\nPredice las próximas 4 semanas:"},
        ],
        temperature=0.3,
        max_tokens=400,
    )

    raw = chat.choices[0].message.content.strip()
    try:
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        predictions = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        predictions = []

    return {"predictions": predictions}

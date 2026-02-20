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


async def _get_data_context() -> str:
    """Build a comprehensive summary of current data for AI context using DB queries."""
    
    q_kpis = """
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE resultado_gestion = 'Contactado') as contactados,
            COUNT(*) FILTER (WHERE resultado_gestion = 'No Contactado') as no_contactados,
            COUNT(*) FILTER (WHERE resultado_gestion = 'Contacto Efectivo') as efectivo,
            COUNT(*) FILTER (WHERE ultima_subcategoria = '116') as matriculados
        FROM dim_contactos
    """
    
    q_medios = """
        SELECT medio, COUNT(*) as total 
        FROM dim_contactos 
        WHERE medio IS NOT NULL 
        GROUP BY medio ORDER BY total DESC LIMIT 10
    """
    
    q_programas = """
        SELECT programa_interes as programa, COUNT(*) as total 
        FROM dim_contactos 
        WHERE programa_interes IS NOT NULL AND programa_interes != '' 
        GROUP BY programa_interes ORDER BY total DESC LIMIT 10
    """
    
    q_agentes = """
        SELECT usuario as agente, COUNT(*) as gestiones 
        FROM fact_contactos 
        WHERE usuario IS NOT NULL AND usuario != '' 
        GROUP BY usuario ORDER BY gestiones DESC LIMIT 10
    """
    
    q_weekly = """
        SELECT TO_CHAR(DATE_TRUNC('WEEK', CAST(fecha_a_utilizar AS DATE)), 'YYYY-MM-DD') as semana, COUNT(*) as leads 
        FROM dim_contactos 
        WHERE fecha_a_utilizar IS NOT NULL AND fecha_a_utilizar != '' 
        GROUP BY 1 ORDER BY 1 DESC LIMIT 8
    """

    res_kpis, res_medios, res_programas, res_agentes, res_weekly = await asyncio.gather(
        fetch_one(q_kpis),
        fetch_all(q_medios),
        fetch_all(q_programas),
        fetch_all(q_agentes),
        fetch_all(q_weekly)
    )

    if not res_kpis:
        res_kpis = {"total": 0, "contactados": 0, "no_contactados": 0, "efectivo": 0, "matriculados": 0}

    total = res_kpis["total"] or 0
    contactados = res_kpis["contactados"] or 0
    efectivo = res_kpis["efectivo"] or 0
    matriculados = res_kpis["matriculados"] or 0

    funnel = [
        {"etapa": "Leads", "valor": total},
        {"etapa": "Contactados", "valor": contactados},
        {"etapa": "Contacto Efectivo", "valor": efectivo},
        {"etapa": "Matriculados", "valor": matriculados},
    ]

    return json.dumps({
        "kpis": {
            "total_leads": total,
            "contactados": contactados,
            "no_contactados": res_kpis["no_contactados"] or 0,
            "contacto_efectivo": efectivo,
            "matriculados": matriculados,
            "tasa_contacto": f"{(contactados / total * 100):.1f}%" if total else "0%",
            "tasa_efectividad": f"{(efectivo / contactados * 100):.1f}%" if contactados else "0%",
            "tasa_matriculacion": f"{(matriculados / total * 100):.1f}%" if total else "0%",
        },
        "embudo_conversion": funnel,
        "top_medios": res_medios,
        "tendencia_semanal": res_weekly,
        "top_programas": res_programas,
        "top_agentes": res_agentes,
    }, default=str, ensure_ascii=False)


class ChatRequest(BaseModel):
    message: str
    history: Optional[list] = []


@router.post("/chat")
async def ai_chat(body: ChatRequest, _user: str = Depends(require_auth)):
    try:
        context = await _get_data_context()

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


@router.get("/insights")
async def ai_insights(_user: str = Depends(require_auth)):
    try:
        context = await _get_data_context()

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


@router.get("/predictions")
async def ai_predictions(_user: str = Depends(require_auth)):
    try:
        context = await _get_data_context()

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


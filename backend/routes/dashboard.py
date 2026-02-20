from fastapi import APIRouter, Depends, Query
from typing import Optional
from routes.auth import require_auth
from database import fetch_all, fetch_one
from datetime import datetime
from collections import Counter, defaultdict

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

async def _get_base_filter(base: Optional[str]) -> tuple[str, list]:
    where = "WHERE 1=1"
    args = []
    if base:
        where += " AND base = $1"
        args.append(base)
    return where, args


@router.get("/kpis")
async def get_kpis(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    where, args = await _get_base_filter(base)
    
    query = f"""
        SELECT 
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE resultado_gestion IN ('Contactado', 'Contacto Efectivo')) as contactados,
            COUNT(*) FILTER (WHERE resultado_gestion = 'No Contactado') as no_contactados,
            COUNT(*) FILTER (WHERE resultado_gestion = 'Contacto Efectivo') as contacto_efectivo,
            COUNT(*) FILTER (WHERE ultima_subcategoria = '116') as matriculados,
            AVG(NULLIF(CAST(toques AS INTEGER), 0)) as avg_toques
        FROM dim_contactos
        {where}
    """
    
    row = await fetch_one(query, *args)
    if not row:
        return {"total_leads": 0, "contactados": 0, "no_contactados": 0, "contacto_efectivo": 0, "matriculados": 0, "avg_toques": 0}
        
    return {
        "total_leads": row["total_leads"] or 0,
        "contactados": row["contactados"] or 0,
        "no_contactados": row["no_contactados"] or 0,
        "contacto_efectivo": row["contacto_efectivo"] or 0,
        "matriculados": row["matriculados"] or 0,
        "avg_toques": round(float(row["avg_toques"]), 1) if row["avg_toques"] else 0,
    }


@router.get("/funnel")
async def get_funnel(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    where, args = await _get_base_filter(base)
    
    query = f"""
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE resultado_gestion IN ('Contactado', 'Contacto Efectivo')) as contactados,
            COUNT(*) FILTER (WHERE resultado_gestion = 'Contacto Efectivo') as efectivo,
            COUNT(*) FILTER (WHERE ultima_subcategoria = '116') as matriculados
        FROM dim_contactos
        {where}
    """
    row = await fetch_one(query, *args)
    row = row or {"total": 0, "contactados": 0, "efectivo": 0, "matriculados": 0}
    
    return [
        {"stage": "Leads", "value": row["total"] or 0, "color": "#3b82f6"},
        {"stage": "Contactados", "value": row["contactados"] or 0, "color": "#60a5fa"},
        {"stage": "Contacto Efectivo", "value": row["efectivo"] or 0, "color": "#22c55e"},
        {"stage": "Matriculados", "value": row["matriculados"] or 0, "color": "#a855f7"},
    ]


@router.get("/trends")
async def get_trends(
    period: str = Query("week"),
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    where, args = await _get_base_filter(base)
    
    if period == "day":
        date_trunc = "DAY"
    elif period == "week":
        date_trunc = "WEEK"
    else:
        date_trunc = "MONTH"

    query = f"""
        SELECT 
            TO_CHAR(DATE_TRUNC('{date_trunc}', CAST(fecha_a_utilizar AS DATE)), 'YYYY-MM-DD') as period,
            COUNT(*) as leads,
            COUNT(*) FILTER (WHERE resultado_gestion = 'Contacto Efectivo') as efectivos,
            COUNT(*) FILTER (WHERE ultima_subcategoria = '116') as matriculados
        FROM dim_contactos
        {where} AND fecha_a_utilizar IS NOT NULL AND fecha_a_utilizar != ''
        GROUP BY 1
        ORDER BY 1 ASC
    """
    
    rows = await fetch_all(query, *args)
    return rows


@router.get("/by-medio")
async def get_by_medio(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    where, args = await _get_base_filter(base)
    
    query = f"""
        SELECT 
            medio,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE resultado_gestion = 'Contacto Efectivo') as efectivos
        FROM dim_contactos
        {where} AND medio IS NOT NULL
        GROUP BY medio
        ORDER BY total DESC
    """
    rows = await fetch_all(query, *args)
    return rows


@router.get("/by-programa")
async def get_by_programa(
    base: Optional[str] = Query(None),
    limit: int = Query(15),
    _user: str = Depends(require_auth),
):
    where, args = await _get_base_filter(base)
    if args:
        where += " AND programa_interes IS NOT NULL AND programa_interes != ''"
    else:
        where = "WHERE programa_interes IS NOT NULL AND programa_interes != ''"

    query = f"""
        SELECT 
            programa_interes as programa,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE resultado_gestion = 'Contacto Efectivo') as efectivos
        FROM dim_contactos
        {where}
        GROUP BY programa_interes
        ORDER BY total DESC
        LIMIT {limit}
    """
    rows = await fetch_all(query, *args)
    return rows


@router.get("/agents")
async def get_agents(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    # Agents are processed from fact_contactos
    base_join = ""
    where = "WHERE f.usuario IS NOT NULL AND f.usuario != ''"
    args = []
    
    if base:
        base_join = "JOIN dim_bases b ON f.iddatabase = b.iddatabase"
        where += " AND b.descripcion = $1"
        args.append(base)

    query = f"""
        SELECT 
            f.usuario as usuario,
            COUNT(DISTINCT f.idinterno) as total_leads,
            COUNT(DISTINCT f.idinterno) FILTER (WHERE c.resultado_gestion IN ('Contactado', 'Contacto Efectivo')) as contactados,
            COUNT(DISTINCT f.idinterno) FILTER (WHERE c.resultado_gestion = 'Contacto Efectivo') as contacto_efectivo,
            COUNT(DISTINCT f.idinterno) FILTER (WHERE c.resultado_gestion = 'No Contactado') as no_contactados,
            COUNT(DISTINCT f.idinterno) FILTER (WHERE c.ultima_subcategoria = '116') as matriculados
        FROM fact_contactos f
        JOIN dim_contactos c ON f.idinterno = c.idinterno
        {base_join}
        {where}
        GROUP BY f.usuario
        ORDER BY total_leads DESC
        LIMIT 20
    """
    rows = await fetch_all(query, *args)
    return rows


@router.get("/leads")
async def get_leads(
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    medio: Optional[str] = Query(None),
    resultado: Optional[str] = Query(None),
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    where, args = await _get_base_filter(base)
    arg_idx = len(args) + 1
    
    if search:
        search_term = f"%{search.lower()}%"
        where += f" AND (LOWER(txtnombreapellid) LIKE ${arg_idx} OR LOWER(emlmail) LIKE ${arg_idx} OR LOWER(teltelefono) LIKE ${arg_idx})"
        args.append(search_term)
        arg_idx += 1
        
    if medio:
        where += f" AND medio = ${arg_idx}"
        args.append(medio)
        arg_idx += 1
        
    if resultado:
        where += f" AND resultado_gestion = ${arg_idx}"
        args.append(resultado)
        arg_idx += 1

    count_query = f"SELECT COUNT(*) as c FROM dim_contactos {where}"
    count_row = await fetch_one(count_query, *args)
    total = count_row["c"] if count_row else 0

    offset = (page - 1) * per_page
    query = f"""
        SELECT 
            idinterno,
            txtnombreapellid as nombre,
            emlmail as email,
            teltelefono as telefono,
            medio,
            programa_interes,
            resultado_gestion,
            toques,
            fecha_a_utilizar as fecha_lead,
            fecha_ult_gestion,
            base
        FROM dim_contactos
        {where}
        ORDER BY fecha_a_utilizar DESC NULLS LAST
        LIMIT {per_page} OFFSET {offset}
    """
    rows = await fetch_all(query, *args)
    
    return {"data": rows, "total": total, "page": page, "per_page": per_page}


@router.get("/bases")
async def get_bases_list(_user: str = Depends(require_auth)):
    query = "SELECT iddatabase, descripcion FROM dim_bases ORDER BY descripcion ASC"
    rows = await fetch_all(query)
    return rows


from fastapi import APIRouter, Depends, Query
from typing import Optional
from routes.auth import require_auth
from mock_data import get_contacts, get_facts, get_bases, get_subcategorias
from datetime import datetime
from collections import Counter, defaultdict

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _filter_contacts(base=None):
    contacts = get_contacts()
    if base:
        contacts = [c for c in contacts if c["base"] == base]
    return contacts


@router.get("/kpis")
async def get_kpis(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    contacts = _filter_contacts(base)
    total = len(contacts)
    contactados = sum(1 for c in contacts if c["resultado_gestion"] == "Contactado")
    no_contactados = sum(1 for c in contacts if c["resultado_gestion"] == "No Contactado")
    efectivo = sum(1 for c in contacts if c["resultado_gestion"] == "Contacto Efectivo")
    matriculados = sum(1 for c in contacts if c.get("_is_matriculado"))
    toques_vals = [int(c["toques"]) for c in contacts if int(c["toques"]) > 0]
    avg_toques = round(sum(toques_vals) / len(toques_vals), 1) if toques_vals else 0

    return {
        "total_leads": total,
        "contactados": contactados,
        "no_contactados": no_contactados,
        "contacto_efectivo": efectivo,
        "matriculados": matriculados,
        "avg_toques": avg_toques,
    }


@router.get("/funnel")
async def get_funnel(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    contacts = _filter_contacts(base)
    total = len(contacts)
    contactados = sum(1 for c in contacts if c["resultado_gestion"] in ("Contactado", "Contacto Efectivo"))
    efectivo = sum(1 for c in contacts if c["resultado_gestion"] == "Contacto Efectivo")
    matriculados = sum(1 for c in contacts if c.get("_is_matriculado"))

    return [
        {"stage": "Leads", "value": total, "color": "#3b82f6"},
        {"stage": "Contactados", "value": contactados, "color": "#60a5fa"},
        {"stage": "Contacto Efectivo", "value": efectivo, "color": "#22c55e"},
        {"stage": "Matriculados", "value": matriculados, "color": "#a855f7"},
    ]


@router.get("/trends")
async def get_trends(
    period: str = Query("week"),
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    contacts = _filter_contacts(base)
    buckets = defaultdict(lambda: {"leads": 0, "efectivos": 0, "matriculados": 0})

    for c in contacts:
        if not c.get("fecha_a_utilizar"):
            continue
        dt = datetime.strptime(c["fecha_a_utilizar"], "%Y-%m-%d")
        if period == "day":
            key = dt.strftime("%Y-%m-%d")
        elif period == "week":
            key = (dt - __import__("datetime").timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
        else:
            key = dt.strftime("%Y-%m-01")

        buckets[key]["leads"] += 1
        if c["resultado_gestion"] == "Contacto Efectivo":
            buckets[key]["efectivos"] += 1
        if c.get("_is_matriculado"):
            buckets[key]["matriculados"] += 1

    result = [{"period": k, **v} for k, v in sorted(buckets.items())]
    return result


@router.get("/by-medio")
async def get_by_medio(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    contacts = _filter_contacts(base)
    medio_counts = Counter(c["medio"] for c in contacts)
    efectivo_counts = Counter(c["medio"] for c in contacts if c["resultado_gestion"] == "Contacto Efectivo")

    result = [
        {"medio": m, "total": t, "efectivos": efectivo_counts.get(m, 0)}
        for m, t in medio_counts.most_common()
    ]
    return result


@router.get("/by-programa")
async def get_by_programa(
    base: Optional[str] = Query(None),
    limit: int = Query(15),
    _user: str = Depends(require_auth),
):
    contacts = _filter_contacts(base)
    prog_contacts = [c for c in contacts if c.get("programa_interes")]
    prog_counts = Counter(c["programa_interes"] for c in prog_contacts)
    efect_counts = Counter(c["programa_interes"] for c in prog_contacts if c["resultado_gestion"] == "Contacto Efectivo")

    result = [
        {"programa": p, "total": t, "efectivos": efect_counts.get(p, 0)}
        for p, t in prog_counts.most_common(limit)
    ]
    return result


@router.get("/agents")
async def get_agents(
    base: Optional[str] = Query(None),
    _user: str = Depends(require_auth),
):
    facts = get_facts()
    if base:
        base_ids = {str(b["iddatabase"]) for b in get_bases() if b["descripcion"] == base}
        facts = [f for f in facts if f["iddatabase"] in base_ids]

    agent_data = defaultdict(lambda: {"total_gestiones": 0, "leads": set(), "ventas": 0})
    for f in facts:
        if not f.get("usuario"):
            continue
        agent_data[f["usuario"]]["total_gestiones"] += 1
        agent_data[f["usuario"]]["leads"].add(f["idinterno"])
        if f["idventa"] and f["idventa"] != "0":
            agent_data[f["usuario"]]["ventas"] += 1

    result = sorted(
        [
            {
                "usuario": u,
                "total_gestiones": d["total_gestiones"],
                "leads_gestionados": len(d["leads"]),
                "ventas": d["ventas"],
            }
            for u, d in agent_data.items()
        ],
        key=lambda x: x["total_gestiones"],
        reverse=True,
    )[:20]
    return result


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
    contacts = _filter_contacts(base)

    if search:
        s = search.lower()
        contacts = [
            c for c in contacts
            if s in (c.get("txtnombreapellid") or "").lower()
            or s in (c.get("emlmail") or "").lower()
            or s in (c.get("teltelefono") or "").lower()
        ]
    if medio:
        contacts = [c for c in contacts if c["medio"] == medio]
    if resultado:
        contacts = [c for c in contacts if c["resultado_gestion"] == resultado]

    contacts.sort(key=lambda c: c.get("fecha_a_utilizar") or "", reverse=True)
    total = len(contacts)
    start = (page - 1) * per_page
    page_data = contacts[start: start + per_page]

    rows = [
        {
            "idinterno": c["idinterno"],
            "nombre": c["txtnombreapellid"],
            "email": c["emlmail"],
            "telefono": c["teltelefono"],
            "medio": c["medio"],
            "programa_interes": c["programa_interes"],
            "resultado_gestion": c["resultado_gestion"],
            "toques": c["toques"],
            "fecha_lead": c["fecha_a_utilizar"],
            "fecha_ult_gestion": c["fecha_ult_gestion"],
            "base": c["base"],
        }
        for c in page_data
    ]
    return {"data": rows, "total": total, "page": page, "per_page": per_page}


@router.get("/bases")
async def get_bases_list(_user: str = Depends(require_auth)):
    return [{"iddatabase": b["iddatabase"], "descripcion": b["descripcion"]} for b in get_bases()]

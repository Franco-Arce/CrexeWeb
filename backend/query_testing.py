import sys
import os

from database import fetch_all

async def query_contacts(base=None):
    query = """
        SELECT 
            c.idinterno, c.medio, c.txtnombreapellid, c.emlmail, c.teltelefono, c.programa_interes, 
            c.fecha_ult_gestion, c.fecha_a_utilizar, c.toques, c.resultado_gestion, 
            c.base as base_name,
            c.ultima_subcategoria, -- Added specific subcats
            c.iddatabase
        FROM dim_contactos c
    """
    args = []
    if base:
        query += " WHERE c.base = $1"
        args.append(base)
    
    return await fetch_all(query, *args)


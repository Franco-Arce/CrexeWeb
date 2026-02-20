import asyncio
import os
import json
from routes.dashboard import get_kpis, get_funnel, get_trends, get_by_medio, get_by_programa, get_agents, get_leads, get_bases_list
from routes.ai import ai_insights, ai_predictions, ChatRequest, ai_chat
from database import close_pool

async def test_all():
    try:
        print("--- Testing Dashboard ---")
        
        print("1. /kpis")
        kpis = await get_kpis(base=None, _user="test")
        print(json.dumps(kpis, indent=2))
        
        print("\n2. /funnel")
        funnel = await get_funnel(base=None, _user="test")
        print(json.dumps(funnel, indent=2))
        
        print("\n3. /trends (week)")
        trends = await get_trends(period="week", base=None, _user="test")
        print(f"Got {len(trends)} records. First 2:", json.dumps(trends[:2], indent=2))
        
        print("\n4. /by-medio")
        medios = await get_by_medio(base=None, _user="test")
        print(json.dumps(medios[:3], indent=2))
        
        print("\n5. /by-programa")
        programas = await get_by_programa(base=None, limit=5, _user="test")
        print(json.dumps(programas, indent=2))
        
        print("\n6. /agents")
        agents = await get_agents(base=None, _user="test")
        print(f"Got {len(agents)} agents. First 2:", json.dumps(agents[:2], indent=2))
        
        print("\n7. /leads")
        leads = await get_leads(page=1, per_page=2, search=None, medio=None, resultado=None, base=None, _user="test")
        print(f"Total: {leads['total']}, Page: {leads['page']}, Per Page: {leads['per_page']}")
        print("Data:", json.dumps(leads['data'], indent=2))
        
        print("\n8. /bases")
        bases = await get_bases_list(_user="test")
        print(json.dumps(bases, indent=2))
        
        print("\n--- Testing AI ---")
        print("Insights:")
        ins = await ai_insights(_user="test")
        print(json.dumps(ins, indent=2))
        
        print("Predictions:")
        pred = await ai_predictions(_user="test")
        print(json.dumps(pred, indent=2))
        
    finally:
        await close_pool()

if __name__ == "__main__":
    asyncio.run(test_all())

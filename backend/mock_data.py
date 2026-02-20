"""
Mock data generator based on the n8n workflow data model.
Provides realistic data for development without PostgreSQL.
"""
import random
from datetime import datetime, timedelta

# ── Dimension: Bases ──
BASES = [
    {"iddatabase": 188, "descripcion": "Uniandes - Posgrados", "fecha_alta": "2024-01-15"},
    {"iddatabase": 204, "descripcion": "Uniandes - Licenciaturas", "fecha_alta": "2024-03-01"},
    {"iddatabase": 207, "descripcion": "Uniandes - Diplomados", "fecha_alta": "2024-05-10"},
    {"iddatabase": 208, "descripcion": "Uniandes - Maestrías", "fecha_alta": "2024-06-20"},
    {"iddatabase": 209, "descripcion": "Uniandes - Educación Continua", "fecha_alta": "2024-08-01"},
]

MEDIOS = ["Google", "Facebook", "Email", "whatsapp", "Otras Redes Sociales", "Otros"]
MEDIOS_WEIGHTS = [30, 35, 12, 10, 5, 8]

PROGRAMAS = [
    "MBA", "Derecho Corporativo", "Marketing Digital", "Ingeniería Industrial",
    "Psicología Organizacional", "Finanzas", "Administración de Empresas",
    "Comercio Internacional", "Data Science", "Inteligencia Artificial",
    "Gestión de Proyectos", "Recursos Humanos", "Contaduría Pública",
    "Comunicación", "Arquitectura",
]

SUBCATEGORIAS = [
    {"subcategoria": 51, "categoria": 3, "descripcion_sub": "Interesado - Solicita info"},
    {"subcategoria": 55, "categoria": 3, "descripcion_sub": "Interesado - Agenda cita"},
    {"subcategoria": 56, "categoria": 3, "descripcion_sub": "Interesado - Solicita beca"},
    {"subcategoria": 33, "categoria": 2, "descripcion_sub": "Contactado - Buzón de voz"},
    {"subcategoria": 34, "categoria": 2, "descripcion_sub": "Contactado - No contesta"},
    {"subcategoria": 35, "categoria": 2, "descripcion_sub": "Contactado - Ocupado"},
    {"subcategoria": 2, "categoria": 1, "descripcion_sub": "No localizado"},
    {"subcategoria": 116, "categoria": 5, "descripcion_sub": "Matriculado"},
    {"subcategoria": 71, "categoria": 3, "descripcion_sub": "Interesado - WhatsApp"},
    {"subcategoria": 83, "categoria": 3, "descripcion_sub": "Inscrito a evento"},
]

NOMBRES = [
    "Juan Pérez", "María García", "Carlos López", "Ana Martínez", "Roberto Sánchez",
    "Laura Rodríguez", "Diego Fernández", "Camila Torres", "Andrés Ramírez", "Sofía Herrera",
    "Pablo Díaz", "Valentina Ruiz", "Sebastián Morales", "Isabella Vargas", "Mateo Castillo",
    "Luciana Flores", "Santiago Jiménez", "Daniela Rojas", "Tomás Aguilar", "Victoria Castro",
    "Nicolás Mendoza", "Gabriela Ortiz", "Emiliano Delgado", "Mariana Ríos", "Lucas Medina",
    "Catalina Guerrero", "Alejandro Peña", "Adriana Gutiérrez", "Fernando Silva", "Paola Navarro",
]

AGENTES = [
    "AGOMEZ", "JRODRIGUEZ", "MMARTINEZ", "CFERNANDEZ", "LSANCHEZ",
    "PTORRES", "ADIAZ", "RRUIZ", "DMORALES", "EVARGAS",
    "SCASTILLO", "NFLORES", "VJIMENEZ", "FROJAS", "GAGUILAR",
]

RESULTADOS = ["No Contactado", "Contactado", "Contacto Efectivo"]
RESULTADOS_WEIGHTS = [35, 40, 25]


def _random_date(start_days_ago=365, end_days_ago=0):
    days = random.randint(end_days_ago, start_days_ago)
    return (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")


def _random_phone():
    return f"+52 {random.randint(55,99)}{random.randint(10000000, 99999999)}"


def _random_email(nombre):
    domain = random.choice(["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"])
    clean = nombre.lower().replace(" ", ".").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    return f"{clean}{random.randint(1,99)}@{domain}"


def generate_contacts(n=1200):
    """Generate dim_contactos rows."""
    contacts = []
    for i in range(1, n + 1):
        nombre = random.choice(NOMBRES)
        resultado = random.choices(RESULTADOS, weights=RESULTADOS_WEIGHTS)[0]
        medio = random.choices(MEDIOS, weights=MEDIOS_WEIGHTS)[0]
        base = random.choice(BASES)
        fecha = _random_date(300, 1)
        toques = 0 if resultado == "No Contactado" else random.randint(1, 12)

        is_matriculado = resultado == "Contacto Efectivo" and random.random() < 0.25
        subcat_num = 2 if resultado == "Contacto Efectivo" else (1 if resultado == "Contactado" else 0)

        contacts.append({
            "idinterno": str(100000 + i),
            "medio": medio,
            "txtnombreapellid": nombre,
            "emlmail": _random_email(nombre),
            "teltelefono": _random_phone(),
            "fecfechainsercionlead": fecha,
            "base": base["descripcion"],
            "lote": f"Lote {random.randint(1, 20)}",
            "iddatabase": str(base["iddatabase"]),
            "fecha_creacion_lote": _random_date(350, 10),
            "descrip_subcat": random.choice(SUBCATEGORIAS)["descripcion_sub"],
            "descrip_cat": "Gestión",
            "fecha_ult_gestion": _random_date(60, 0) if toques > 0 else None,
            "fecha_a_utilizar": fecha,
            "ultima_mejor_subcat_num": str(subcat_num),
            "ultima_mejor_subcat_string": "Interesado" if subcat_num == 2 else ("Contactado" if subcat_num == 1 else "Sin gestión"),
            "toques": str(toques),
            "resultado_gestion": resultado,
            "telwhatsapp": _random_phone() if random.random() > 0.3 else None,
            "programa_interes": random.choice(PROGRAMAS),
            "txtcarretainteres": random.choice(PROGRAMAS),
            "criterio_cliente": "1" if resultado != "No Contactado" else "0",
            "ultima_subcategoria": str(random.choice(SUBCATEGORIAS)["subcategoria"]),
            "_is_matriculado": is_matriculado,
        })
    return contacts


def generate_fact_contactos(contacts):
    """Generate fact_contactos rows from contacts."""
    facts = []
    for c in contacts:
        toques = int(c["toques"])
        for t in range(toques):
            fecha_base = datetime.strptime(c["fecfechainsercionlead"], "%Y-%m-%d")
            fecha_gestion = fecha_base + timedelta(days=random.randint(1, 60))
            agente = random.choice(AGENTES)
            subcat = random.choice(SUBCATEGORIAS)

            has_venta = c["_is_matriculado"] and t == toques - 1
            facts.append({
                "dedup_key": f"mock_{c['idinterno']}_{t}",
                "idinterno": c["idinterno"],
                "idllamada": str(random.randint(1000000, 9999999)),
                "fecha": fecha_gestion.strftime("%Y-%m-%d %H:%M:%S"),
                "idventa": str(random.randint(1, 999)) if has_venta else "0",
                "campania": f"Camp_{random.randint(1, 8)}",
                "iddatabase": c["iddatabase"],
                "subcategoria": str(subcat["subcategoria"]),
                "usuario": agente,
                "usuario_rellamar": agente if random.random() > 0.7 else "",
                "rellamar": _random_date(30, 0) if random.random() > 0.8 else "",
                "motivo_traida": random.choice(["Lead nuevo", "Rellamada", "Campaña", "Reactivación"]),
            })
    return facts


# ── Pre-generate data ──
_contacts = None
_facts = None


def get_contacts():
    global _contacts
    if _contacts is None:
        _contacts = generate_contacts(1200)
    return _contacts


def get_facts():
    global _facts
    if _facts is None:
        _facts = generate_fact_contactos(get_contacts())
    return _facts


def get_bases():
    return BASES


def get_subcategorias():
    return SUBCATEGORIAS

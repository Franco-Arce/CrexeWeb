import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';

const RESULT_BADGE = {
    'Contacto Efectivo': 'green',
    'Contactado': 'blue',
    'No Contactado': 'red',
};

export default function LeadsPage() {
    const [data, setData] = useState({ data: [], total: 0, page: 1, per_page: 25 });
    const [search, setSearch] = useState('');
    const [medio, setMedio] = useState('');
    const [resultado, setResultado] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.leads({ page, search, medio, resultado });
            setData(res);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }, [page, search, medio, resultado]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.ceil(data.total / data.per_page) || 1;

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        load();
    };

    return (
        <div className="animate-fade-in">
            <form className="filters-bar" onSubmit={handleSearch}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 36, width: '100%' }}
                    />
                </div>
                <select value={medio} onChange={(e) => { setMedio(e.target.value); setPage(1); }}>
                    <option value="">Todos los medios</option>
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="Otros">Otros</option>
                </select>
                <select value={resultado} onChange={(e) => { setResultado(e.target.value); setPage(1); }}>
                    <option value="">Todos los resultados</option>
                    <option value="No Contactado">No Contactado</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Contacto Efectivo">Contacto Efectivo</option>
                </select>
            </form>

            <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="card-header">
                    <span className="card-title">Listado de Leads</span>
                    <span className="card-subtitle">{data.total?.toLocaleString()} registros</span>
                </div>

                {loading ? (
                    <div className="loading-spinner" />
                ) : (
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Medio</th>
                                    <th>Programa</th>
                                    <th>Resultado</th>
                                    <th>Toques</th>
                                    <th>Fecha Lead</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.data?.map((lead, i) => (
                                    <motion.tr
                                        key={lead.idinterno || i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                    >
                                        <td style={{ fontWeight: 500, color: '#f1f5f9' }}>{lead.nombre || '—'}</td>
                                        <td>{lead.email || '—'}</td>
                                        <td>{lead.telefono || '—'}</td>
                                        <td><span className={`badge ${lead.medio === 'Google' ? 'blue' : lead.medio === 'Facebook' ? 'purple' : 'yellow'}`}>{lead.medio || '—'}</span></td>
                                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.programa_interes || '—'}</td>
                                        <td><span className={`badge ${RESULT_BADGE[lead.resultado_gestion] || 'yellow'}`}>{lead.resultado_gestion || '—'}</span></td>
                                        <td>{lead.toques || 0}</td>
                                        <td>{lead.fecha_lead ? new Date(lead.fecha_lead).toLocaleDateString('es-AR') : '—'}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft size={14} />
                    </button>
                    <span>Página {page} de {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

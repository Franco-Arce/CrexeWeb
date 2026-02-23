import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Filter, Download, Users } from 'lucide-react';
import api from '../api';

const STATUS_STYLES = {
    'Contacto Efectivo': 'bg-emerald-50 text-emerald-700',
    'Contactado': 'bg-blue-50 text-blue-700',
    'No Contactado': 'bg-slate-100 text-slate-500',
};

const MEDIO_STYLES = {
    'Google': 'bg-blue-50 text-blue-600',
    'Facebook': 'bg-indigo-50 text-indigo-600',
    'whatsapp': 'bg-emerald-50 text-emerald-600',
    'Email': 'bg-amber-50 text-amber-600',
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
        <div className="space-y-5">
            {/* Filters */}
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[240px]">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-nods-card border border-nods-border rounded-xl text-sm outline-none focus:border-nods-accent focus:ring-2 focus:ring-nods-accent/20 transition-all text-white"
                    />
                </div>
                <select
                    value={medio}
                    onChange={(e) => { setMedio(e.target.value); setPage(1); }}
                    className="px-4 py-3 bg-nods-card border border-nods-border rounded-xl text-sm text-slate-400 outline-none focus:border-nods-accent cursor-pointer"
                >
                    <option value="">Todos los medios</option>
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="Otros">Otros</option>
                </select>
                <select
                    value={resultado}
                    onChange={(e) => { setResultado(e.target.value); setPage(1); }}
                    className="px-4 py-3 bg-nods-card border border-nods-border rounded-xl text-sm text-slate-400 outline-none focus:border-nods-accent cursor-pointer"
                >
                    <option value="">Todos los resultados</option>
                    <option value="No Contactado">No Contactado</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Contacto Efectivo">Contacto Efectivo</option>
                </select>
            </form>

            {/* Table */}
            <div className="bg-nods-card border border-nods-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        <span className="font-bold text-white text-sm">Listado de Leads</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">{data.total?.toLocaleString()} registros</span>
                </div>

                {loading ? (
                    <div className="loading-spinner" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-nods-bg text-nods-text-muted text-[10px] uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Teléfono</th>
                                    <th className="px-6 py-4">Medio</th>
                                    <th className="px-6 py-4">Programa</th>
                                    <th className="px-6 py-4">Resultado</th>
                                    <th className="px-6 py-4">Toques</th>
                                    <th className="px-6 py-4">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.data?.map((lead, i) => (
                                    <motion.tr
                                        key={lead.idinterno || i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-white">{lead.nombre || '—'}</p>
                                            <p className="text-[11px] text-nods-text-muted">ID: #{lead.idinterno || i}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-nods-text-silver">{lead.email || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-nods-text-silver">{lead.telefono || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${MEDIO_STYLES[lead.medio] || 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {lead.medio || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-[160px] truncate">{lead.programa_interes || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[lead.resultado_gestion] || 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {lead.resultado_gestion || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-semibold">{lead.toques || 0}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {lead.fecha_lead ? new Date(lead.fecha_lead).toLocaleDateString('es-AR') : '—'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-xs text-slate-400">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

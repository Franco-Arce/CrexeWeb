import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Target, TrendingUp, Medal, ArrowUpRight } from 'lucide-react';
import api from '../api';

const MEDAL = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const MEDAL_BG = [
    'bg-amber-50 border-amber-200',
    'bg-slate-50 border-slate-200',
    'bg-orange-50 border-orange-200',
    'bg-blue-50 border-blue-200',
    'bg-indigo-50 border-indigo-200',
    'bg-purple-50 border-purple-200',
    'bg-pink-50 border-pink-200',
    'bg-rose-50 border-rose-200',
    'bg-red-50 border-red-200',
    'bg-teal-50 border-teal-200'
];

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.agents().then(setAgents).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy size={20} className="text-amber-500" /> Ranking de Asesores
                    </h2>
                    <p className="text-sm text-nods-text-muted mt-0.5">{agents.length} asesores activos</p>
                </div>
            </div>

            {/* Top 10 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {agents.slice(0, 10).map((agent, i) => (
                    <motion.div
                        key={agent.usuario}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        className={`p-6 rounded-2xl border-2 ${MEDAL_BG[i] || 'bg-nods-card border-nods-border'} relative overflow-hidden`}
                    >
                        <div className="text-3xl mb-3">{MEDAL[i]}</div>
                        <h3 className="text-lg font-extrabold text-slate-900">{agent.usuario}</h3>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Leads</p>
                                <p className="text-lg font-bold text-slate-800">{agent.total_leads}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Efectivos</p>
                                <p className="text-lg font-bold text-emerald-600">{agent.contacto_efectivo}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Conv.</p>
                                <p className="text-lg font-bold text-blue-600">
                                    {agent.total_leads ? ((agent.contacto_efectivo / agent.total_leads) * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Full Table */}
            <div className="bg-nods-card rounded-2xl border border-nods-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-nods-bg text-nods-text-muted text-[10px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">#</th>
                                <th className="px-6 py-4">Asesor</th>
                                <th className="px-6 py-4">Total Leads</th>
                                <th className="px-6 py-4">Contactados</th>
                                <th className="px-6 py-4">Contacto Efec.</th>
                                <th className="px-6 py-4">No Contactados</th>
                                <th className="px-6 py-4">Conv. %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {agents.map((a, i) => {
                                const conv = a.total_leads ? ((a.contacto_efectivo / a.total_leads) * 100).toFixed(1) : '0.0';
                                return (
                                    <motion.tr
                                        key={a.usuario}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            {i < 10 ? (
                                                <span className="text-lg">{MEDAL[i]}</span>
                                            ) : (
                                                <span className="text-sm text-slate-400 font-bold">{i + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-white">{a.usuario}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-nods-text-silver">{a.total_leads}</td>
                                        <td className="px-6 py-4 text-sm text-blue-600 font-semibold">{a.contactados}</td>
                                        <td className="px-6 py-4 text-sm text-emerald-600 font-semibold">{a.contacto_efectivo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{a.no_contactados}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${parseFloat(conv) > 30 ? 'bg-emerald-50 text-emerald-600' :
                                                parseFloat(conv) > 15 ? 'bg-blue-50 text-blue-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                {conv}%
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

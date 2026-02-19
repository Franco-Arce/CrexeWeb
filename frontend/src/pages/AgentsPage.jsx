import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Phone, ShoppingCart } from 'lucide-react';
import api from '../api';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: 8,
            padding: '10px 14px', fontSize: 12, color: '#f1f5f9',
        }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>
            ))}
        </div>
    );
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.agents().then((d) => { setAgents(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="animate-fade-in">
            {/* Top 3 Cards */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
                {agents.slice(0, 3).map((a, i) => (
                    <motion.div
                        key={a.usuario}
                        className="kpi-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ textAlign: 'center', padding: 28 }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{MEDAL[i]}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{a.usuario}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                            {a.total_gestiones?.toLocaleString()} gestiones
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748b' }}><Phone size={12} /> Leads</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>{a.leads_gestionados?.toLocaleString()}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#64748b' }}><ShoppingCart size={12} /> Ventas</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{a.ventas?.toLocaleString()}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chart */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: 24 }}
            >
                <div className="card-header">
                    <span className="card-title">Gestiones por Agente</span>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agents.slice(0, 15)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                        <XAxis dataKey="usuario" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="total_gestiones" name="Gestiones" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={22} />
                        <Bar dataKey="ventas" name="Ventas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={22} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Full Table */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <div className="card-header">
                    <span className="card-title"><Trophy size={16} style={{ marginRight: 6 }} /> Ranking Completo</span>
                </div>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Agente</th>
                                <th>Gestiones</th>
                                <th>Leads</th>
                                <th>Ventas</th>
                                <th>Conversión</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.map((a, i) => (
                                <tr key={a.usuario}>
                                    <td style={{ fontWeight: 600, color: i < 3 ? '#f59e0b' : '#475569' }}>{i + 1}</td>
                                    <td style={{ fontWeight: 500, color: '#f1f5f9' }}>{a.usuario}</td>
                                    <td>{a.total_gestiones?.toLocaleString()}</td>
                                    <td>{a.leads_gestionados?.toLocaleString()}</td>
                                    <td style={{ color: '#22c55e', fontWeight: 600 }}>{a.ventas?.toLocaleString()}</td>
                                    <td>
                                        <span className={`badge ${a.leads_gestionados > 0 ? 'green' : 'yellow'}`}>
                                            {a.leads_gestionados > 0 ? ((a.ventas / a.leads_gestionados) * 100).toFixed(1) : 0}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

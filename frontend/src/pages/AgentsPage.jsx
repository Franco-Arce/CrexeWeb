import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Trophy, Phone, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import api from '../api';

/* ── Premium Tooltip ── */
const AgentTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    const conversion = data?.leads_gestionados > 0
        ? ((data.ventas / data.leads_gestionados) * 100).toFixed(1)
        : '0';

    return (
        <div style={{
            background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14,
            padding: '18px 22px', fontSize: 12, minWidth: 200,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(59,130,246,0.1)',
        }}>
            <div style={{
                fontWeight: 800, fontSize: 15, color: '#f1f5f9', marginBottom: 12,
                paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                        Gestiones
                    </span>
                    <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 14 }}>
                        {data?.total_gestiones?.toLocaleString()}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
                        Leads
                    </span>
                    <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: 14 }}>
                        {data?.leads_gestionados?.toLocaleString()}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                        Ventas
                    </span>
                    <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 14 }}>
                        {data?.ventas?.toLocaleString()}
                    </span>
                </div>
                <div style={{
                    marginTop: 6, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ color: '#94a3b8' }}>Conversión</span>
                    <span style={{
                        background: parseFloat(conversion) > 2
                            ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: parseFloat(conversion) > 2 ? '#22c55e' : '#f59e0b',
                        padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 12,
                    }}>
                        {conversion}%
                    </span>
                </div>
            </div>
        </div>
    );
};

const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_BG = [
    'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
    'linear-gradient(135deg, rgba(148,163,184,0.12), rgba(148,163,184,0.04))',
    'linear-gradient(135deg, rgba(180,83,9,0.12), rgba(180,83,9,0.04))',
];
const MEDAL_BORDER = [
    'rgba(245,158,11,0.2)', 'rgba(148,163,184,0.2)', 'rgba(180,83,9,0.2)',
];

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.agents().then((d) => { setAgents(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner" />;

    return (
        <motion.div initial="initial" animate="animate" variants={stagger}>
            {/* Top 3 Cards */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
                {agents.slice(0, 3).map((a, i) => {
                    const conv = a.leads_gestionados > 0 ? ((a.ventas / a.leads_gestionados) * 100).toFixed(1) : '0';
                    return (
                        <motion.div
                            key={a.usuario}
                            className="kpi-card"
                            variants={fadeUp}
                            whileHover={{ y: -6, scale: 1.02 }}
                            style={{
                                textAlign: 'center', padding: '32px 24px',
                                background: MEDAL_BG[i], borderColor: MEDAL_BORDER[i],
                            }}
                        >
                            <div style={{ fontSize: 42, marginBottom: 10, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                                {MEDAL[i]}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
                                {a.usuario}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                                {a.total_gestiones?.toLocaleString()} gestiones
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
                                        <Phone size={11} /> Leads
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>
                                        {a.leads_gestionados?.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
                                        <ShoppingCart size={11} /> Ventas
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>
                                        {a.ventas?.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
                                <div>
                                    <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
                                        <TrendingUp size={11} /> Conv.
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>
                                        {conv}%
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Chart */}
            <motion.div className="card" variants={fadeUp} style={{ marginBottom: 28 }}>
                <div className="card-header">
                    <span className="card-title"><Users size={16} /> Gestiones por Agente</span>
                </div>
                <div className="card-body">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={agents.slice(0, 15)} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis
                                dataKey="usuario" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                                axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={70}
                            />
                            <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<AgentTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 6 }} />
                            <Legend
                                verticalAlign="top" align="right" iconType="circle" iconSize={8}
                                wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingBottom: 12 }}
                            />
                            <Bar dataKey="total_gestiones" name="Gestiones" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={18} animationDuration={1200} />
                            <Bar dataKey="ventas" name="Ventas" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={18} animationDuration={1500} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Full Ranking Table */}
            <motion.div className="card" variants={fadeUp}>
                <div className="card-header">
                    <span className="card-title"><Trophy size={16} /> Ranking Completo</span>
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
                            {agents.map((a, i) => {
                                const conv = a.leads_gestionados > 0
                                    ? ((a.ventas / a.leads_gestionados) * 100).toFixed(1) : '0';
                                return (
                                    <motion.tr
                                        key={a.usuario}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + i * 0.03 }}
                                    >
                                        <td style={{ fontWeight: 700, color: i < 3 ? '#f59e0b' : '#475569', fontSize: 14 }}>
                                            {i < 3 ? MEDAL[i] : i + 1}
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{a.usuario}</td>
                                        <td style={{ fontWeight: 500 }}>{a.total_gestiones?.toLocaleString()}</td>
                                        <td>{a.leads_gestionados?.toLocaleString()}</td>
                                        <td style={{ color: '#22c55e', fontWeight: 700 }}>{a.ventas?.toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${parseFloat(conv) > 2 ? 'green' : 'yellow'}`}>
                                                {conv}%
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}

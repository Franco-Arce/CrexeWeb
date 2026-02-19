import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, CheckCircle, GraduationCap, Zap, TrendingUp } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import api from '../api';

const KPI_CONFIG = [
    { key: 'total_leads', label: 'Total Leads', icon: Users, color: 'blue' },
    { key: 'contactados', label: 'Contactados', icon: Phone, color: 'yellow' },
    { key: 'contacto_efectivo', label: 'Contacto Efectivo', icon: CheckCircle, color: 'green' },
    { key: 'matriculados', label: 'Matriculados', icon: GraduationCap, color: 'purple' },
    { key: 'no_contactados', label: 'No Contactados', icon: Zap, color: 'red' },
    { key: 'avg_toques', label: 'Promedio Toques', icon: TrendingUp, color: 'blue' },
];

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

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

export default function OverviewPage() {
    const [kpis, setKpis] = useState(null);
    const [funnel, setFunnel] = useState([]);
    const [trends, setTrends] = useState([]);
    const [byMedio, setByMedio] = useState([]);
    const [byPrograma, setByPrograma] = useState([]);
    const [period, setPeriod] = useState('week');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        api.trends(period).then(setTrends).catch(() => { });
    }, [period]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [k, f, t, m, p] = await Promise.all([
                api.kpis(), api.funnel(), api.trends(period), api.byMedio(), api.byPrograma(null, 10),
            ]);
            setKpis(k); setFunnel(f); setTrends(t); setByMedio(m); setByPrograma(p);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const formatTrend = (data) =>
        data.map((d) => ({
            ...d,
            period: d.period ? new Date(d.period).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '',
        }));

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="animate-fade-in">
            {/* KPIs */}
            <div className="kpi-grid">
                {KPI_CONFIG.map(({ key, label, icon: Icon, color }, i) => (
                    <motion.div
                        key={key}
                        className="kpi-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
                    >
                        <div className={`kpi-icon ${color}`}><Icon size={18} /></div>
                        <div className="kpi-label">{label}</div>
                        <div className="kpi-value">
                            {kpis?.[key] != null ? Number(kpis[key]).toLocaleString() : '—'}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="charts-grid">
                {/* Funnel */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="card-header">
                        <span className="card-title">Funnel de Gestión</span>
                    </div>
                    <div className="funnel-container">
                        {funnel.map((stage, i) => {
                            const maxVal = funnel[0]?.value || 1;
                            const pct = ((stage.value / maxVal) * 100).toFixed(1);
                            const convRate = i > 0 ? ((stage.value / funnel[i - 1].value) * 100).toFixed(1) : '100';
                            return (
                                <motion.div
                                    key={stage.stage}
                                    className="funnel-stage"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.12 }}
                                >
                                    <span className="funnel-label">{stage.stage}</span>
                                    <div className="funnel-bar-wrapper">
                                        <motion.div
                                            className="funnel-bar"
                                            style={{ background: stage.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(pct, 8)}%` }}
                                            transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        >
                                            {stage.value?.toLocaleString()}
                                        </motion.div>
                                    </div>
                                    <span className="funnel-rate">{convRate}%</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* By Medio — Pie */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="card-header">
                        <span className="card-title">Leads por Medio</span>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={byMedio}
                                dataKey="total"
                                nameKey="medio"
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={95}
                                paddingAngle={3}
                                stroke="none"
                            >
                                {byMedio.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                        {byMedio.map((m, i) => (
                            <span key={m.medio} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                                {m.medio} ({m.total?.toLocaleString()})
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Trends — Area Chart */}
                <motion.div
                    className="card full-width"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="card-header">
                        <span className="card-title">Tendencia de Leads</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {['day', 'week', 'month'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        padding: '5px 12px', fontSize: 12, borderRadius: 6, border: '1px solid',
                                        borderColor: period === p ? 'var(--accent)' : 'var(--border)',
                                        background: period === p ? 'var(--accent-glow)' : 'transparent',
                                        color: period === p ? 'var(--accent)' : 'var(--text-muted)',
                                        cursor: 'pointer', fontWeight: 500,
                                    }}
                                >
                                    {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={formatTrend(trends)}>
                            <defs>
                                <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradEfectivos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                            <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#gradLeads)" strokeWidth={2} />
                            <Area type="monotone" dataKey="efectivos" name="Efectivos" stroke="#22c55e" fill="url(#gradEfectivos)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* By Programa — Bar Chart */}
                <motion.div
                    className="card full-width"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="card-header">
                        <span className="card-title">Top Programas de Interés</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={byPrograma} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis
                                type="category"
                                dataKey="programa"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                width={180}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                            <Bar dataKey="efectivos" name="Efectivos" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>
        </div>
    );
}

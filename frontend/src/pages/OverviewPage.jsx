import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    Users, UserCheck, UserX, GraduationCap, Phone, TrendingUp,
    BarChart3, PieChart as PieIcon, Activity,
} from 'lucide-react';
import api from '../api';

const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#06b6d4', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#0f1029', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '12px 16px', fontSize: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
            <p style={{ fontWeight: 700, marginBottom: 6, color: '#f1f5f9' }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color, marginBottom: 2 }}>
                    {p.name}: <b>{p.value?.toLocaleString()}</b>
                </p>
            ))}
        </div>
    );
};

const card = (i) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
});

export default function OverviewPage() {
    const [kpis, setKpis] = useState(null);
    const [funnel, setFunnel] = useState([]);
    const [trends, setTrends] = useState([]);
    const [medios, setMedios] = useState([]);
    const [programas, setProgramas] = useState([]);
    const [period, setPeriod] = useState('week');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.kpis(), api.funnel(), api.trends(period), api.byMedio(), api.byPrograma(),
        ]).then(([k, f, t, m, p]) => {
            setKpis(k); setFunnel(f);
            setTrends(t.map(d => ({ ...d, period: d.period?.slice(5) })));
            setMedios(m); setProgramas(p);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        api.trends(period).then(t =>
            setTrends(t.map(d => ({ ...d, period: d.period?.slice(5) })))
        ).catch(() => { });
    }, [period]);

    if (loading) return <div className="loading-spinner" />;

    const kpiCards = [
        { label: 'Total Leads', value: kpis?.total_leads, icon: <Users size={18} />, color: 'accent' },
        { label: 'Contactados', value: kpis?.contactados, icon: <UserCheck size={18} />, color: 'cyan' },
        { label: 'No Contactados', value: kpis?.no_contactados, icon: <UserX size={18} />, color: 'red' },
        { label: 'Contacto Efectivo', value: kpis?.contacto_efectivo, icon: <Phone size={18} />, color: 'green' },
        { label: 'Matriculados', value: kpis?.matriculados, icon: <GraduationCap size={18} />, color: 'purple' },
        { label: 'Conversión', value: kpis?.total_leads ? ((kpis.matriculados / kpis.total_leads) * 100).toFixed(1) + '%' : '0%', icon: <TrendingUp size={18} />, color: 'yellow', isPercentage: true },
    ];

    const maxFunnel = funnel[0]?.value || 1;

    return (
        <div className="animate-fade-in">
            {/* ── KPI Cards ── */}
            <div className="kpi-grid">
                {kpiCards.map((k, i) => (
                    <motion.div key={k.label} className={`kpi-card ${k.color}`} {...card(i)}>
                        <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-value">
                            {k.isPercentage ? k.value : k.value?.toLocaleString()}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Funnel ── */}
            <motion.div className="card" {...card(6)} style={{ marginBottom: 28 }}>
                <div className="card-header">
                    <span className="card-title"><Activity size={16} /> Embudo de Conversión</span>
                </div>
                <div className="funnel-container">
                    {funnel.map((stage, i) => (
                        <div key={stage.stage}>
                            <div className="funnel-stage">
                                <div className="funnel-label">{stage.stage}</div>
                                <div className="funnel-bar-bg">
                                    <motion.div
                                        className="funnel-bar-fill"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max((stage.value / maxFunnel) * 100, 8)}%` }}
                                        transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
                                        style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }}
                                    >
                                        {stage.value?.toLocaleString()}
                                    </motion.div>
                                </div>
                                <div className="funnel-pct" style={{ color: stage.color }}>
                                    {((stage.value / maxFunnel) * 100).toFixed(1)}%
                                </div>
                            </div>
                            {i < funnel.length - 1 && (
                                <div className="funnel-arrow">
                                    <span style={{ fontSize: 10, color: '#475569' }}>
                                        ↓ {((funnel[i + 1].value / stage.value) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── Charts Row ── */}
            <div className="grid-2">
                {/* Trends */}
                <motion.div className="card" {...card(7)}>
                    <div className="card-header">
                        <span className="card-title"><BarChart3 size={16} /> Tendencia en el Tiempo</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {['day', 'week', 'month'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        padding: '4px 12px', borderRadius: 8, border: '1px solid',
                                        borderColor: period === p ? 'var(--accent)' : 'var(--border)',
                                        background: period === p ? 'var(--accent-glow)' : 'transparent',
                                        color: period === p ? 'var(--accent-light)' : 'var(--text-muted)',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    {p === 'day' ? 'Día' : p === 'week' ? 'Sem' : 'Mes'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradEfec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#gradLeads)" strokeWidth={2} />
                                <Area type="monotone" dataKey="efectivos" name="Efectivos" stroke="#22c55e" fill="url(#gradEfec)" strokeWidth={2} />
                                <Area type="monotone" dataKey="matriculados" name="Matriculados" stroke="#a855f7" fill="none" strokeWidth={2} strokeDasharray="6 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* By Medio - Donut */}
                <motion.div className="card" {...card(8)}>
                    <div className="card-header">
                        <span className="card-title"><PieIcon size={16} /> Distribución por Medio</span>
                    </div>
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={medios.slice(0, 6)}
                                    dataKey="total"
                                    nameKey="medio"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    stroke="none"
                                >
                                    {medios.slice(0, 6).map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* ── Programs Chart ── */}
            <motion.div className="card" {...card(9)}>
                <div className="card-header">
                    <span className="card-title"><GraduationCap size={16} /> Top Programas de Interés</span>
                </div>
                <div className="card-body">
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={programas} layout="vertical" margin={{ left: 120 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis
                                dataKey="programa" type="category"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={false} tickLine={false} width={120}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total" name="Leads" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={18} />
                            <Bar dataKey="efectivos" name="Efectivos" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}

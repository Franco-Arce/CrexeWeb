import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
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
const FUNNEL_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

/* ── Animated Counter ── */
function AnimatedNumber({ value, suffix = '', duration = 1.2 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView || !value) return;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) { setCount(value); return; }
        let start = 0;
        const step = num / (duration * 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= num) { setCount(num); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [inView, value, duration]);

    return (
        <span ref={ref}>
            {typeof count === 'number' ? count.toLocaleString() : count}{suffix}
        </span>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(15,16,41,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '14px 18px', fontSize: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
        }}>
            <p style={{ fontWeight: 700, marginBottom: 8, color: '#f1f5f9', fontSize: 13 }}>{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color, marginBottom: 3, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span>{p.name}</span> <b>{p.value?.toLocaleString()}</b>
                </p>
            ))}
        </div>
    );
};

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

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
            setMedios(m); setProgramas(p.slice(0, 10));
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
        { label: 'Conversión', value: kpis?.total_leads ? ((kpis.matriculados / kpis.total_leads) * 100).toFixed(1) : '0', icon: <TrendingUp size={18} />, color: 'yellow', suffix: '%' },
    ];

    const maxFunnel = funnel[0]?.value || 1;

    return (
        <motion.div initial="initial" animate="animate" variants={stagger}>
            {/* ── KPI Cards ── */}
            <motion.div className="kpi-grid" variants={stagger}>
                {kpiCards.map((k) => (
                    <motion.div key={k.label} className={`kpi-card ${k.color}`} variants={fadeUp} whileHover={{ y: -6, scale: 1.02 }}>
                        <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-value">
                            <AnimatedNumber value={k.value} suffix={k.suffix || ''} />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Funnel ── */}
            <motion.div className="card" variants={fadeUp} style={{ marginBottom: 28 }}>
                <div className="card-header">
                    <span className="card-title"><Activity size={16} /> Embudo de Conversión</span>
                </div>
                <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {funnel.map((stage, i) => {
                        const pct = ((stage.value / maxFunnel) * 100);
                        const conversionFromPrev = i > 0 ? ((stage.value / funnel[i - 1].value) * 100).toFixed(1) : null;
                        return (
                            <div key={stage.stage}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
                                    <div style={{
                                        width: 180, textAlign: 'right', fontSize: 13, fontWeight: 600,
                                        color: FUNNEL_COLORS[i] || '#94a3b8', flexShrink: 0,
                                    }}>
                                        {stage.stage}
                                    </div>
                                    <div style={{
                                        flex: 1, height: 52, background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 10, overflow: 'hidden', position: 'relative',
                                    }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(pct, 6)}%` }}
                                            transition={{ duration: 1.2, delay: 0.4 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                                            style={{
                                                height: '100%', borderRadius: 10,
                                                background: `linear-gradient(90deg, ${FUNNEL_COLORS[i]}cc, ${FUNNEL_COLORS[i]}55)`,
                                                display: 'flex', alignItems: 'center', paddingLeft: 16,
                                                fontSize: 16, fontWeight: 800, color: '#fff', minWidth: 80,
                                                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                                            }}
                                        >
                                            {stage.value?.toLocaleString()}
                                        </motion.div>
                                    </div>
                                    <div style={{
                                        width: 80, fontSize: 15, fontWeight: 800, flexShrink: 0,
                                        color: FUNNEL_COLORS[i], textAlign: 'right',
                                    }}>
                                        {pct.toFixed(1)}%
                                    </div>
                                </div>
                                {i < funnel.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.2 }}
                                        style={{
                                            marginLeft: 196, fontSize: 11, color: '#475569',
                                            paddingLeft: 8, borderLeft: '2px solid rgba(255,255,255,0.06)',
                                            marginBottom: 6, paddingTop: 2, paddingBottom: 2,
                                        }}
                                    >
                                        ↓ conversión {conversionFromPrev}%
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── Charts Row ── */}
            <div className="grid-2">
                {/* Trends */}
                <motion.div className="card" variants={fadeUp}>
                    <div className="card-header">
                        <span className="card-title"><BarChart3 size={16} /> Tendencia en el Tiempo</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[
                                { key: 'day', label: 'Día' },
                                { key: 'week', label: 'Sem' },
                                { key: 'month', label: 'Mes' },
                            ].map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => setPeriod(p.key)}
                                    style={{
                                        padding: '5px 14px', borderRadius: 8, border: '1px solid',
                                        borderColor: period === p.key ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                                        background: period === p.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                                        color: period === p.key ? '#60a5fa' : '#475569',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
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
                                <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#gradLeads)" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} animationDuration={1500} />
                                <Area type="monotone" dataKey="efectivos" name="Efectivos" stroke="#22c55e" fill="url(#gradEfec)" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e' }} animationDuration={1800} />
                                <Area type="monotone" dataKey="matriculados" name="Matriculados" stroke="#a855f7" fill="none" strokeWidth={2} strokeDasharray="6 3" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* By Medio - Donut */}
                <motion.div className="card" variants={fadeUp}>
                    <div className="card-header">
                        <span className="card-title"><PieIcon size={16} /> Distribución por Medio</span>
                    </div>
                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={medios.slice(0, 6)}
                                    dataKey="total"
                                    nameKey="medio"
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={105}
                                    paddingAngle={4}
                                    stroke="none"
                                    animationBegin={400}
                                    animationDuration={1200}
                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
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
                                    wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* ── Programs Chart — truncated names, more space ── */}
            <motion.div className="card" variants={fadeUp}>
                <div className="card-header">
                    <span className="card-title"><GraduationCap size={16} /> Top Programas de Interés</span>
                </div>
                <div className="card-body">
                    <ResponsiveContainer width="100%" height={Math.max(programas.length * 50, 300)}>
                        <BarChart
                            data={programas.map(p => ({
                                ...p,
                                nombre: p.programa?.length > 25 ? p.programa.slice(0, 25) + '…' : p.programa,
                            }))}
                            layout="vertical"
                            margin={{ left: 12, right: 24, top: 8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis
                                dataKey="nombre" type="category"
                                tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
                                axisLine={false} tickLine={false}
                                width={200}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total" name="Leads" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} animationDuration={1200} />
                            <Bar dataKey="efectivos" name="Efectivos" fill="#22c55e" radius={[0, 8, 8, 0]} barSize={20} animationDuration={1500} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
}

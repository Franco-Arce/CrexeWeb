import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    Users, UserCheck, UserX, GraduationCap, Phone, TrendingUp,
    BarChart3, PieChart as PieIcon, Activity, ArrowDown, Zap,
} from 'lucide-react';
import api from '../api';

const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#06b6d4', '#ef4444'];
const FUNNEL_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

/* ── Animated Counter ── */
function AnimatedNumber({ value, suffix = '', duration = 1.5 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView || value == null) return;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) { setCount(value); return; }
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = (now - startTime) / (duration * 1000);
            if (elapsed >= 1) { setCount(num); return; }
            const eased = 1 - Math.pow(1 - elapsed, 3);
            setCount(Math.floor(eased * num));
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [inView, value, duration]);

    return <span ref={ref}>{typeof count === 'number' ? count.toLocaleString() : count}{suffix}</span>;
}

/* ── Premium Tooltip ── */
const PremiumTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(8,8,24,0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14,
            padding: '16px 20px', fontSize: 12, minWidth: 180,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(59,130,246,0.08)',
        }}>
            <div style={{
                fontWeight: 800, fontSize: 14, color: '#f1f5f9', marginBottom: 10,
                paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                {label}
            </div>
            {payload.map((p, i) => (
                <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 20, marginBottom: 4, padding: '3px 0',
                }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                        {p.name}
                    </span>
                    <span style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>
                        {p.value?.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
};

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};
const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
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

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <div className="loading-spinner" />
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: '#475569', fontSize: 13 }}
            >
                Cargando dashboard...
            </motion.p>
        </div>
    );

    const kpiCards = [
        { label: 'Total Leads', value: kpis?.total_leads, icon: <Users size={18} />, color: 'accent', glow: '#3b82f6' },
        { label: 'Contactados', value: kpis?.contactados, icon: <UserCheck size={18} />, color: 'cyan', glow: '#06b6d4' },
        { label: 'No Contactados', value: kpis?.no_contactados, icon: <UserX size={18} />, color: 'red', glow: '#ef4444' },
        { label: 'Contacto Efectivo', value: kpis?.contacto_efectivo, icon: <Phone size={18} />, color: 'green', glow: '#22c55e' },
        { label: 'Matriculados', value: kpis?.matriculados, icon: <GraduationCap size={18} />, color: 'purple', glow: '#a855f7' },
        { label: 'Conversión', value: kpis?.total_leads ? ((kpis.matriculados / kpis.total_leads) * 100).toFixed(1) : '0', icon: <TrendingUp size={18} />, color: 'yellow', suffix: '%', glow: '#f59e0b' },
    ];

    const maxFunnel = funnel[0]?.value || 1;

    return (
        <motion.div initial="initial" animate="animate" variants={stagger}>
            {/* ── KPI Cards ── */}
            <motion.div className="kpi-grid" variants={stagger}>
                {kpiCards.map((k) => (
                    <motion.div
                        key={k.label}
                        className={`kpi-card ${k.color}`}
                        variants={fadeUp}
                        whileHover={{
                            y: -8, scale: 1.03,
                            boxShadow: `0 12px 40px ${k.glow}22, 0 0 20px ${k.glow}11`,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-value">
                            <AnimatedNumber value={k.value} suffix={k.suffix || ''} />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Funnel — Premium ── */}
            <motion.div className="card" variants={fadeUp} style={{ marginBottom: 28 }}>
                <div className="card-header">
                    <span className="card-title"><Activity size={16} /> Embudo de Conversión</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>
                        Tasa global: {((funnel[funnel.length - 1]?.value / maxFunnel) * 100).toFixed(1)}%
                    </span>
                </div>
                <div style={{ padding: '32px 36px' }}>
                    {funnel.map((stage, i) => {
                        const pct = ((stage.value / maxFunnel) * 100);
                        const convFromPrev = i > 0 ? ((stage.value / funnel[i - 1].value) * 100).toFixed(1) : null;
                        const color = FUNNEL_COLORS[i] || '#3b82f6';
                        return (
                            <div key={stage.stage}>
                                <motion.div
                                    style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 6 }}
                                    initial={{ opacity: 0, x: -40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {/* Stage Label */}
                                    <div style={{
                                        width: 170, textAlign: 'right', fontSize: 14, fontWeight: 700,
                                        color: color, flexShrink: 0,
                                    }}>
                                        {stage.stage}
                                    </div>

                                    {/* Bar */}
                                    <div style={{
                                        flex: 1, height: 56, background: 'rgba(255,255,255,0.025)',
                                        borderRadius: 12, overflow: 'hidden', position: 'relative',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                    }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(pct, 8)}%` }}
                                            transition={{ duration: 1.4, delay: 0.5 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            style={{
                                                height: '100%', borderRadius: 12,
                                                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                                                boxShadow: `0 0 24px ${color}33`,
                                                display: 'flex', alignItems: 'center', paddingLeft: 20,
                                                fontSize: 18, fontWeight: 900, color: '#fff', minWidth: 80,
                                                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                                position: 'relative',
                                            }}
                                        >
                                            {stage.value?.toLocaleString()}
                                            {/* Shine effect */}
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                                                background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
                                                borderRadius: '12px 12px 0 0',
                                            }} />
                                        </motion.div>
                                    </div>

                                    {/* Percentage */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1.2 + i * 0.2, duration: 0.4 }}
                                        style={{
                                            width: 72, height: 40, borderRadius: 10,
                                            background: `${color}18`, border: `1px solid ${color}33`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 15, fontWeight: 800, color: color, flexShrink: 0,
                                        }}
                                    >
                                        {pct.toFixed(1)}%
                                    </motion.div>
                                </motion.div>

                                {/* Conversion Arrow */}
                                {i < funnel.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.5 + i * 0.2, duration: 0.4 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            marginLeft: 190, padding: '6px 0', marginBottom: 6,
                                        }}
                                    >
                                        <ArrowDown size={14} style={{ color: '#475569' }} />
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: 6, padding: '3px 10px',
                                            color: parseFloat(convFromPrev) > 50 ? '#22c55e' : parseFloat(convFromPrev) > 25 ? '#f59e0b' : '#ef4444',
                                        }}>
                                            {convFromPrev}% pasan a la siguiente etapa
                                        </span>
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
                <motion.div className="card" variants={scaleIn}>
                    <div className="card-header">
                        <span className="card-title"><BarChart3 size={16} /> Tendencia en el Tiempo</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[
                                { key: 'day', label: 'Día' },
                                { key: 'week', label: 'Semana' },
                                { key: 'month', label: 'Mes' },
                            ].map(p => (
                                <motion.button
                                    key={p.key}
                                    onClick={() => setPeriod(p.key)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: '6px 16px', borderRadius: 8, border: '1px solid',
                                        borderColor: period === p.key ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                                        background: period === p.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                                        color: period === p.key ? '#60a5fa' : '#475569',
                                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                        transition: 'background 0.2s, color 0.2s',
                                    }}
                                >
                                    {p.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="gradL" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<PremiumTooltip />} />
                                <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#gradL)" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                <Area type="monotone" dataKey="efectivos" name="Efectivos" stroke="#22c55e" fill="url(#gradE)" strokeWidth={2.5} dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} animationDuration={1800} />
                                <Area type="monotone" dataKey="matriculados" name="Matriculados" stroke="#a855f7" fill="none" strokeWidth={2} strokeDasharray="6 3" activeDot={{ r: 5, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }} animationDuration={2200} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Donut */}
                <motion.div className="card" variants={scaleIn}>
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
                                    cx="50%" cy="45%"
                                    innerRadius={55} outerRadius={105}
                                    paddingAngle={4} stroke="none"
                                    animationBegin={600} animationDuration={1400}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
                                        const y = cy + r * Math.sin(-midAngle * Math.PI / 180);
                                        return percent > 0.06 ? (
                                            <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
                                                style={{ fontSize: 12, fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                                                {(percent * 100).toFixed(0)}%
                                            </text>
                                        ) : null;
                                    }}
                                    labelLine={false}
                                >
                                    {medios.slice(0, 6).map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PremiumTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle" iconSize={8}
                                    wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* ── Programs Chart ── */}
            <motion.div className="card" variants={fadeUp}>
                <div className="card-header">
                    <span className="card-title"><GraduationCap size={16} /> Top Programas de Interés</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>{programas.length} programas</span>
                </div>
                <div className="card-body">
                    <ResponsiveContainer width="100%" height={Math.max(programas.length * 55, 300)}>
                        <BarChart
                            data={programas.map(p => ({
                                ...p,
                                nombre: p.programa?.length > 28 ? p.programa.slice(0, 28) + '…' : p.programa,
                            }))}
                            layout="vertical"
                            margin={{ left: 16, right: 32, top: 8, bottom: 8 }}
                            barGap={4}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis
                                dataKey="nombre" type="category"
                                tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
                                axisLine={false} tickLine={false}
                                width={210}
                            />
                            <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 6 }} />
                            <Legend
                                verticalAlign="top" align="right" iconType="circle" iconSize={8}
                                wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingBottom: 12 }}
                            />
                            <Bar dataKey="total" name="Leads" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={18} animationDuration={1200} />
                            <Bar dataKey="efectivos" name="Efectivos" fill="#22c55e" radius={[0, 8, 8, 0]} barSize={18} animationDuration={1600} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
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
const FUNNEL_COLORS = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#a855f7'];

/* ── Animated Counter — eased counting ── */
function AnimatedNumber({ value, suffix = '', duration = 1.8 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });

    useEffect(() => {
        if (!inView || value == null) return;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) { setCount(value); return; }
        const startTime = performance.now();
        const animate = (now) => {
            const t = Math.min((now - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - t, 4); // quartic ease-out
            if (t >= 1) { setCount(num); return; }
            setCount(Math.floor(eased * num));
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [inView, value, duration]);

    return <span ref={ref}>{typeof count === 'number' ? count.toLocaleString() : count}{suffix}</span>;
}

/* ── Section wrapper with scroll-reveal ── */
function ScrollReveal({ children, delay = 0, direction = 'up', className = '', style = {} }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    const dirMap = {
        up: { y: 60 },
        down: { y: -60 },
        left: { x: 80 },
        right: { x: -80 },
        scale: { scale: 0.85 },
    };

    return (
        <motion.div
            ref={ref}
            className={className}
            style={style}
            initial={{ opacity: 0, ...dirMap[direction] }}
            animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
            transition={{
                duration: 0.8, delay,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            {children}
        </motion.div>
    );
}

/* ── Premium Tooltip ── */
const PremiumTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    const programa = data?.programa || data?.nombre;
    const hasConversion = data?.total && data?.efectivos;
    const conv = hasConversion ? ((data.efectivos / data.total) * 100).toFixed(1) : null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
                background: 'rgba(6,6,20,0.96)', backdropFilter: 'blur(24px)',
                border: '1px solid rgba(59,130,246,0.25)', borderRadius: 16,
                padding: '18px 22px', fontSize: 12, minWidth: 220,
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.1)',
            }}
        >
            {/* Header */}
            <div style={{
                fontWeight: 800, fontSize: 14, color: '#f1f5f9', marginBottom: 12,
                paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <Zap size={14} style={{ color: '#3b82f6' }} />
                {programa || label}
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {payload.map((p, i) => (
                    <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '4px 0',
                    }}>
                        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                                width: 10, height: 10, borderRadius: '50%', background: p.color,
                                display: 'inline-block', boxShadow: `0 0 8px ${p.color}55`,
                            }} />
                            {p.name}
                        </span>
                        <span style={{ color: p.color, fontWeight: 800, fontSize: 15 }}>
                            {p.value?.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>

            {/* Conversion rate */}
            {conv && (
                <div style={{
                    marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ color: '#64748b', fontSize: 11 }}>Tasa de conversión</span>
                    <span style={{
                        background: parseFloat(conv) > 25 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: parseFloat(conv) > 25 ? '#22c55e' : '#f59e0b',
                        padding: '3px 12px', borderRadius: 20, fontWeight: 800, fontSize: 12,
                        border: `1px solid ${parseFloat(conv) > 25 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                        {conv}%
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default function OverviewPage() {
    const [kpis, setKpis] = useState(null);
    const [funnel, setFunnel] = useState([]);
    const [trends, setTrends] = useState([]);
    const [medios, setMedios] = useState([]);
    const [programas, setProgramas] = useState([]);
    const [period, setPeriod] = useState('week');
    const [loading, setLoading] = useState(true);

    // Scroll-based parallax for the page
    const containerRef = useRef(null);
    const { scrollY } = useScroll();
    const headerY = useTransform(scrollY, [0, 300], [0, -30]);
    const headerOpacity = useTransform(scrollY, [0, 200], [1, 0.7]);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 20 }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '3px solid rgba(59,130,246,0.1)',
                    borderTopColor: '#3b82f6',
                }}
            />
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}
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
        <div ref={containerRef}>
            {/* ── KPI Cards with staggered scroll-reveal ── */}
            <div className="kpi-grid">
                {kpiCards.map((k, i) => (
                    <ScrollReveal key={k.label} delay={i * 0.08} direction={i % 2 === 0 ? 'up' : 'scale'}>
                        <motion.div
                            className={`kpi-card ${k.color}`}
                            whileHover={{
                                y: -10, scale: 1.04,
                                boxShadow: `0 16px 48px ${k.glow}25, 0 0 24px ${k.glow}15`,
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <motion.div
                                className={`kpi-icon ${k.color}`}
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 6, delay: i * 0.5 }}
                            >
                                {k.icon}
                            </motion.div>
                            <div className="kpi-label">{k.label}</div>
                            <div className="kpi-value">
                                <AnimatedNumber value={k.value} suffix={k.suffix || ''} />
                            </div>
                        </motion.div>
                    </ScrollReveal>
                ))}
            </div>

            {/* ── Funnel ── */}
            <ScrollReveal direction="up" delay={0.1}>
                <div className="card" style={{ marginBottom: 28 }}>
                    <div className="card-header">
                        <span className="card-title"><Activity size={16} /> Embudo de Conversión</span>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 }}
                            style={{
                                fontSize: 12, fontWeight: 700,
                                background: 'rgba(34,197,94,0.12)',
                                border: '1px solid rgba(34,197,94,0.2)',
                                color: '#22c55e', padding: '4px 12px', borderRadius: 20,
                            }}
                        >
                            {((funnel[funnel.length - 1]?.value / maxFunnel) * 100).toFixed(1)}% conversión total
                        </motion.span>
                    </div>
                    <div style={{ padding: '32px 36px' }}>
                        {funnel.map((stage, i) => {
                            const pct = ((stage.value / maxFunnel) * 100);
                            const convFromPrev = i > 0 ? ((stage.value / funnel[i - 1].value) * 100).toFixed(1) : null;
                            const color = FUNNEL_COLORS[i] || '#3b82f6';
                            return (
                                <div key={stage.stage}>
                                    <motion.div
                                        style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 4 }}
                                        initial={{ opacity: 0, x: -60 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
                                            flex: 1, height: 56, background: 'rgba(255,255,255,0.02)',
                                            borderRadius: 14, overflow: 'hidden', position: 'relative',
                                            border: '1px solid rgba(255,255,255,0.04)',
                                        }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(pct, 10)}%` }}
                                                transition={{ duration: 1.6, delay: 0.5 + i * 0.22, ease: [0.22, 1, 0.36, 1] }}
                                                style={{
                                                    height: '100%', borderRadius: 14,
                                                    background: `linear-gradient(90deg, ${color}, ${color}77)`,
                                                    boxShadow: `0 0 30px ${color}33`,
                                                    display: 'flex', alignItems: 'center', paddingLeft: 20,
                                                    fontSize: 18, fontWeight: 900, color: '#fff', minWidth: 80,
                                                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                                    position: 'relative', overflow: 'hidden',
                                                }}
                                            >
                                                {stage.value?.toLocaleString()}

                                                {/* Animated shine sweep */}
                                                <motion.div
                                                    animate={{ x: ['-100%', '300%'] }}
                                                    transition={{ repeat: Infinity, duration: 3, delay: 2 + i * 0.5, ease: 'easeInOut', repeatDelay: 4 }}
                                                    style={{
                                                        position: 'absolute', top: 0, bottom: 0, width: '40%',
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                                                    }}
                                                />
                                            </motion.div>
                                        </div>

                                        {/* Percentage Pill */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1.4 + i * 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                                            style={{
                                                width: 76, height: 42, borderRadius: 12,
                                                background: `${color}15`, border: `1.5px solid ${color}40`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 15, fontWeight: 800, color: color, flexShrink: 0,
                                                boxShadow: `0 0 16px ${color}15`,
                                            }}
                                        >
                                            {pct.toFixed(1)}%
                                        </motion.div>
                                    </motion.div>

                                    {/* Conversion Arrow — only between stages */}
                                    {convFromPrev && i < funnel.length && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            transition={{ delay: 1.8 + i * 0.2, duration: 0.4 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                marginLeft: 190, padding: '8px 0', marginBottom: 4,
                                            }}
                                        >
                                            <motion.div
                                                animate={{ y: [0, 3, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                            >
                                                <ArrowDown size={14} style={{ color: '#475569' }} />
                                            </motion.div>
                                            <span style={{
                                                fontSize: 12, fontWeight: 700,
                                                background: parseFloat(convFromPrev) > 50
                                                    ? 'rgba(34,197,94,0.1)' : parseFloat(convFromPrev) > 25
                                                        ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                                border: `1px solid ${parseFloat(convFromPrev) > 50
                                                        ? 'rgba(34,197,94,0.2)' : parseFloat(convFromPrev) > 25
                                                            ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'
                                                    }`,
                                                borderRadius: 8, padding: '4px 12px',
                                                color: parseFloat(convFromPrev) > 50
                                                    ? '#22c55e' : parseFloat(convFromPrev) > 25
                                                        ? '#f59e0b' : '#ef4444',
                                            }}>
                                                {convFromPrev}% pasan a la siguiente etapa
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </ScrollReveal>

            {/* ── Charts Row ── */}
            <div className="grid-2">
                {/* Trends */}
                <ScrollReveal direction="left" delay={0.1}>
                    <div className="card">
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
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.92 }}
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
                                        <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<PremiumTooltip />} />
                                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#gL)" strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                                        activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={1500} />
                                    <Area type="monotone" dataKey="efectivos" name="Efectivos" stroke="#22c55e" fill="url(#gE)" strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                                        activeDot={{ r: 7, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={1800} />
                                    <Area type="monotone" dataKey="matriculados" name="Matriculados" stroke="#a855f7" fill="none" strokeWidth={2} strokeDasharray="6 3"
                                        activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={2200} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Donut */}
                <ScrollReveal direction="right" delay={0.2}>
                    <div className="card">
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
                                        animationBegin={800} animationDuration={1600}
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
                    </div>
                </ScrollReveal>
            </div>

            {/* ── Programs Chart ── */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="card">
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
                                <Tooltip
                                    content={<PremiumTooltip />}
                                    cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 6 }}
                                />
                                <Legend
                                    verticalAlign="top" align="right" iconType="circle" iconSize={8}
                                    wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingBottom: 12 }}
                                />
                                <Bar dataKey="total" name="Leads" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={18} animationDuration={1400} />
                                <Bar dataKey="efectivos" name="Efectivos" fill="#22c55e" radius={[0, 8, 8, 0]} barSize={18} animationDuration={1800} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </ScrollReveal>
        </div>
    );
}

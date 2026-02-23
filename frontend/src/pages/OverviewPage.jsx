import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, PieChart as RePie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Users, UserCheck, UserX, GraduationCap, Phone, TrendingUp,
    BarChart3, PieChart as PieIcon, Target, ArrowUpRight, ArrowDownRight, Trophy,
} from 'lucide-react';
import api from '../api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/* ── Animated Counter ── */
function AnimatedNumber({ value, suffix = '', duration = 1.5 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });

    useEffect(() => {
        if (!inView || value == null) return;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) { setCount(value); return; }
        const start = performance.now();
        const animate = (now) => {
            const t = Math.min((now - start) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - t, 4);
            if (t >= 1) { setCount(num); return; }
            setCount(Math.floor(eased * num));
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [inView, value, duration]);

    return <span ref={ref}>{typeof count === 'number' ? count.toLocaleString() : count}{suffix}</span>;
}

/* ── Scroll Reveal ── */
function Reveal({ children, delay = 0, className = '' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

/* ── Dark Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-nods-card text-nods-text-primary rounded-xl shadow-2xl px-4 py-3 border border-nods-border min-w-[160px]">
            <p className="text-xs text-nods-text-muted mb-2 pb-1.5 border-b border-nods-border">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex justify-between items-center py-0.5 gap-4">
                    <span className="text-nods-text-muted text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                    </span>
                    <span className="font-bold text-nods-text-primary text-sm">{p.value?.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

/* ── KPI Card ── */
const KPI_STYLES = [
    { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/20' },
    { bg: 'bg-gradient-to-br from-slate-400 to-slate-500', shadow: 'shadow-slate-400/20' },
    { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
    { bg: 'bg-gradient-to-br from-rose-500 to-rose-600', shadow: 'shadow-rose-500/20' },
];

const StatCard = ({ label, value, icon: Icon, trend, suffix = '', styleIdx = 0, trendInverse = false }) => {
    return (
        <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-nods-card border border-nods-border p-6 rounded-3xl hover:border-nods-accent/30 transition-all group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-nods-text-primary uppercase tracking-wider">{label}</p>
                    <Icon size={16} className="text-nods-accent opacity-70" />
                </div>
                <h3 className="text-2xl font-extrabold text-nods-text-primary">
                    <AnimatedNumber value={value} suffix={suffix} />
                </h3>
                {trend != null && (
                    <div className={`flex items-center mt-2 text-[11px] font-semibold ${(trendInverse ? trend < 0 : trend > 0) ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {(trendInverse ? trend < 0 : trend > 0) ? <ArrowUpRight size={13} className="mr-0.5" /> : <ArrowDownRight size={13} className="mr-0.5" />}
                        {Math.abs(trend)}% vs anterior
                    </div>
                )}
            </div>
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

    useEffect(() => {
        Promise.all([
            api.kpis(), api.funnel(), api.trends(period), api.byMedio(), api.byPrograma(),
        ]).then(([k, f, t, m, p]) => {
            setKpis(k); setFunnel(f);
            setTrends(t.map(d => ({ ...d, period: d.period?.slice(5) })));
            setMedios(m); setProgramas(p.slice(0, 8));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        api.trends(period).then(t =>
            setTrends(t.map(d => ({ ...d, period: d.period?.slice(5) })))
        ).catch(() => { });
    }, [period]);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh] flex-col gap-4">
            <div className="loading-spinner" />
            <p className="text-slate-400 text-sm animate-pulse">Cargando dashboard...</p>
        </div>
    );

    const kpiCards = [
        { label: 'Total Leads', value: kpis?.total_leads, icon: Users, trend: 12 },
        { label: 'Contactados', value: kpis?.contactados, icon: Phone, trend: 8 },
        { label: 'No Contactados', value: kpis?.no_contactados, icon: UserX, trend: -5, trendInverse: true },
        { label: 'Contacto Efectivo', value: kpis?.contacto_efectivo, icon: UserCheck, trend: 15 },
        { label: 'Matriculados', value: kpis?.matriculados, icon: GraduationCap, trend: 22 },
        { label: 'Conversión', value: kpis?.total_leads ? ((kpis.matriculados / kpis.total_leads) * 100).toFixed(2) : '0', icon: TrendingUp, suffix: '%', trend: 4 },
    ];

    const maxFunnel = funnel[0]?.value || 1;
    const FUNNEL_COLORS = ['bg-blue-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500'];

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpiCards.map((k, i) => (
                    <Reveal key={k.label} delay={i * 0.05}>
                        <StatCard {...k} styleIdx={i} />
                    </Reveal>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Trend */}
                <Reveal className="lg:col-span-8">
                    <div className="bg-nods-card p-6 rounded-2xl border border-nods-border shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-nods-text-primary flex items-center gap-2">
                                    <BarChart3 size={16} className="text-nods-accent" /> Tendencias de Conversión
                                </h3>
                                <p className="text-xs text-nods-text-muted mt-0.5">Actividad por período</p>
                            </div>
                            <div className="flex bg-slate-100/80 rounded-lg p-1">
                                {[
                                    { key: 'day', label: 'Día' },
                                    { key: 'week', label: 'Semana' },
                                    { key: 'month', label: 'Mes' },
                                ].map(p => (
                                    <button
                                        key={p.key}
                                        onClick={() => setPeriod(p.key)}
                                        className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${period === p.key
                                            ? 'bg-nods-accent text-white shadow-sm'
                                            : 'text-nods-text-muted hover:text-nods-accent hover:bg-white'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#gL)" activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 3 }} animationDuration={1500} />
                                    <Area type="monotone" dataKey="efectivos" name="Efectivos" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#gE)" activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 3 }} animationDuration={1800} />
                                    <Area type="monotone" dataKey="matriculados" name="Matriculados" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" fillOpacity={0} animationDuration={2200} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-5 mt-4">
                            {[
                                { label: 'Leads', color: 'bg-nods-accent' },
                                { label: 'Efectivos', color: 'bg-nods-success' },
                                { label: 'Matriculados', color: 'bg-nods-warning' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-2 text-xs font-medium text-nods-text-muted">
                                    <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} /> {l.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* Funnel */}
                <Reveal className="lg:col-span-4" delay={0.15}>
                    <div className="bg-nods-card p-6 rounded-2xl border border-nods-border shadow-sm flex flex-col h-full">
                        <h3 className="font-bold text-nods-text-primary mb-6">Embudo de Ventas</h3>
                        <div className="flex-1 space-y-4">
                            {funnel.map((stage, i) => {
                                const pct = ((stage.value / maxFunnel) * 100);
                                const convFromPrev = i > 0 ? ((stage.value / funnel[i - 1].value) * 100).toFixed(0) : null;
                                return (
                                    <motion.div
                                        key={stage.stage}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.15 }}
                                    >
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[11px] font-bold text-nods-text-muted uppercase tracking-wider">{stage.stage}</span>
                                            <span className="text-sm font-extrabold text-nods-text-primary">{stage.value?.toLocaleString()}</span>
                                        </div>
                                        <div className="h-10 bg-slate-100 rounded-lg relative overflow-hidden shadow-inner border border-nods-border/30">
                                            <motion.div
                                                className={`h-full ${FUNNEL_COLORS[i] || 'bg-blue-500'} rounded-lg`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(pct, 10)}%` }}
                                                transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                            {convFromPrev && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-sm">
                                                    {convFromPrev}%
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        {funnel.length >= 2 && (
                            <p className="mt-6 text-xs text-slate-400 text-center">
                                Tasa de cierre: <span className="font-bold text-emerald-600">{((funnel[funnel.length - 1]?.value / maxFunnel) * 100).toFixed(1)}%</span>
                            </p>
                        )}
                    </div>
                </Reveal>
            </div>

            {/* Distribution Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie */}
                <Reveal>
                    <div className="bg-nods-card p-6 rounded-2xl border border-nods-border shadow-sm">
                        <h3 className="font-bold text-nods-text-primary mb-6 flex items-center gap-2">
                            <PieIcon size={16} className="text-blue-500" /> Distribución por Medio
                        </h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePie>
                                    <Pie
                                        data={medios.slice(0, 5)}
                                        dataKey="total" nameKey="medio"
                                        innerRadius={55} outerRadius={85}
                                        paddingAngle={4} stroke="none"
                                        animationDuration={1400}
                                    >
                                        {medios.slice(0, 5).map((_, i) => (
                                            <Cell key={i} fill={COLORS[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </RePie>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-4">
                            {medios.slice(0, 5).map((m, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-nods-text-muted">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                                    <span className="truncate">{m.medio}</span>
                                    <span className="ml-auto font-bold text-nods-text-primary">{m.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* Programs */}
                <Reveal delay={0.1}>
                    <div className="bg-nods-card p-6 rounded-2xl border border-nods-border shadow-sm">
                        <h3 className="font-bold text-nods-text-primary mb-6 flex items-center gap-2">
                            <Target size={16} className="text-rose-500" /> Top Programas
                        </h3>
                        <div className="space-y-4">
                            {programas.slice(0, 5).map((p, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-nods-text-primary truncate mr-2">
                                            {p.programa?.length > 25 ? p.programa.slice(0, 25) + '…' : p.programa}
                                        </span>
                                        <span className="font-bold text-nods-text-primary flex-shrink-0">{p.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-nods-border/30">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: COLORS[i % COLORS.length] }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(p.total / (programas[0]?.total || 1)) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* Agents */}
                <Reveal delay={0.2}>
                    <div className="bg-nods-card p-6 rounded-2xl border border-nods-border shadow-sm">
                        <h3 className="font-bold text-nods-text-primary mb-6 flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" /> Ranking Asesores
                        </h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Top 1', conv: '24.5%', bg: 'bg-white text-nods-text-primary border-nods-border hover:border-nods-warning/50', medal: '🥇' },
                                { name: 'Top 2', conv: '21.2%', bg: 'bg-white text-nods-text-primary border-nods-border hover:border-slate-300', medal: '🥈' },
                                { name: 'Top 3', conv: '18.8%', bg: 'bg-white text-nods-text-primary border-nods-border hover:border-nods-success/50', medal: '🥉' },
                            ].map((a, i) => (
                                <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border ${a.bg}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{a.medal}</span>
                                        <p className="text-sm font-bold">{a.name}</p>
                                    </div>
                                    <span className="text-sm font-extrabold text-emerald-600">{a.conv}</span>
                                </div>
                            ))}
                            <a href="/dashboard/agents" className="block text-center text-xs font-bold text-white mt-3 py-2.5 bg-nods-accent rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-nods-accent/10">
                                Ver ranking completo →
                            </a>
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

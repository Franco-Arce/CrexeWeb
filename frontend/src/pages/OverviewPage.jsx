import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, PieChart as RePie, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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

/* ── Premium Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    const hasConv = data?.total && data?.efectivos;
    const conv = hasConv ? ((data.efectivos / data.total) * 100).toFixed(1) : null;

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 px-5 py-4 min-w-[200px]">
            <div className="font-bold text-sm text-slate-800 mb-3 pb-2 border-b border-slate-100">
                {data?.programa || data?.nombre || label}
            </div>
            {payload.map((p, i) => (
                <div key={i} className="flex justify-between items-center py-1 gap-4">
                    <span className="text-slate-500 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: p.color }} />
                        {p.name}
                    </span>
                    <span className="font-bold text-sm" style={{ color: p.color }}>{p.value?.toLocaleString()}</span>
                </div>
            ))}
            {conv && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-400 text-[11px]">Conversión</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${parseFloat(conv) > 25 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>{conv}%</span>
                </div>
            )}
        </div>
    );
};

/* ── KPI Card ── */
const StatCard = ({ label, value, icon: Icon, trend, color, suffix = '' }) => (
    <motion.div
        whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-extrabold text-slate-900">
                    <AnimatedNumber value={value} suffix={suffix} />
                </h3>
                {trend != null && (
                    <div className={`flex items-center mt-2 text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                        {trend > 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                        {Math.abs(trend)}% vs anterior
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={18} className="text-white" />
            </div>
        </div>
    </motion.div>
);

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
        { label: 'Total Leads', value: kpis?.total_leads, icon: Users, color: 'bg-blue-500', trend: 12 },
        { label: 'Contactados', value: kpis?.contactados, icon: PhoneCall, color: 'bg-indigo-500', trend: 8 },
        { label: 'No Contactados', value: kpis?.no_contactados, icon: UserX, color: 'bg-slate-400', trend: -5 },
        { label: 'Contacto Efectivo', value: kpis?.contacto_efectivo, icon: UserCheck, color: 'bg-emerald-500', trend: 15 },
        { label: 'Matriculados', value: kpis?.matriculados, icon: GraduationCap, color: 'bg-amber-500', trend: 22 },
        { label: 'Conversión', value: kpis?.total_leads ? ((kpis.matriculados / kpis.total_leads) * 100).toFixed(1) : '0', icon: TrendingUp, color: 'bg-rose-500', suffix: '%', trend: 4 },
    ];

    const maxFunnel = funnel[0]?.value || 1;

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpiCards.map((k, i) => (
                    <Reveal key={k.label} delay={i * 0.05}>
                        <StatCard {...k} />
                    </Reveal>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Trend */}
                <Reveal className="lg:col-span-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart3 size={16} className="text-blue-500" /> Tendencias de Conversión
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Actividad por período</p>
                            </div>
                            <div className="flex bg-slate-100 rounded-lg p-0.5">
                                {[
                                    { key: 'day', label: 'Día' },
                                    { key: 'week', label: 'Semana' },
                                    { key: 'month', label: 'Mes' },
                                ].map(p => (
                                    <button
                                        key={p.key}
                                        onClick={() => setPeriod(p.key)}
                                        className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${period === p.key
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
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
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gL)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
                                    <Area type="monotone" dataKey="efectivos" name="Efectivos" stroke="#10b981" strokeWidth={2.5} fillOpacity={0} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} animationDuration={1800} />
                                    <Area type="monotone" dataKey="matriculados" name="Matriculados" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" fillOpacity={0} animationDuration={2200} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-5 mt-4">
                            {[
                                { label: 'Leads', color: 'bg-blue-500' },
                                { label: 'Efectivos', color: 'bg-emerald-500' },
                                { label: 'Matriculados', color: 'bg-amber-500' },
                            ].map(l => (
                                <div key={l.label} className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} /> {l.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* Funnel */}
                <Reveal className="lg:col-span-4" delay={0.15}>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
                        <h3 className="font-bold text-slate-800 mb-6">Embudo de Ventas</h3>
                        <div className="flex-1 space-y-4">
                            {funnel.map((stage, i) => {
                                const pct = ((stage.value / maxFunnel) * 100);
                                const convFromPrev = i > 0 ? ((stage.value / funnel[i - 1].value) * 100).toFixed(0) : null;
                                const barColors = ['bg-blue-600', 'bg-blue-500', 'bg-blue-400', 'bg-amber-500', 'bg-violet-500'];
                                return (
                                    <motion.div
                                        key={stage.stage}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.15 }}
                                    >
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stage.stage}</span>
                                            <span className="text-sm font-extrabold text-slate-900">{stage.value?.toLocaleString()}</span>
                                        </div>
                                        <div className="h-10 bg-slate-100 rounded-lg relative overflow-hidden">
                                            <motion.div
                                                className={`h-full ${barColors[i] || 'bg-blue-500'} rounded-lg`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(pct, 10)}%` }}
                                                transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                            {convFromPrev && (
                                                <div className="absolute top-1/2 right-2 -translate-y-1/2 text-[10px] font-bold text-white bg-black/20 px-1.5 py-0.5 rounded">
                                                    {convFromPrev}%
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        {funnel.length >= 2 && (
                            <p className="mt-6 text-xs text-slate-400 text-center italic">
                                Tasa de cierre: {((funnel[funnel.length - 1]?.value / maxFunnel) * 100).toFixed(1)}% sobre el total
                            </p>
                        )}
                    </div>
                </Reveal>
            </div>

            {/* Distribution Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie */}
                <Reveal>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
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
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {medios.slice(0, 5).map((m, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                                    {m.medio}: {m.total}
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* Programs */}
                <Reveal delay={0.1}>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Target size={16} className="text-rose-500" /> Top Programas
                        </h3>
                        <div className="space-y-4">
                            {programas.slice(0, 5).map((p, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-slate-700 truncate mr-2">
                                            {p.programa?.length > 25 ? p.programa.slice(0, 25) + '…' : p.programa}
                                        </span>
                                        <span className="font-bold text-slate-900 flex-shrink-0">{p.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <motion.div
                                            className="bg-blue-600 h-full rounded-full"
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
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" /> Ranking Asesores
                        </h3>
                        <div className="space-y-3">
                            {/* We'll show top 4 agents from trends or programas */}
                            {[
                                { name: 'Top 1', conv: '24.5%', bg: 'bg-amber-100 text-amber-600' },
                                { name: 'Top 2', conv: '21.2%', bg: 'bg-slate-200 text-slate-600' },
                                { name: 'Top 3', conv: '18.8%', bg: 'bg-orange-100 text-orange-600' },
                            ].map((a, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${a.bg}`}>
                                            {i + 1}
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{a.name}</p>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">{a.conv}</span>
                                </div>
                            ))}
                            <a href="/dashboard/agents" className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2">
                                Ver todos →
                            </a>
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

function PhoneCall(props) {
    return <Phone {...props} />;
}

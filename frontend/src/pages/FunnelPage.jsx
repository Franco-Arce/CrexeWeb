import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Funnel, ArrowDown, Target } from 'lucide-react';
import api from '../api';

const STAGE_GRADIENTS = [
    'from-blue-600 to-blue-500',
    'from-indigo-600 to-indigo-500',
    'from-emerald-600 to-emerald-500',
    'from-amber-500 to-amber-400',
    'from-violet-600 to-violet-500',
];
const BAR_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-2xl border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">{d.payload?.stage}</p>
            <p className="text-lg font-extrabold">{d.value?.toLocaleString()}</p>
        </div>
    );
};

export default function FunnelPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.funnel().then(setData).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner" />;

    const maxVal = data[0]?.value || 1;
    const totalConversion = data.length >= 2
        ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(2)
        : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Funnel size={20} className="text-blue-500" /> Embudo de Conversión
                    </h2>
                    <p className="text-sm text-nods-text-muted mt-0.5">Flujo completo de leads hasta matriculación</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <span className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wider">Conversión Total</span>
                    <p className="text-2xl font-extrabold text-white">{totalConversion}%</p>
                </div>
            </div>

            {/* Visual Funnel */}
            <div className="bg-nods-card border border-nods-border p-8 rounded-2xl shadow-sm">
                <div className="max-w-2xl mx-auto space-y-1">
                    {data.map((stage, i) => {
                        const widthPct = Math.max((stage.value / maxVal) * 100, 20);
                        const convFromPrev = i > 0 ? ((stage.value / data[i - 1].value) * 100).toFixed(1) : null;

                        return (
                            <div key={stage.stage}>
                                {i > 0 && (
                                    <div className="flex items-center justify-center py-2">
                                        <ArrowDown size={16} className="text-slate-300" />
                                        <span className={`ml-2 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ${parseFloat(convFromPrev) > 50 ? 'bg-emerald-100 text-emerald-700' :
                                            parseFloat(convFromPrev) > 25 ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                            {convFromPrev}% pasan
                                        </span>
                                    </div>
                                )}

                                <motion.div
                                    className="mx-auto"
                                    style={{ width: `${widthPct}%` }}
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: `${widthPct}%`, opacity: 1 }}
                                    transition={{ duration: 1, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <div className={`relative rounded-2xl px-5 py-5 text-white text-center overflow-hidden bg-gradient-to-r ${STAGE_GRADIENTS[i]} shadow-lg`}>
                                        <div className="absolute inset-0 bg-white/5" />
                                        <div className="relative z-10">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80 mb-1">{stage.stage}</p>
                                            <p className="text-3xl font-extrabold">{stage.value?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bar chart */}
            <div className="bg-nods-card border border-nods-border p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                    <Target size={16} className="text-blue-500" /> Comparativa por Etapa
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)', radius: 8 }} />
                            <Bar dataKey="value" name="Cantidad" radius={[8, 8, 0, 0]} animationDuration={1500}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={BAR_COLORS[i]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Conversion Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.length >= 2 && data.slice(1).map((stage, i) => {
                    const prev = data[i];
                    const conv = ((stage.value / prev.value) * 100).toFixed(1);
                    const isGood = parseFloat(conv) > 50;
                    const isMid = parseFloat(conv) > 25;
                    return (
                        <motion.div
                            key={stage.stage}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className={`p-5 rounded-2xl text-center border shadow-sm ${isGood ? 'bg-emerald-50 border-emerald-100' :
                                isMid ? 'bg-amber-50 border-amber-100' :
                                    'bg-red-50 border-red-100'
                                }`}
                        >
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                {prev.stage} → {stage.stage}
                            </p>
                            <p className={`text-3xl font-extrabold ${isGood ? 'text-emerald-600' : isMid ? 'text-amber-500' : 'text-red-500'
                                }`}>{conv}%</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {prev.value?.toLocaleString()} → {stage.value?.toLocaleString()}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

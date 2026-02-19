import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Funnel, ArrowDown, TrendingUp, Target } from 'lucide-react';
import api from '../api';

const BAR_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

export default function FunnelPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.funnel().then(setData).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner" />;

    const maxVal = data[0]?.value || 1;
    const totalConversion = data.length >= 2
        ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(1)
        : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Funnel size={20} className="text-blue-500" /> Embudo de Conversión
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5">Flujo completo de leads hasta matriculación</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Conversión Total</span>
                    <p className="text-2xl font-extrabold text-emerald-600">{totalConversion}%</p>
                </div>
            </div>

            {/* Visual Funnel */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <div className="max-w-2xl mx-auto space-y-2">
                    {data.map((stage, i) => {
                        const widthPct = Math.max((stage.value / maxVal) * 100, 15);
                        const convFromPrev = i > 0 ? ((stage.value / data[i - 1].value) * 100).toFixed(1) : null;

                        return (
                            <div key={stage.stage}>
                                {/* Conversion arrow */}
                                {i > 0 && (
                                    <div className="flex items-center justify-center py-1.5">
                                        <ArrowDown size={18} className="text-slate-300" />
                                        <span className={`ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${parseFloat(convFromPrev) > 50 ? 'bg-emerald-50 text-emerald-600' :
                                                parseFloat(convFromPrev) > 25 ? 'bg-amber-50 text-amber-600' :
                                                    'bg-red-50 text-red-500'
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
                                    <div
                                        className="relative rounded-xl px-5 py-4 text-white text-center overflow-hidden"
                                        style={{ background: BAR_COLORS[i] || BAR_COLORS[0] }}
                                    >
                                        <div className="relative z-10">
                                            <p className="text-xs font-semibold opacity-80 mb-0.5">{stage.stage}</p>
                                            <p className="text-2xl font-extrabold">{stage.value?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Target size={16} className="text-blue-500" /> Comparativa por Etapa
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                            />
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
                    return (
                        <motion.div
                            key={stage.stage}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center"
                        >
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                {prev.stage} → {stage.stage}
                            </p>
                            <p className={`text-3xl font-extrabold ${parseFloat(conv) > 50 ? 'text-emerald-600' :
                                    parseFloat(conv) > 25 ? 'text-amber-500' :
                                        'text-red-500'
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

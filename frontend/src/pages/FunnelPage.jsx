import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

const STAGE_COLORS = ['#3b82f6', '#60a5fa', '#22c55e', '#a855f7'];
const STAGE_ICONS = ['🎯', '📞', '✅', '🎓'];

export default function FunnelPage() {
    const [funnel, setFunnel] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.funnel().then((d) => { setFunnel(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner" />;

    const maxVal = funnel[0]?.value || 1;

    return (
        <div className="animate-fade-in">
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="card-header">
                    <span className="card-title">Funnel de Gestión Completo</span>
                    <span className="card-subtitle">No Contactado → Contactado → Contacto Efectivo → Matriculado</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '20px 0' }}>
                    {funnel.map((stage, i) => {
                        const widthPct = Math.max((stage.value / maxVal) * 100, 12);
                        const convRate = i > 0 ? ((stage.value / funnel[i - 1].value) * 100).toFixed(1) : '100.0';
                        const lostAbsolute = i > 0 ? funnel[i - 1].value - stage.value : 0;

                        return (
                            <div key={stage.stage}>
                                <motion.div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0',
                                    }}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2, duration: 0.6 }}
                                >
                                    <div style={{ width: 50, textAlign: 'center', fontSize: 28 }}>{STAGE_ICONS[i]}</div>
                                    <div style={{ width: 160 }}>
                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#f1f5f9' }}>{stage.stage}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>
                                            {i > 0 ? `${convRate}% conversión` : 'Base total'}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <div style={{
                                            height: 52, background: '#12121f', borderRadius: 10,
                                            overflow: 'hidden', position: 'relative',
                                        }}>
                                            <motion.div
                                                style={{
                                                    height: '100%', background: STAGE_COLORS[i],
                                                    borderRadius: 10, display: 'flex', alignItems: 'center',
                                                    paddingLeft: 16, fontWeight: 700, fontSize: 16, color: 'white',
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${widthPct}%` }}
                                                transition={{ delay: 0.3 + i * 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                {stage.value?.toLocaleString()}
                                            </motion.div>
                                        </div>
                                    </div>
                                    <div style={{ width: 100, textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: 22, color: STAGE_COLORS[i] }}>
                                            {stage.value?.toLocaleString()}
                                        </div>
                                        {i > 0 && lostAbsolute > 0 && (
                                            <div style={{ fontSize: 11, color: '#ef4444' }}>
                                                -{lostAbsolute.toLocaleString()} perdidos
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {i < funnel.length - 1 && (
                                    <motion.div
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '4px 0', color: '#1a1a2e',
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + i * 0.2 }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M10 4V16M10 16L5 11M10 16L15 11" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Conversion Summary */}
                {funnel.length >= 4 && (
                    <motion.div
                        style={{
                            marginTop: 20, padding: 20, background: '#0a0a12', borderRadius: 12,
                            border: '1px solid #1a1a2e', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Lead → Contactado</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>
                                {((funnel[1].value / funnel[0].value) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Lead → Efectivo</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                                {((funnel[2].value / funnel[0].value) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Lead → Matriculado</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7' }}>
                                {((funnel[3].value / funnel[0].value) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

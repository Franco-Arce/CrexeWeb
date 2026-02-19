import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Brain, TrendingUp, Lightbulb, Sparkles, Loader2 } from 'lucide-react';
import api from '../api';

const ICON_MAP = {
    trending_up: <TrendingUp size={14} className="text-emerald-500" />,
    trending_down: <TrendingUp size={14} className="text-rose-500 rotate-180" />,
    alert: <Lightbulb size={14} className="text-amber-500" />,
    star: <Sparkles size={14} className="text-violet-500" />,
};

export default function AIPanel({ onClose }) {
    const [tab, setTab] = useState('chat');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '¡Hola! Soy tu analista de datos IA. Preguntame lo que necesites sobre tus leads, gestiones y conversiones. 🚀' },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [insights, setInsights] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [loadingPred, setLoadingPred] = useState(false);
    const messagesEnd = useRef(null);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setSending(true);
        try {
            const res = await api.aiChat(input, messages.slice(1));
            setMessages([...newMessages, { role: 'assistant', content: res.response }]);
        } catch (e) {
            setMessages([...newMessages, { role: 'assistant', content: 'Error al procesar tu pregunta. Intentá de nuevo.' }]);
        }
        setSending(false);
    };

    const loadInsights = async () => {
        if (insights) return;
        setLoadingInsights(true);
        try {
            const res = await api.aiInsights();
            setInsights(res.insights);
        } catch (e) {
            setInsights([{ icon: 'alert', title: 'Error', description: 'No se pudieron generar insights.' }]);
        }
        setLoadingInsights(false);
    };

    const loadPredictions = async () => {
        if (predictions) return;
        setLoadingPred(true);
        try {
            const res = await api.aiPredictions();
            setPredictions(res.predictions);
        } catch (e) {
            setPredictions([]);
        }
        setLoadingPred(false);
    };

    useEffect(() => {
        if (tab === 'insights') loadInsights();
        if (tab === 'predictions') loadPredictions();
    }, [tab]);

    const TABS = [
        { key: 'chat', label: '💬 Chat' },
        { key: 'insights', label: '💡 Insights' },
        { key: 'predictions', label: '🔮 Predicciones' },
    ];

    return (
        <motion.div
            className="fixed top-0 right-0 bottom-0 w-[380px] bg-white border-l border-slate-200 shadow-2xl shadow-slate-300/30 flex flex-col z-50"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">IA Asistente</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-slate-400">Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${tab === t.key
                                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                                : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                {/* Chat */}
                {tab === 'chat' && (
                    <div className="flex flex-col gap-3 min-h-full">
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`max-w-[88%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white self-end rounded-tr-sm'
                                        : 'bg-white text-slate-700 border border-slate-100 shadow-sm self-start rounded-tl-sm'
                                    }`}
                            >
                                {msg.content}
                            </motion.div>
                        ))}
                        {sending && (
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm self-start rounded-tl-sm flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin text-blue-500" />
                                <span className="text-xs text-slate-400">Analizando...</span>
                            </div>
                        )}
                        <div ref={messagesEnd} />
                    </div>
                )}

                {/* Insights */}
                {tab === 'insights' && (
                    <div className="space-y-3">
                        {loadingInsights ? (
                            <div className="loading-spinner" />
                        ) : (
                            insights?.map((ins, i) => (
                                <motion.div
                                    key={i}
                                    className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:border-slate-200 transition-colors"
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
                                        {ICON_MAP[ins.icon] || ICON_MAP.alert}
                                        {ins.title}
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{ins.description}</p>
                                </motion.div>
                            ))
                        )}
                        <button
                            onClick={() => { setInsights(null); loadInsights(); }}
                            className="w-full mt-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            🔄 Regenerar Insights
                        </button>
                    </div>
                )}

                {/* Predictions */}
                {tab === 'predictions' && (
                    <div>
                        {loadingPred ? (
                            <div className="loading-spinner" />
                        ) : predictions && predictions.length > 0 ? (
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Período</th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Leads</th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Efec.</th>
                                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Conf.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {predictions.map((p, i) => (
                                            <motion.tr
                                                key={i}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{p.period}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-blue-600">{p.predicted_leads?.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-emerald-600">{p.predicted_efectivos?.toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style={{ width: `${(p.confidence || 0) * 100}%` }} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm text-center py-10">
                                No hay suficientes datos para predicciones.
                            </p>
                        )}
                        <button
                            onClick={() => { setPredictions(null); loadPredictions(); }}
                            className="w-full mt-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            🔄 Regenerar Predicciones
                        </button>
                    </div>
                )}
            </div>

            {/* Input */}
            {tab === 'chat' && (
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input
                        type="text"
                        placeholder="Pregunta sobre los leads..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={sending}
                        className="flex-1 px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={sending || !input.trim()}
                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}
        </motion.div>
    );
}

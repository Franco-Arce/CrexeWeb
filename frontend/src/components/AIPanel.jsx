import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, TrendingUp, Brain, Lightbulb } from 'lucide-react';
import api from '../api';

const ICON_MAP = {
    trending_up: <TrendingUp size={14} style={{ color: '#22c55e' }} />,
    trending_down: <TrendingUp size={14} style={{ color: '#ef4444', transform: 'rotate(180deg)' }} />,
    alert: <Lightbulb size={14} style={{ color: '#f59e0b' }} />,
    star: <Sparkles size={14} style={{ color: '#a855f7' }} />,
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
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
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

    return (
        <AnimatePresence>
            <motion.div
                className="ai-panel"
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <div className="ai-panel-header">
                    <h3><Brain size={18} style={{ color: 'var(--accent)' }} /> IA Asistente</h3>
                    <button className="toggle-btn" onClick={onClose}><X size={14} /></button>
                </div>

                <div className="ai-tabs">
                    <button className={`ai-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
                        💬 Chat
                    </button>
                    <button className={`ai-tab ${tab === 'insights' ? 'active' : ''}`} onClick={() => setTab('insights')}>
                        💡 Insights
                    </button>
                    <button className={`ai-tab ${tab === 'predictions' ? 'active' : ''}`} onClick={() => setTab('predictions')}>
                        🔮 Predicciones
                    </button>
                </div>

                <div className="ai-body">
                    {/* CHAT TAB */}
                    {tab === 'chat' && (
                        <div className="ai-messages">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    className={`ai-msg ${msg.role}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 }}
                                >
                                    {msg.content}
                                </motion.div>
                            ))}
                            {sending && (
                                <div className="ai-msg assistant" style={{ opacity: 0.5 }}>
                                    <div className="loading-spinner" style={{ width: 18, height: 18, margin: '0 auto', borderWidth: 2 }} />
                                </div>
                            )}
                            <div ref={messagesEnd} />
                        </div>
                    )}

                    {/* INSIGHTS TAB */}
                    {tab === 'insights' && (
                        <div>
                            {loadingInsights ? (
                                <div className="loading-spinner" />
                            ) : (
                                insights?.map((ins, i) => (
                                    <motion.div
                                        key={i}
                                        className="insight-card"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="insight-title">
                                            {ICON_MAP[ins.icon] || ICON_MAP.alert}
                                            {ins.title}
                                        </div>
                                        <div className="insight-desc">{ins.description}</div>
                                    </motion.div>
                                ))
                            )}
                            <button
                                onClick={() => { setInsights(null); loadInsights(); }}
                                style={{
                                    marginTop: 12, padding: '8px 16px', background: 'var(--bg-card)',
                                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--accent)',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 500, width: '100%',
                                }}
                            >
                                🔄 Regenerar Insights
                            </button>
                        </div>
                    )}

                    {/* PREDICTIONS TAB */}
                    {tab === 'predictions' && (
                        <div>
                            {loadingPred ? (
                                <div className="loading-spinner" />
                            ) : predictions && predictions.length > 0 ? (
                                <table className="pred-table">
                                    <thead>
                                        <tr>
                                            <th>Período</th>
                                            <th>Leads</th>
                                            <th>Efectivos</th>
                                            <th>Confianza</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {predictions.map((p, i) => (
                                            <motion.tr
                                                key={i}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <td style={{ fontWeight: 500 }}>{p.period}</td>
                                                <td style={{ color: '#60a5fa', fontWeight: 600 }}>{p.predicted_leads?.toLocaleString()}</td>
                                                <td style={{ color: '#22c55e', fontWeight: 600 }}>{p.predicted_efectivos?.toLocaleString()}</td>
                                                <td>
                                                    <div className="confidence-bar" style={{ width: 60 }}>
                                                        <div className="confidence-fill" style={{ width: `${(p.confidence || 0) * 100}%` }} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>
                                    No hay suficientes datos históricos para generar predicciones.
                                </p>
                            )}
                            <button
                                onClick={() => { setPredictions(null); loadPredictions(); }}
                                style={{
                                    marginTop: 12, padding: '8px 16px', background: 'var(--bg-card)',
                                    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--accent)',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 500, width: '100%',
                                }}
                            >
                                🔄 Regenerar Predicciones
                            </button>
                        </div>
                    )}
                </div>

                {tab === 'chat' && (
                    <div className="ai-input-area">
                        <input
                            type="text"
                            placeholder="Preguntame sobre tus datos..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={sending}
                        />
                        <button onClick={sendMessage} disabled={sending}>
                            <Send size={14} />
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

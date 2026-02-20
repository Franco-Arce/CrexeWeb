import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.login(username, password);
            localStorage.setItem('uniandes_token', res.token);
            navigate('/dashboard');
        } catch {
            setError('Credenciales inválidas');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-5">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-12 text-center relative overflow-hidden"
            >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <div className="mb-4">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-slate-500/25 p-3">
                        <img src="/nods-logo.svg" alt="NODS" className="w-full" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
                        Uniandes
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">Grupo Nods</p>
                </div>

                <form onSubmit={handleLogin} className="mt-8 text-left space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                            <User size={12} /> Usuario
                        </label>
                        <input
                            type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Tu usuario"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                            <Lock size={12} /> Contraseña
                        </label>
                        <input
                            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <motion.button
                        type="submit" disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </motion.button>
                </form>
            </motion.div >
        </div >
    );
}

import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Funnel, Users, Trophy,
    ChevronLeft, ChevronRight, LogOut, Sparkles,
} from 'lucide-react';
import AIPanel from '../components/AIPanel';

const NAV = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/dashboard/funnel', icon: <Funnel size={18} />, label: 'Embudo' },
    { to: '/dashboard/leads', icon: <Users size={18} />, label: 'Leads' },
    { to: '/dashboard/agents', icon: <Trophy size={18} />, label: 'Agentes' },
];

const PAGE_TITLES = {
    '/dashboard': 'Vista General',
    '/dashboard/funnel': 'Embudo de Conversión',
    '/dashboard/leads': 'Gestión de Leads',
    '/dashboard/agents': 'Performance de Agentes',
};

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const logout = () => {
        localStorage.removeItem('uniandes_token');
        navigate('/');
    };

    const title = PAGE_TITLES[location.pathname] || 'Dashboard';

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
            {/* ── Sidebar ── */}
            <motion.aside
                className="bg-slate-900 text-white flex-shrink-0 flex flex-col"
                initial={false}
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ duration: 0.25 }}
            >
                <div className="p-5 flex items-center gap-3 border-b border-slate-800">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 p-1.5">
                        <img src="/nods-logo.svg" alt="NODS" className="w-full" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <h2 className="text-lg font-extrabold leading-tight">Uniandes</h2>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Grupo Nods</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`
                            }
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-slate-800 space-y-1">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors w-full"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        {!collapsed && <span>Colapsar</span>}
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-medium text-red-400 hover:bg-slate-800 transition-colors w-full"
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </motion.aside>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    <button
                        onClick={() => setShowAI(!showAI)}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${showAI
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-500'
                            }`}
                        title="Asistente IA"
                    >
                        <Sparkles size={16} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
                    <Outlet />
                </main>
            </div>

            <AnimatePresence>
                {showAI && <AIPanel onClose={() => setShowAI(false)} />}
            </AnimatePresence>
        </div>
    );
}

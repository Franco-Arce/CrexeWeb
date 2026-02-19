import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Funnel, Users, Trophy, Brain,
    ChevronLeft, ChevronRight, LogOut, Sparkles,
} from 'lucide-react';
import AIPanel from '../components/AIPanel';

const NAV = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview', end: true },
    { to: '/dashboard/funnel', icon: <Funnel size={18} />, label: 'Embudo' },
    { to: '/dashboard/leads', icon: <Users size={18} />, label: 'Leads' },
    { to: '/dashboard/agents', icon: <Trophy size={18} />, label: 'Agentes' },
];

const PAGE_TITLES = {
    '/dashboard': 'Overview',
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
        localStorage.removeItem('crexe_token');
        navigate('/');
    };

    const title = PAGE_TITLES[location.pathname] || 'Dashboard';

    return (
        <div className="dashboard-layout">
            {/* ── Sidebar ── */}
            <motion.aside
                className={`sidebar ${collapsed ? 'collapsed' : ''}`}
                initial={false}
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ duration: 0.25 }}
            >
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">⚡</div>
                    {!collapsed && (
                        <div className="sidebar-brand-text">
                            <h2>CrexeWeb</h2>
                            <span>Dashboard IA</span>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        {!collapsed && <span>Colapsar</span>}
                    </button>
                    <button className="nav-item" onClick={logout} style={{ color: '#ef4444' }}>
                        <LogOut size={18} />
                        {!collapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </motion.aside>

            {/* ── Main Content ── */}
            <div className="main-content">
                <header className="topbar">
                    <div className="topbar-left">
                        <h1 className="topbar-title">{title}</h1>
                    </div>
                    <div className="topbar-right">
                        <button
                            className="topbar-btn"
                            onClick={() => setShowAI(!showAI)}
                            style={{
                                background: showAI ? 'var(--accent-glow)' : 'transparent',
                                borderColor: showAI ? 'var(--accent)' : 'var(--border)',
                                color: showAI ? 'var(--accent-light)' : 'var(--text-secondary)',
                            }}
                            title="Asistente IA"
                        >
                            <Sparkles size={16} />
                        </button>
                    </div>
                </header>

                <main className="page-content">
                    <Outlet />
                </main>
            </div>

            <AnimatePresence>
                {showAI && <AIPanel onClose={() => setShowAI(false)} />}
            </AnimatePresence>
        </div>
    );
}

import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Filter, Users, UserCheck, Brain,
    LogOut, Menu, ChevronLeft, Sparkles,
} from 'lucide-react';
import AIPanel from '../components/AIPanel';

const NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/dashboard/funnel', icon: Filter, label: 'Funnel' },
    { to: '/dashboard/leads', icon: Users, label: 'Leads' },
    { to: '/dashboard/agents', icon: UserCheck, label: 'Agentes' },
];

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const pageTitle = () => {
        const p = location.pathname;
        if (p.includes('funnel')) return 'Funnel de Gestión';
        if (p.includes('leads')) return 'Leads';
        if (p.includes('agents')) return 'Performance de Agentes';
        return 'Overview';
    };

    const handleLogout = () => {
        localStorage.removeItem('crexe_token');
        localStorage.removeItem('crexe_user');
        navigate('/');
    };

    return (
        <div className="app-layout">
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-icon">C</div>
                        <span className="brand-text">CrexeWeb</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/dashboard'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="nav-item" onClick={handleLogout}>
                        <LogOut size={18} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <div className="main-content" style={{ marginLeft: collapsed ? 0 : 260 }}>
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
                            {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
                        </button>
                        <h2>{pageTitle()}</h2>
                    </div>
                    <div className="top-bar-right">
                        <button
                            className="toggle-btn"
                            onClick={() => setAiOpen(!aiOpen)}
                            style={aiOpen ? { background: 'var(--accent-glow)', borderColor: 'var(--accent)' } : {}}
                            title="IA Asistente"
                        >
                            <Sparkles size={16} style={{ color: aiOpen ? 'var(--accent)' : undefined }} />
                        </button>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </div>

            {aiOpen && <AIPanel onClose={() => setAiOpen(false)} />}
        </div>
    );
}

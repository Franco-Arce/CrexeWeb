import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import FunnelPage from './pages/FunnelPage';
import LeadsPage from './pages/LeadsPage';
import AgentsPage from './pages/AgentsPage';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('uniandes_token');
    return token ? children : <Navigate to="/" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<OverviewPage />} />
                    <Route path="funnel" element={<FunnelPage />} />
                    <Route path="leads" element={<LeadsPage />} />
                    <Route path="agents" element={<AgentsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar    from './components/Sidebar';
import Login      from './pages/Login';
import Landing    from './pages/Landing';
import Dashboard  from './pages/Dashboard';
import MemberDashboard from './pages/MemberDashboard';
import Books      from './pages/Books';
import Members    from './pages/Members';
import Issues     from './pages/Issues';
import Fines      from './pages/Fines';
import Employees  from './pages/Employees';
import Authors    from './pages/Authors';

// Wrap all authenticated pages with sidebar layout
function AppLayout() {
  const { employee, loading } = useAuth();
  if (loading)  return <div style={{ padding: '2rem' }}>Loading…</div>;
  if (!employee) return <Navigate to="/" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

function RoleDashboard() {
  const { isMember } = useAuth();
  return isMember ? <MemberDashboard /> : <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login/employee" element={<Login mode="employee" />} />
          <Route path="/login/member" element={<Login mode="member" />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard"  element={<RoleDashboard />} />
            <Route path="/books"     element={<Books />}     />
            <Route path="/members"   element={<Members />}   />
            <Route path="/issues"    element={<Issues />}    />
            <Route path="/fines"     element={<Fines />}     />
            <Route path="/employees" element={<Employees />} />
            <Route path="/authors"   element={<Authors />}   />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

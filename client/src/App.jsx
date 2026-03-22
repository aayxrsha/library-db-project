import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RegisterMember from './pages/RegisterMember';
import RegisterAdmin from './pages/RegisterAdmin';
import MemberPortal from './pages/MemberPortal';
import LibrarianPortal from './pages/LibrarianPortal';
import AdminPortal from './pages/AdminPortal';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import IssueBook from './pages/IssueBook';
import ReturnBook from './pages/ReturnBook';
import IssueLog from './pages/IssueLog';
import { getStoredAuth } from './services/api';

function App() {
  const [auth, setAuth] = useState(getStoredAuth());

  return (
    <Shell auth={auth} onAuthChange={setAuth}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={auth?.user?.role === 'admin' ? '/admin' : auth?.user?.role === 'librarian' ? '/librarian' : auth?.user?.role === 'member' ? '/member' : '/login'} replace />}
        />
        <Route path="/login" element={<Login onLogin={setAuth} />} />
        <Route path="/register" element={<RegisterMember />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />

        <Route
          path="/admin"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['admin']}>
              <AdminPortal />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/member"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['member']}>
              <MemberPortal />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/librarian"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['librarian', 'admin']}>
              <LibrarianPortal />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute auth={auth}>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/books"
          element={(
            <ProtectedRoute auth={auth}>
              <Books />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/members"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['librarian', 'admin']}>
              <Members />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/issue"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['librarian', 'admin']}>
              <IssueBook />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/return"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['librarian', 'admin']}>
              <ReturnBook />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/issues"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['librarian', 'admin']}>
              <IssueLog />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </Shell>
  );
}

export default App;

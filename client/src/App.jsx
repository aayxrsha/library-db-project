import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RegisterMember from './pages/RegisterMember';
import MemberPortal from './pages/MemberPortal';
import LibrarianPortal from './pages/LibrarianPortal';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import IssueBook from './pages/IssueBook';
import ReturnBook from './pages/ReturnBook';
import { getStoredAuth } from './services/api';

function App() {
  const [auth, setAuth] = useState(getStoredAuth());

  return (
    <Shell auth={auth} onAuthChange={setAuth}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={auth?.user?.role === 'librarian' ? '/librarian' : auth?.user?.role === 'member' ? '/member' : '/login'} replace />}
        />
        <Route path="/login" element={<Login onLogin={setAuth} />} />
        <Route path="/register" element={<RegisterMember />} />

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
            <ProtectedRoute auth={auth} allowedRoles={['librarian']}>
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
            <ProtectedRoute auth={auth} allowedRoles={['librarian']}>
              <Members />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/issue"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['librarian']}>
              <IssueBook />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/return"
          element={(
            <ProtectedRoute auth={auth} allowedRoles={['librarian']}>
              <ReturnBook />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </Shell>
  );
}

export default App;

import { Navigate } from 'react-router-dom';

function ProtectedRoute({ auth, allowedRoles, children }) {
  if (!auth?.token || !auth?.user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    const fallback = auth.user.role === 'admin' ? '/admin' : auth.user.role === 'librarian' ? '/librarian' : '/member';
    return <Navigate to={fallback} replace />;
  }

  return children;
}

export default ProtectedRoute;

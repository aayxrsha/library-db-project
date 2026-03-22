import { Navigate } from 'react-router-dom';

function ProtectedRoute({ auth, allowedRoles, children }) {
  if (!auth?.token || !auth?.user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.user.role)) {
    return <Navigate to={auth.user.role === 'librarian' ? '/librarian' : '/member'} replace />;
  }

  return children;
}

export default ProtectedRoute;

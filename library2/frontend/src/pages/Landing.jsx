import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { employee, loading } = useAuth();

  if (!loading && employee) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-wrap">
      <div className="landing-bg-shape shape-a" />
      <div className="landing-bg-shape shape-b" />

      <div className="landing-card fade-in-up">
        <div className="landing-eyebrow">Welcome</div>
        <h1 className="landing-title">Library Management System</h1>
        <p className="landing-subtitle">
          Manage collections, requests, issue and return workflows with role-based dashboards.
        </p>

        <div className="landing-actions">
          <Link to="/login/employee" className="btn btn-primary">Employee Login</Link>
          <Link to="/login/member" className="btn btn-secondary">Member Login</Link>
        </div>
      </div>
    </div>
  );
}

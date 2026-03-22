import { Link, useLocation } from 'react-router-dom';
import { clearStoredAuth } from '../services/api';

function getLinks(auth) {
  if (!auth?.user) {
    return [
      { path: '/login', label: 'Login' },
      { path: '/register', label: 'Register Member' }
    ];
  }

  if (auth.user.role === 'librarian') {
    return [
      { path: '/librarian', label: 'Librarian Portal' },
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/books', label: 'Books' },
      { path: '/members', label: 'Members' },
      { path: '/issue', label: 'Issue Manual' },
      { path: '/return', label: 'Return Manual' }
    ];
  }

  return [
    { path: '/member', label: 'Member Portal' },
    { path: '/dashboard', label: 'Dashboard' }
  ];
}

function NavBar({ auth, onAuthChange }) {
  const { pathname } = useLocation();
  const links = getLinks(auth);

  const handleLogout = () => {
    clearStoredAuth();
    onAuthChange(null);
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-icon">LB</span>
        <div>
          <h1>Library Command Center</h1>
          <p>React + Node + MySQL</p>
        </div>
      </div>

      <nav className="topnav">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={pathname === link.path ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}

        {auth?.user && (
          <button type="button" className="secondary-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}

export default NavBar;

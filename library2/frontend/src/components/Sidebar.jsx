import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/books',     label: '📚 Books'     },
  { to: '/members',   label: '👥 Members'   },
  { to: '/issues',    label: '📤 Issues'    },
  { to: '/fines',     label: '💰 Fines'     },
  { to: '/authors',   label: '✍ Authors', adminOnly: true },
  { to: '/employees', label: '🏢 Employees', adminOnly: true },
];

export default function Sidebar() {
  const { employee, logout, hasRole, isMember } = useAuth();
  const visibleItems = navItems.filter((item) => {
    if (item.to === '/members' && isMember) return false;
    if (item.to === '/fines' && isMember) return false;
    if (item.adminOnly && !hasRole('Admin')) return false;
    return true;
  });

  return (
    <aside style={{ width: 240, background: 'var(--brown)', color: 'var(--parchment)', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' }}>
      <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid rgba(200,169,126,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-serif)' }}>📖 LMS</div>
        <div style={{ fontSize: 12, color: 'var(--tan)', marginTop: 4 }}>{employee?.name}</div>
        <span style={{ fontSize: 11, background: 'var(--rust)', borderRadius: 4, padding: '1px 6px' }}>{employee?.role}</span>
      </div>

      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {visibleItems.map(item => {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.6rem 1.25rem',
                color: isActive ? 'var(--parchment)' : 'var(--tan)',
                background: isActive ? 'rgba(200,169,126,0.12)' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
                borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={logout}
        style={{ margin: '0 1.25rem', padding: '0.55rem', background: 'var(--sienna)', color: 'var(--parchment)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
      >
        Sign out
      </button>
    </aside>
  );
}

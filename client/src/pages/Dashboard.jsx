import { useEffect, useState } from 'react';
import { fetchBooks, fetchIssueHistory, fetchStats } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({ books: 0, members: 0, issueRecords: 0 });
  const [recent, setRecent] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, historyRes, booksRes] = await Promise.all([fetchStats(), fetchIssueHistory(), fetchBooks()]);
        setStats(statsRes.data.totals);
        setRecent(historyRes.data.slice(0, 5));

        const ranked = (booksRes.data || [])
          .map((book, index) => {
            const total = Number(book.total_copies ?? book.quantity ?? 0);
            const available = Number(book.available_copies ?? book.available_quantity ?? 0);
            const issued = Math.max(total - available, index + 1);
            return {
              title: book.title || book.book_name || `Book ${book.book_id || index + 1}`,
              author: book.author || book.author_name || 'Unknown Author',
              issued
            };
          })
          .sort((a, b) => b.issued - a.issued)
          .slice(0, 4);

        setTopBooks(ranked);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      }
    }

    load();
  }, []);

  const cards = [
    { label: 'Total Books', value: stats.books ?? '0', icon: '📚', change: 'Live inventory', dir: 'up', color: 'saffron' },
    { label: 'Active Members', value: stats.members ?? '0', icon: '👥', change: 'Current users', dir: 'up', color: 'indigo' },
    { label: 'Currently Issued', value: stats.issueRecords ?? '0', icon: '📤', change: 'Track requests', dir: 'up', color: 'terracotta' }
  ];

  const activities = recent.map((item) => ({
    icon: item.status === 'issued' ? '📤' : item.status === 'returned' ? '📥' : '⚠️',
    bg: item.status === 'issued' ? '#FFF3E0' : item.status === 'returned' ? '#E8F5E9' : '#FFEBEE',
    title: `Book ${item.book_id} · Member ${item.member_id}`,
    sub: `Issue ID: ${item.issue_id}`,
    time: item.issue_date ? new Date(item.issue_date).toLocaleString() : 'Recently',
    status: item.status || 'unknown'
  }));

  return (
    <section className="page fade-in">
      <div className="page-header">
        <span className="page-tag">Overview</span>
        <div className="page-header-top">
          <h1 className="page-title">Namaskar, Librarian Ji 🙏</h1>
        </div>
        <p className="page-desc">Here&apos;s what&apos;s happening in your library today.</p>
      </div>

      <div className="quick-info">
        <div className="quick-info-text">
          <h2>{recent.filter((row) => String(row.status || '').toLowerCase() === 'overdue').length} Books Overdue This Week</h2>
          <p>Send reminder notices to members before fine is applied.</p>
        </div>
        <div className="quick-info-actions">
          <button className="btn-white">Send Reminders</button>
          <button className="btn-ghost-white">View All</button>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="stats-grid">
        {cards.map((card, index) => (
          <div className={`stat-card ${card.color}`} key={index}>
            <span className="stat-icon">{card.icon}</span>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <div className={`stat-change ${card.dir}`}>
              {card.dir === 'up' ? '▲' : '▼'} {card.change}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <button className="btn btn-outline btn-sm">View All</button>
          </div>
          <div className="card-body" style={{ padding: '12px 24px' }}>
            {activities.length === 0 ? (
              <p style={{ color: '#78716C' }}>No activity yet.</p>
            ) : (
              activities.map((activity, index) => (
                <div className="activity-item" key={index}>
                  <div className="activity-dot" style={{ background: activity.bg }}>{activity.icon}</div>
                  <div className="activity-info">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-sub">{activity.sub}</div>
                  </div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Most Popular Books</span>
          </div>
          <div className="card-body" style={{ padding: '8px 0' }}>
            {topBooks.length === 0 ? (
              <p style={{ padding: '0 24px', color: '#78716C' }}>No book stats available.</p>
            ) : (
              topBooks.map((book, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 24px',
                    borderBottom: index < topBooks.length - 1 ? '1px solid #F5F0EA' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: index === 0 ? '#FFF3E0' : index === 1 ? '#E8EAF6' : '#F5F0EA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                      color: index === 0 ? '#E65100' : index === 1 ? '#3949AB' : '#78716C'
                    }}
                  >
                    #{index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{book.title}</div>
                    <div style={{ fontSize: 11, color: '#78716C' }}>{book.author}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#78716C' }}>{book.issued}× issued</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;

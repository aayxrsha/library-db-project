import React, { useState, useEffect } from 'react';
import { getBooks, getMembers, getIssues } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBooks: '-', totalMembers: '-',
    activeIssues: '-', overdueCount: '-'
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [booksRes, membersRes, issuesRes] = await Promise.allSettled([
          getBooks(), getMembers(), getIssues()
        ]);

        const books = booksRes.status === 'fulfilled' ? booksRes.value.data : [];
        const members = membersRes.status === 'fulfilled' ? membersRes.value.data : [];
        const issues = issuesRes.status === 'fulfilled' ? issuesRes.value.data : [];

        const active = issues.filter((i) => !i.return_date);
        const overdue = active.filter((i) => {
          const diff = (Date.now() - new Date(i.issue_date)) / 86400000;
          return diff > 14;
        });

        setStats({
          totalBooks: books.length,
          totalMembers: members.length,
          activeIssues: active.length,
          overdueCount: overdue.length
        });

        setRecentIssues(issues.slice(-5).reverse());
      } catch (_) {}
      setLoading(false);
    };

    fetchAll();
  }, []);

  const statCards = [
    { value: stats.totalBooks, label: 'Total Books', trend: 'In catalogue' },
    { value: stats.totalMembers, label: 'Members', trend: 'Registered' },
    { value: stats.activeIssues, label: 'Active Issues', trend: 'Currently out' },
    { value: stats.overdueCount, label: 'Overdue', trend: 'Past 14 days', accent: true }
  ];

  return (
    <main className="main-content">
      <div className="page-header">
        <h2>Good day, Librarian</h2>
        <p>Here's your collection at a glance</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '3rem' }}>
        {statCards.map((s, i) => (
          <div
            className="stat-card"
            key={i}
            style={s.accent && s.value > 0 ? { borderColor: 'rgba(224,112,80,0.4)' } : {}}
          >
            <div
              className="stat-value"
              style={s.accent && s.value > 0 ? { color: '#e07050' } : {}}
            >
              {loading ? '.' : s.value}
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-trend">{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="ornament"><span>*</span></div>

      <h3 style={{ color: 'var(--ink-soft)', marginBottom: '1.2rem' }}>Recent Transactions</h3>

      <div className="table-wrapper">
        {recentIssues.length === 0 && !loading ? (
          <div className="empty-state">
            <span className="empty-icon">List</span>
            <p>No recent transactions found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Book ID</th>
                <th>Member ID</th>
                <th>Issue Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)' }}>Loading...</td></tr>
              ) : (
                recentIssues.map((issue, i) => {
                  const days = (Date.now() - new Date(issue.issue_date)) / 86400000;
                  const status = issue.return_date
                    ? 'returned'
                    : days > 14 ? 'overdue' : 'issued';
                  return (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        #{issue.issue_id || issue.id}
                      </td>
                      <td>{issue.book_id}</td>
                      <td>{issue.member_id}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {new Date(issue.issue_date).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge badge-${status === 'returned' ? 'available' : status}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '3rem', padding: '1.5rem 2rem', background: 'var(--accent-strong)', borderRadius: '12px', border: '1px solid rgba(200,180,154,0.1)' }}>
        <span className="card-label">Quick Access</span>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/issue" className="btn btn-primary">Issue Book</a>
          <a href="/return" className="btn btn-outline">Return Book</a>
          <a href="/books" className="btn btn-outline">View Catalogue</a>
        </div>
      </div>
    </main>
  );
}

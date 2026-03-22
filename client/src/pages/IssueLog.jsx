import React, { useState, useEffect } from 'react';
import { getIssues } from '../services/api';

export default function IssueLog() {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getIssues()
      .then((r) => setIssues(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getDays = (issue) => Math.floor((Date.now() - new Date(issue.issue_date)) / 86400000);
  const getStatus = (issue) => {
    if (issue.return_date) return 'returned';
    if (getDays(issue) > 14) return 'overdue';
    return 'issued';
  };

  const filtered = issues
    .filter((i) => filter === 'all' || getStatus(i) === filter)
    .filter((i) =>
      String(i.book_id).includes(search) ||
      String(i.member_id).includes(search) ||
      String(i.issue_id || i.id).includes(search)
    );

  const counts = {
    all: issues.length,
    issued: issues.filter((i) => getStatus(i) === 'issued').length,
    returned: issues.filter((i) => getStatus(i) === 'returned').length,
    overdue: issues.filter((i) => getStatus(i) === 'overdue').length
  };

  return (
    <main className="main-content">
      <div className="page-header">
        <h2>Issue Log</h2>
        <p>Complete history of all transactions</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`btn ${filter === key ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 1.2rem', fontSize: '0.68rem' }}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
            <span style={{ marginLeft: '0.5rem', background: filter === key ? 'rgba(0,0,0,0.2)' : 'rgba(200,180,154,0.1)', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.62rem' }}>
              {count}
            </span>
          </button>
        ))}

        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <span>⌕</span>
          <input
            placeholder="Search by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state"><p>Loading records...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">===</span>
            <p>No records found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Book ID</th>
                <th>Member ID</th>
                <th>Issued On</th>
                <th>Returned On</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue, i) => {
                const status = getStatus(issue);
                const days = getDays(issue);
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-strong)' }}>
                      #{issue.issue_id || issue.id}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{issue.book_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{issue.member_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {new Date(issue.issue_date).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {issue.return_date
                        ? new Date(issue.return_date).toLocaleDateString('en-IN')
                        : <span style={{ color: 'var(--ink-soft)' }}>-</span>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: !issue.return_date && days > 14 ? '#e07050' : 'var(--ink-soft)' }}>
                      {days}
                    </td>
                    <td>
                      <span className={`badge badge-${status === 'returned' ? 'available' : status}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.1em' }}>
          Showing {filtered.length} of {issues.length} records
        </div>
      )}
    </main>
  );
}

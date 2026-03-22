import React, { useState, useEffect } from 'react';
import { returnBook, getIssues } from '../services/api';
import Alert from '../components/Alert';

export default function ReturnBook() {
  const [issueId, setIssueId] = useState('');
  const [issues, setIssues] = useState([]);
  const [alert, setAlert] = useState({ type: 'success', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getIssues()
      .then((r) => setIssues(r.data.filter((i) => !i.return_date)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueId) return;

    setLoading(true);
    try {
      await returnBook({ issue_id: issueId });
      setAlert({ type: 'success', message: `Issue #${issueId} returned successfully.` });
      setIssues((prev) => prev.filter((i) => String(i.issue_id || i.id) !== String(issueId)));
      setIssueId('');
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to process return.' });
    }
    setLoading(false);
  };

  const selectedIssue = issues.find((i) => String(i.issue_id || i.id) === String(issueId));

  const getDaysSince = (date) => {
    return Math.floor((Date.now() - new Date(date)) / 86400000);
  };

  return (
    <main className="main-content">
      <div className="page-header">
        <h2>Return a Book</h2>
        <p>Process a book return by issue ID</p>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ ...alert, message: '' })}
      />

      <div className="grid-2" style={{ gap: '2rem' }}>
        <div>
          <div className="card">
            <span className="card-label">Return Details</span>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Issue *</label>
                <select
                  className="form-input"
                  value={issueId}
                  onChange={(e) => setIssueId(e.target.value)}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">- Choose an active issue -</option>
                  {issues.map((issue, i) => {
                    const days = getDaysSince(issue.issue_date);
                    return (
                      <option key={i} value={issue.issue_id || issue.id}>
                        #{issue.issue_id || issue.id} - Book {issue.book_id} / Member {issue.member_id} ({days}d)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Or Enter Issue ID directly</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Enter issue ID manually"
                  value={issueId}
                  onChange={(e) => setIssueId(e.target.value)}
                />
              </div>

              <div className="ornament"><span>o</span></div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !issueId}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Processing...' : 'Process Return'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedIssue ? (
            <div className="card" style={{ borderColor: 'rgba(200,155,78,0.3)' }}>
              <span className="card-label">Issue Details</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {[
                  ['Issue ID', `#${selectedIssue.issue_id || selectedIssue.id}`],
                  ['Book ID', selectedIssue.book_id],
                  ['Member ID', selectedIssue.member_id],
                  ['Issued On', new Date(selectedIssue.issue_date).toLocaleDateString('en-IN')],
                  ['Days Out', `${getDaysSince(selectedIssue.issue_date)} days`]
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(200,180,154,0.08)', paddingBottom: '0.6rem' }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: label === 'Days Out' && getDaysSince(selectedIssue.issue_date) > 14 ? '#e07050' : 'var(--ink)' }}>
                      {val}
                    </span>
                  </div>
                ))}

                {getDaysSince(selectedIssue.issue_date) > 14 && (
                  <div
                    style={{ background: 'rgba(224,112,80,0.1)', border: '1px solid rgba(224,112,80,0.3)', borderRadius: '12px', padding: '0.8rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#e07050' }}
                  >
                    Overdue by {getDaysSince(selectedIssue.issue_date) - 14} day(s). Fine may apply.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ borderStyle: 'dashed', opacity: 0.5 }}>
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <span className="empty-icon">&lt;-</span>
                <p>Select an issue to view details here</p>
              </div>
            </div>
          )}

          <div className="card">
            <span className="card-label">Active Issues</span>
            {issues.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                No active issues found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {issues.slice(0, 6).map((issue, i) => {
                  const days = getDaysSince(issue.issue_date);
                  return (
                    <div
                      key={i}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderRadius: '12px', cursor: 'pointer', background: String(issue.issue_id || issue.id) === String(issueId) ? 'rgba(200,155,78,0.1)' : 'transparent', transition: 'background 0.2s' }}
                      onClick={() => setIssueId(String(issue.issue_id || issue.id))}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-strong)' }}>
                        #{issue.issue_id || issue.id}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)' }}>
                        Book {issue.book_id}
                      </span>
                      <span className={`badge ${days > 14 ? 'badge-overdue' : 'badge-issued'}`}>
                        {days}d
                      </span>
                    </div>
                  );
                })}
                {issues.length > 6 && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--ink-soft)', marginTop: '0.5rem' }}>
                    +{issues.length - 6} more active issues
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

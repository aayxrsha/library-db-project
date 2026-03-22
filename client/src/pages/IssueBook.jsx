import { useState } from 'react';
import { getStoredAuth, issueBook } from '../services/api';

const RECENT_ISSUES = [
  { book: 'Wings of Fire', member: 'Ramesh Kumar', id: 'M-1042', date: 'Today, 10:32 AM' },
  { book: 'Godan', member: 'Sunita Devi', id: 'M-0762', date: 'Today, 9:14 AM' },
  { book: 'The White Tiger', member: 'Arvind Singh', id: 'M-0334', date: 'Yesterday' }
];

function IssueBook() {
  const auth = getStoredAuth();
  const defaultEmployee = auth?.user?.user_id || '';
  const [bookId, setBookId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14);
  const defaultDueStr = defaultDue.toISOString().split('T')[0];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!bookId || !memberId) {
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await issueBook({
        book_id: Number(bookId),
        member_id: Number(memberId),
        employee_id: Number(defaultEmployee || 1)
      });

      setStatus({ type: 'success', msg: `Book ${bookId} successfully issued to Member ${memberId}.` });
      setBookId('');
      setMemberId('');
      setDueDate('');
    } catch (err) {
      setStatus({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to issue book. Please check the IDs and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page slide-up">
      <div className="page-header">
        <span className="page-tag">Transaction</span>
        <h1 className="page-title">Issue a Book 📤</h1>
        <p className="page-desc">Lend a book to a registered library member.</p>
      </div>

      <div className="issue-layout">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Issue Details</span>
            <span style={{ fontSize: 12, color: '#78716C' }}>Default: 14-day lending</span>
          </div>
          <div className="card-body">
            {status && (
              <div className={`alert alert-${status.type}`}>
                <span>{status.type === 'success' ? '✅' : '❌'}</span>
                {status.msg}
              </div>
            )}

            {status?.type === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="success-icon">✅</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  Book Issued Successfully!
                </div>
                <div style={{ fontSize: 14, color: '#78716C', marginBottom: 24 }}>
                  Print the issue slip for the member&apos;s record.
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={() => setStatus(null)}>Issue Another</button>
                  <button className="btn btn-outline">🖨 Print Slip</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Book ID *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. B-001"
                      value={bookId}
                      onChange={(event) => setBookId(event.target.value)}
                      required
                    />
                    <span className="form-hint">Enter the book&apos;s catalogue ID</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Member ID *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. M-1042"
                      value={memberId}
                      onChange={(event) => setMemberId(event.target.value)}
                      required
                    />
                    <span className="form-hint">Member&apos;s registered library ID</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Issue Date</label>
                    <input
                      className="form-input"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={dueDate || defaultDueStr}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">Notes (Optional)</label>
                    <input className="form-input" placeholder="Any special remarks..." />
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <><span className="spinner" /> Processing...</> : '📤 Issue Book'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setBookId(''); setMemberId(''); }}>
                    Clear
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recently Issued</span>
            </div>
            <div className="card-body" style={{ padding: '8px 0' }}>
              {RECENT_ISSUES.map((recent, index) => (
                <div
                  key={index}
                  style={{
                    padding: '14px 24px',
                    borderBottom: index < RECENT_ISSUES.length - 1 ? '1px solid #F5F0EA' : 'none'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{recent.book}</div>
                  <div style={{ fontSize: 12, color: '#78716C' }}>
                    {recent.member} · {recent.id}
                  </div>
                  <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 3 }}>{recent.date}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 18, background: '#FFF8F0', border: '1px solid #FFE0B2', borderRadius: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#E65100', marginBottom: 6 }}>
              📋 Lending Policy
            </div>
            <ul style={{ fontSize: 12, color: '#78716C', paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Standard lending period: <strong>14 days</strong></li>
              <li>Maximum books per member: <strong>3</strong></li>
              <li>Fine for overdue: <strong>₹2 per day</strong></li>
              <li>Lost book charge: <strong>2× book price</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default IssueBook;

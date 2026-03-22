import React, { useState, useEffect } from 'react';
import { issueBook, getBooks, getMembers, getStoredAuth } from '../services/api';
import Alert from '../components/Alert';

function getMemberName(member) {
  return member?.name || member?.full_name || member?.member_name || 'Member';
}

export default function IssueBook() {
  const [bookId, setBookId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [alert, setAlert] = useState({ type: 'success', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBooks().then((r) => setBooks(r.data)).catch(() => {});
    getMembers().then((r) => setMembers(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookId || !memberId) return;

    const auth = getStoredAuth();
    const employeeId = Number(auth?.user?.user_id || 1);

    setLoading(true);
    try {
      await issueBook({ book_id: Number(bookId), member_id: Number(memberId), employee_id: employeeId });
      const book = books.find((b) => String(b.book_id || b.id) === String(bookId));
      const member = members.find((m) => String(m.member_id || m.id) === String(memberId));
      setAlert({
        type: 'success',
        message: `"${book?.title || 'Book'}" issued to ${getMemberName(member)} successfully.`
      });
      setBookId('');
      setMemberId('');
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to issue book. Please check availability.' });
    }
    setLoading(false);
  };

  const selectedBook = books.find((b) => String(b.book_id || b.id) === String(bookId));
  const selectedMember = members.find((m) => String(m.member_id || m.id) === String(memberId));

  return (
    <main className="main-content">
      <div className="page-header">
        <h2>Issue a Book</h2>
        <p>Lend a book from the catalogue to a member</p>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ ...alert, message: '' })}
      />

      <div className="grid-2" style={{ gap: '2rem' }}>
        <div>
          <div className="card">
            <span className="card-label">Issue Details</span>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Book *</label>
                <select
                  className="form-input"
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">- Choose a book -</option>
                  {books.map((b, i) => (
                    <option
                      key={i}
                      value={b.book_id || b.id}
                      disabled={(b.copies || b.available_copies || 0) <= 0}
                    >
                      {b.title} - {b.author}
                      {(b.copies || b.available_copies || 0) <= 0 ? ' (Unavailable)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Member *</label>
                <select
                  className="form-input"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">- Choose a member -</option>
                  {members.map((m, i) => (
                    <option key={i} value={m.member_id || m.id}>{getMemberName(m)}</option>
                  ))}
                </select>
              </div>

              <div className="ornament"><span>o</span></div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !bookId || !memberId}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Processing...' : 'Issue Book'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedBook && (
            <div className="card" style={{ borderColor: 'rgba(200,155,78,0.3)' }}>
              <span className="card-label">Selected Book</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 300, fontStyle: 'italic', color: 'var(--accent-strong)', marginBottom: '0.4rem' }}>
                {selectedBook.title}
              </h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.95rem' }}>{selectedBook.author}</p>
              {selectedBook.genre && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', background: 'rgba(200,180,154,0.08)', padding: '0.2rem 0.6rem', borderRadius: '999px', color: 'var(--ink-soft)', marginTop: '0.8rem', display: 'inline-block' }}>
                  {selectedBook.genre}
                </span>
              )}
              <div style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>
                Copies available: <strong style={{ color: 'var(--accent-strong)' }}>
                  {selectedBook.copies ?? selectedBook.available_copies ?? '-'}
                </strong>
              </div>
            </div>
          )}

          {selectedMember && (
            <div className="card">
              <span className="card-label">Selected Member</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 400, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                {getMemberName(selectedMember)}
              </h3>
              {selectedMember.email && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                  {selectedMember.email}
                </p>
              )}
            </div>
          )}

          {!selectedBook && !selectedMember && (
            <div className="card" style={{ borderStyle: 'dashed', opacity: 0.5 }}>
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <span className="empty-icon">-&gt;</span>
                <p>Select a book and member to preview details here</p>
              </div>
            </div>
          )}

          <div className="card" style={{ background: 'rgba(200,155,78,0.05)' }}>
            <span className="card-label">Issue Policy</span>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Standard loan period: 14 days', 'Fine applies after due date', 'Maximum 3 books per member'].map((item, i) => (
                <li key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-soft)', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent)' }}>o</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

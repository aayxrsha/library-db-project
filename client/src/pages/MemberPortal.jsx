import { useEffect, useState } from 'react';
import {
  createMemberRequest,
  fetchMemberBooks,
  fetchMyFines,
  fetchMyRequests
} from '../services/api';

function normalizeBook(row, index) {
  const total = Number(row.total_copies ?? row.quantity ?? row.copies ?? 1);
  const available = Number(row.available_copies ?? row.available_quantity ?? row.available ?? total);
  const status = available <= 0 ? 'issued' : 'available';

  return {
    id: String(row.book_id || row.id || `B-${index + 1}`),
    title: row.title || row.book_name || `Book ${index + 1}`,
    author: row.author || row.author_name || 'Unknown Author',
    category: row.category || row.genre || 'General',
    copies: total,
    available,
    status
  };
}

function MemberPortal() {
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [fines, setFines] = useState([]);
  const [form, setForm] = useState({ book_id: '', notes: '' });
  const [bookFilter, setBookFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [booksRes, requestsRes, finesRes] = await Promise.all([
        fetchMemberBooks(),
        fetchMyRequests(),
        fetchMyFines()
      ]);
      setBooks((booksRes.data || []).map(normalizeBook));
      setRequests(requestsRes.data);
      setFines(finesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load member portal');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await createMemberRequest({
        book_id: Number(form.book_id),
        notes: form.notes
      });
      setMessage('Request submitted to librarian');
      setForm({ book_id: '', notes: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Request submission failed');
    }
  };

  const requestFromCard = async (bookId) => {
    setError('');
    setMessage('');

    try {
      await createMemberRequest({ book_id: Number(bookId), notes: 'Requested from catalogue view' });
      setMessage(`Request submitted for Book ${bookId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Request submission failed');
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchStatus = bookFilter === 'all' || book.status === bookFilter;
    const q = search.toLowerCase();
    const matchSearch =
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.id.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = requests.filter((item) => item.status === 'pending').length;
  const issuedCount = requests.filter((item) => item.status === 'issued' || item.status === 'approved').length;
  const unpaidFines = fines.filter((item) => String(item.status || '').toLowerCase() !== 'paid').length;

  return (
    <section className="page fade-in">
      <div className="page-header">
        <span className="page-tag">Member Zone</span>
        <div className="page-header-top">
          <h1 className="page-title">Member Portal</h1>
          <button className="btn btn-outline" onClick={load}>Refresh</button>
        </div>
        <p className="page-desc">Browse books, request issue, and track your fines.</p>
      </div>

      <div className="quick-info">
        <div className="quick-info-text">
          <h2>{pendingCount} Requests Pending</h2>
          <p>{issuedCount} requests processed · {unpaidFines} unpaid fine entries</p>
        </div>
        <div className="quick-info-actions">
          <button className="btn-white" onClick={() => setBookFilter('available')}>Available Books</button>
          <button className="btn-ghost-white" onClick={() => setBookFilter('all')}>All Books</button>
        </div>
      </div>

      {message && <p className="ok-banner">{message}</p>}
      {error && <p className="error-banner">{error}</p>}

      <div className="portal-grid">
        <div className="stack-gap">
          <div className="filter-row">
            <div className="filter-tabs">
              {['all', 'available', 'issued'].map((tab) => (
                <button
                  key={tab}
                  className={`filter-tab ${bookFilter === tab ? 'active' : ''}`}
                  onClick={() => setBookFilter(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Search books, authors, IDs..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="books-grid">
            {filteredBooks.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <span className="empty-state-icon">📭</span>
                <h3>No books found</h3>
                <p>Try changing your filter or search.</p>
              </div>
            ) : (
              filteredBooks.map((book, index) => (
                <div className="book-card" key={book.id}>
                  <div className="book-cover" style={{ background: ['#FFF3E0', '#E8EAF6', '#E8F5E9', '#FBE9E7'][index % 4] }}>
                    {['📚', '🔥', '🇮🇳', '🌾', '🏹'][index % 5]}
                  </div>
                  <div className="book-card-body">
                    <div className="book-title">{book.title}</div>
                    <div className="book-author">{book.author}</div>
                    <div className="book-meta">
                      <span className="book-category">{book.category}</span>
                      <span className={`badge ${book.status === 'available' ? 'badge-available' : 'badge-issued'}`}>
                        {book.status}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#78716C' }}>
                      Available: {book.available} · ID: {book.id}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 8 }}
                      onClick={() => requestFromCard(book.id)}
                      disabled={book.available <= 0}
                    >
                      Request Issue
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick Request</span>
          </div>
          <div className="card-body">
            <form className="form-card" onSubmit={handleSubmit}>
              <label htmlFor="book_id">Book ID</label>
              <input
                id="book_id"
                value={form.book_id}
                onChange={(event) => setForm((prev) => ({ ...prev, book_id: event.target.value }))}
                required
              />

              <label htmlFor="notes">Notes (optional)</label>
              <input
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />

              <button className="btn btn-primary" type="submit">Submit Request</button>
            </form>
          </div>
        </div>
      </div>

      <h3 className="section-title">My Requests</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Book ID</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Reviewed By</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="5">No requests yet.</td>
              </tr>
            ) : (
              requests.map((item) => (
                <tr key={item.request_id}>
                  <td>{item.request_id}</td>
                  <td>{item.book_id}</td>
                  <td>
                    <span className={`badge ${item.status === 'pending' ? 'badge-issued' : 'badge-available'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{new Date(item.requested_at).toLocaleString()}</td>
                  <td>{item.reviewed_by_name || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">My Fines</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fine ID</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {fines.length === 0 ? (
              <tr>
                <td colSpan="5">No fines.</td>
              </tr>
            ) : (
              fines.map((fine) => (
                <tr key={fine.fine_id}>
                  <td>{fine.fine_id}</td>
                  <td>{fine.amount}</td>
                  <td>{fine.reason || '-'}</td>
                  <td>{fine.status}</td>
                  <td>{new Date(fine.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MemberPortal;

import React, { useState, useEffect } from 'react';
import { getBooks, addBook, deleteBook } from '../services/api';
import Alert from '../components/Alert';

const emptyForm = { title: '', author: '', genre: '', published_year: '', copies: 1 };

export default function Books() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [alert, setAlert] = useState({ type: 'success', message: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await getBooks();
      setBooks(res.data);
    } catch (_) {
      setAlert({ type: 'error', message: 'Failed to load books.' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addBook(form);
      setAlert({ type: 'success', message: `"${form.title}" added to catalogue.` });
      setForm(emptyForm);
      setShowForm(false);
      fetchBooks();
    } catch (_) {
      setAlert({ type: 'error', message: 'Failed to add book.' });
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}" from catalogue?`)) return;
    try {
      await deleteBook(id);
      setAlert({ type: 'success', message: `"${title}" removed.` });
      fetchBooks();
    } catch (_) {
      setAlert({ type: 'error', message: 'Failed to remove book.' });
    }
  };

  const filtered = books.filter((b) =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.genre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="main-content">
      <div className="page-header">
        <h2>Book Catalogue</h2>
        <p>Manage the library's collection</p>
      </div>

      <Alert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ ...alert, message: '' })}
      />

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <span>⌕</span>
          <input
            placeholder="Search by title, author, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'X Close' : '+ Add Book'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <span className="card-label">New Book Entry</span>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter book title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Author *</label>
                <input
                  className="form-input"
                  required
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Genre</label>
                <input
                  className="form-input"
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  placeholder="e.g. Fiction, Science, History"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Published Year</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.published_year}
                  onChange={(e) => setForm({ ...form, published_year: e.target.value })}
                  placeholder="e.g. 2021"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Copies Available</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={form.copies}
                  onChange={(e) => setForm({ ...form, copies: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Add to Catalogue</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state"><p>Loading catalogue...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">[]</span>
            <p>{search ? 'No books match your search' : 'No books in catalogue yet'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>Year</th>
                <th>Copies</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>#{book.book_id || book.id}</td>
                  <td style={{ fontWeight: 400, color: 'var(--ink)' }}>{book.title}</td>
                  <td style={{ fontStyle: 'italic' }}>{book.author}</td>
                  <td>
                    {book.genre && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          background: 'rgba(200,180,154,0.08)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          color: 'var(--ink-soft)'
                        }}
                      >
                        {book.genre}
                      </span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{book.published_year}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{book.copies ?? book.available_copies ?? '-'}</td>
                  <td>
                    <span className={`badge ${(book.copies || book.available_copies) > 0 ? 'badge-available' : 'badge-issued'}`}>
                      {(book.copies || book.available_copies) > 0 ? 'Available' : 'All Issued'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.65rem' }}
                      onClick={() => handleDelete(book.book_id || book.id, book.title)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.1em' }}>
          Showing {filtered.length} of {books.length} books
        </div>
      )}
    </main>
  );
}

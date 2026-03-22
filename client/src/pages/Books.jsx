import { useEffect, useState } from 'react';
import { fetchBooks } from '../services/api';

const STATUS_CLASS = {
  available: 'badge-available',
  issued: 'badge-issued',
  overdue: 'badge-overdue'
};

const COVER_COLORS = ['#FFF3E0', '#E8EAF6', '#E8F5E9', '#FBE9E7', '#F3E5F5', '#E0F2F1', '#FFF8E1', '#FCE4EC'];

function inferStatus(row) {
  const explicit = String(row.status || row.book_status || '').toLowerCase();
  if (['available', 'issued', 'overdue'].includes(explicit)) {
    return explicit;
  }

  const available = Number(row.available_copies ?? row.available_quantity ?? row.available ?? 0);
  if (available <= 0) {
    return 'issued';
  }

  return 'available';
}

function getBookTitle(row) {
  return row.title || row.book_name || row.name || `Book ${row.book_id ?? row.id ?? ''}`;
}

function getBookAuthor(row) {
  return row.author || row.author_name || 'Unknown Author';
}

function getBookCategory(row) {
  return row.category || row.genre || 'General';
}

function Books() {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchBooks();
        const normalized = (res.data || []).map((row, index) => ({
          raw: row,
          id: String(row.book_id || row.id || `B-${index + 1}`),
          title: getBookTitle(row),
          author: getBookAuthor(row),
          category: getBookCategory(row),
          status: inferStatus(row),
          copies: Number(row.total_copies ?? row.quantity ?? row.copies ?? 1),
          cover: COVER_COLORS[index % COVER_COLORS.length],
          emoji: ['📚', '🔥', '🇮🇳', '🌾', '🏘️', '🚂', '⚖️', '🐯', '📜'][index % 9]
        }));

        setBooks(normalized);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load books');
      }
    }

    load();
  }, []);

  const filtered = books.filter((book) => {
    const matchStatus = filter === 'all' || book.status === filter;
    const q = search.toLowerCase();
    const matchSearch = book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <section className="page slide-up">
      <div className="page-header">
        <span className="page-tag">Library</span>
        <div className="page-header-top">
          <h1 className="page-title">Book Catalogue</h1>
          <button className="btn btn-primary">+ Add Book</button>
        </div>
        <p className="page-desc">Browse and manage the complete library collection.</p>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="filter-row">
        <div className="filter-tabs">
          {['all', 'available', 'issued', 'overdue'].map((t) => (
            <button
              key={t}
              className={`filter-tab ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'overdue' && <span style={{ marginLeft: 4, color: '#C62828' }}>⚠</span>}
            </button>
          ))}
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search books, authors..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="books-grid">
        {filtered.map((book) => (
          <div className="book-card" key={book.id}>
            <div className="book-cover" style={{ background: book.cover }}>
              {book.emoji}
            </div>
            <div className="book-card-body">
              <div className="book-title">{book.title}</div>
              <div className="book-author">{book.author}</div>
              <div className="book-meta">
                <span className="book-category">{book.category}</span>
                <span className={`badge ${STATUS_CLASS[book.status] || 'badge-available'}`}>
                  {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                </span>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#78716C' }}>
                {book.copies} cop{book.copies > 1 ? 'ies' : 'y'} · ID: {book.id}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📭</span>
          <h3>No books found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
      )}
    </section>
  );
}

export default Books;

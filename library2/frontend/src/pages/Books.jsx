import { useState, useEffect } from 'react';
import { bookService, authorService } from '../services/entityServices';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const GENRES = ['Fiction','Nonfiction','Sci_fi','Novel','Reference_book','Textbook'];

const emptyForm = { Name: '', Book_Des: '', Genre: 'Fiction', Book_Author: '', Publisher_Id: '', Collection_Id: '', Number_Of_Copies: 1 };

export default function Books() {
  const { hasRole }           = useAuth();
  const [books, setBooks]     = useState([]);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null); // null | 'add' | 'edit'
  const [authorModal, setAuthorModal] = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [authors, setAuthors] = useState([]);
  const [authorName, setAuthorName] = useState('');
  const [authorError, setAuthorError] = useState('');
  const [editId, setEditId]   = useState(null);
  const [error, setError]     = useState('');

  const canEdit = hasRole('Admin', 'Librarian');
  const isAdmin = hasRole('Admin');

  const load = async (q = '') => {
    const [booksRes, authorsRes] = await Promise.all([
      bookService.getAll(q),
      authorService.getAll(),
    ]);
    setBooks(booksRes.data);
    setAuthors(authorsRes.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    load(e.target.value);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal('add');
    setError('');
    setAuthorModal(false);
    setAuthorName('');
    setAuthorError('');
  };
  const openEdit = (b) => {
    setForm({
      Name: b.Name,
      Book_Des: b.Book_Des || '',
      Genre: b.Genre,
      Book_Author: b.Book_Author || '',
      Publisher_Id: b.Publisher_Id || '',
      Collection_Id: b.Collection_Id || '',
      Number_Of_Copies: Number.isFinite(Number(b.Number_Of_Copies)) ? Number(b.Number_Of_Copies) : 1,
      Available: b.Available,
    });
    setEditId(b.Book_Id);
    setModal('edit');
    setError('');
    setAuthorModal(false);
    setAuthorName('');
    setAuthorError('');
  };

  const handleSave = async () => {
    try {
      if (modal === 'add') await bookService.create(form);
      else                 await bookService.update(editId, form);
      setModal(null);
      load(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return;
    await bookService.remove(id);
    load(search);
  };

  const handleQuickCreateAuthor = async () => {
    if (!authorName.trim()) {
      setAuthorError('Author name is required');
      return;
    }

    try {
      setAuthorError('');
      const { data } = await authorService.create({ Author_Name: authorName.trim() });
      const newAuthor = { Author_Id: data.Author_Id, Author_Name: authorName.trim() };
      setAuthors((prev) => [...prev, newAuthor].sort((a, b) => a.Author_Name.localeCompare(b.Author_Name)));
      setForm((prev) => ({ ...prev, Book_Author: String(newAuthor.Author_Id) }));
      setAuthorName('');
      setAuthorModal(false);
    } catch (err) {
      setAuthorError(err.response?.data?.message || 'Failed to add author');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Books"
        subtitle="Search and maintain your library collection"
        actions={
          canEdit ? (
            <button onClick={openAdd} className="btn btn-primary">+ Add Book</button>
          ) : null
        }
      />

      <div className="page-body">
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-subtitle">Find</div>
          <div className="card-title">Search Books</div>
          <input
            className="field-input"
            placeholder="Search by title or description..."
            value={search}
            onChange={handleSearch}
            style={{ marginTop: 14, maxWidth: 360 }}
          />
        </div>

        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                {['ID','Title','Genre','Author','Copies','Available','Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.Book_Id}>
                  <td>{b.Book_Id}</td>
                  <td>{b.Name}</td>
                  <td>{b.Genre}</td>
                  <td>{b.Author_Name || '—'}</td>
                  <td>{Number.isFinite(Number(b.Number_Of_Copies)) ? Number(b.Number_Of_Copies) : '-'}</td>
                  <td>
                    <span className={`badge ${b.Available ? 'badge-paid' : 'badge-overdue'}`}>
                      {b.Available ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(b)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Edit</button>
                        <button onClick={() => handleDelete(b.Book_Id)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{modal === 'add' ? 'Add Book' : 'Edit Book'}</h3>
            {error && <div className="auth-error" style={{ marginTop: 0, marginBottom: 8 }}>{error}</div>}
            {[['Title','Name','text'],['Description','Book_Des','text'],['Publisher ID','Publisher_Id','number'],['Collection ID','Collection_Id','number'],['Number of Copies','Number_Of_Copies','number']].map(([label, key, type]) => (
              <div key={key}>
                <label className="field-label">{label}</label>
                <input className="field-input" type={type} min={key === 'Number_Of_Copies' ? 0 : undefined} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <label className="field-label">Author</label>
            <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr auto' : '1fr', gap: 8, alignItems: 'end' }}>
              <select
                className="field-input"
                value={form.Book_Author}
                onChange={(e) => setForm({ ...form, Book_Author: e.target.value })}
              >
                <option value="">Select author (optional)</option>
                {authors.map((author) => (
                  <option key={author.Author_Id} value={author.Author_Id}>
                    {author.Author_Id} - {author.Author_Name}
                  </option>
                ))}
              </select>
              {isAdmin && (
                <button type="button" className="btn btn-secondary" onClick={() => setAuthorModal(true)} style={{ height: 40 }}>
                  + Add Author
                </button>
              )}
            </div>
            <label className="field-label">Genre</label>
            <select className="field-input" value={form.Genre} onChange={e => setForm({ ...form, Genre: e.target.value })}>
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>

            <div className="modal-actions">
              <button onClick={handleSave} className="btn btn-primary">Save</button>
              <button onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {authorModal && (
        <div className="modal-overlay" onClick={() => setAuthorModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Author</h3>
            {authorError && <div className="auth-error" style={{ marginTop: 0, marginBottom: 8 }}>{authorError}</div>}
            <label className="field-label">Author Name</label>
            <input
              className="field-input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Enter author name"
            />
            <div className="modal-actions">
              <button onClick={handleQuickCreateAuthor} className="btn btn-primary">Save Author</button>
              <button onClick={() => setAuthorModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

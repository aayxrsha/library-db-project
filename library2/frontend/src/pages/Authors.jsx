import { useEffect, useState } from 'react';
import { authorService } from '../services/entityServices';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function Authors() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Admin');
  const [authors, setAuthors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    const { data } = await authorService.getAll();
    setAuthors(data);
  };

  useEffect(() => {
    load();
  }, []);

  if (!isAdmin) {
    return <div className="page-body">Only Admin can access Authors.</div>;
  }

  const handleCreate = async () => {
    if (!authorName.trim()) {
      setError('Author name is required');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const { data } = await authorService.create({ Author_Name: authorName.trim() });
      setSuccess(`Author added successfully. Author ID: ${data.Author_Id}`);
      setAuthorName('');
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add author');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this author?')) return;
    try {
      await authorService.remove(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete author');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalog Setup"
        title="Authors"
        subtitle="Add and manage authors used in book creation"
        actions={<button onClick={() => { setShowModal(true); setError(''); }} className="btn btn-primary">+ Add Author</button>}
      />

      <div className="page-body">
        {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}
        {success && <div className="auth-error" style={{ marginBottom: 12, background: '#e7f6e3', borderColor: '#97c28d', color: '#1e5630' }}>{success}</div>}

        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Author ID</th>
                <th>Author Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((author) => (
                <tr key={author.Author_Id}>
                  <td>{author.Author_Id}</td>
                  <td>{author.Author_Name}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleDelete(author.Author_Id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Author</h3>
            <label className="field-label">Author Name</label>
            <input className="field-input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />

            <div className="modal-actions">
              <button onClick={handleCreate} className="btn btn-primary">Save</button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

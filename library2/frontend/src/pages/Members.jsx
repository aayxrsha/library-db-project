import { useState, useEffect } from 'react';
import { memberService } from '../services/entityServices';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const TYPES   = ['Student','Teacher','NT_Staff'];
const emptyForm = { Mem_Name: '', Member_Type: 'Student', Contact: '', Email: '', password: '' };

export default function Members() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Admin');
  const [members, setMembers] = useState([]);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(emptyForm);
  const [editId,  setEditId]  = useState(null);
  const [error,   setError]   = useState('');

  const load = async () => { const { data } = await memberService.getAll(); setMembers(data); };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('add'); setError(''); };
  const openEdit = (m) => { setForm({ Mem_Name: m.Mem_Name, Member_Type: m.Member_Type, Contact: m.Contact, Email: m.Email || '', password: '' }); setEditId(m.Member_Id); setModal('edit'); setError(''); };

  const handleSave = async () => {
    try {
      if (modal === 'add') await memberService.create(form);
      else                 await memberService.update(editId, form);
      setModal(null); load();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this member?')) return;
    await memberService.remove(id); load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Members"
        subtitle="Manage library member records"
        actions={isAdmin ? <button onClick={openAdd} className="btn btn-primary">+ Add Member</button> : null}
      />

      <div className="page-body">
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                {['ID','Name','Type','Email','Contact','Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.Member_Id}>
                  <td>{m.Member_Id}</td>
                  <td>{m.Mem_Name}</td>
                  <td>
                    <span className="badge badge-pending">{m.Member_Type}</span>
                  </td>
                  <td>{m.Email || '—'}</td>
                  <td>{m.Contact}</td>
                  <td>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(m)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Edit</button>
                        <button onClick={() => handleDelete(m.Member_Id)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Delete</button>
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
            <h3 className="modal-title">{modal === 'add' ? 'Add Member' : 'Edit Member'}</h3>
            {error && <div className="auth-error" style={{ marginTop: 0, marginBottom: 8 }}>{error}</div>}
            <label className="field-label">Name</label>
            <input className="field-input" value={form.Mem_Name} onChange={e => setForm({ ...form, Mem_Name: e.target.value })} />
            <label className="field-label">Type</label>
            <select className="field-input" value={form.Member_Type} onChange={e => setForm({ ...form, Member_Type: e.target.value })}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <label className="field-label">Contact</label>
            <input className="field-input" value={form.Contact} onChange={e => setForm({ ...form, Contact: e.target.value })} />
            <label className="field-label">Email</label>
            <input className="field-input" type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} />
            <label className="field-label">{modal === 'add' ? 'Password' : 'New Password (optional)'}</label>
            <input className="field-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <div className="modal-actions">
              <button onClick={handleSave} className="btn btn-primary">Save</button>
              <button onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

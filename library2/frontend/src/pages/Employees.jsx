import { useEffect, useState } from 'react';
import { employeeService } from '../services/entityServices';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

const ROLES = ['Clerk', 'Librarian', 'Admin'];
const emptyForm = {
  Employee_Name: '',
  Date_of_Join: '',
  Experience: 0,
  Role: 'Clerk',
  Lib_ID: 1,
  password: '',
};

export default function Employees() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = hasRole('Admin');

  const load = async () => {
    const { data } = await employeeService.getAll();
    setEmployees(data);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="page-body">Only Admin can access Employees.</div>;
  }

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setModal('add');
    setError('');
  };

  const openEdit = (employee) => {
    setForm({
      Employee_Name: employee.Employee_Name,
      Date_of_Join: employee.Date_of_Join?.slice(0, 10),
      Experience: employee.Experience || 0,
      Role: employee.Role,
      Lib_ID: employee.Lib_ID,
      password: '',
    });
    setEditId(employee.Employee_ID);
    setModal('edit');
    setError('');
  };

  const handleSave = async () => {
    try {
      if (modal === 'add') {
        await employeeService.create(form);
      } else {
        await employeeService.update(editId, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await employeeService.remove(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Employees"
        subtitle="Add, update, and remove employee accounts"
        actions={<button onClick={openAdd} className="btn btn-primary">+ Add Employee</button>}
      />

      <div className="page-body">
        {error && (
          <div className="auth-error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                {['ID', 'Name', 'Role', 'Join Date', 'Experience', 'Lib ID', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.Employee_ID}>
                  <td>{e.Employee_ID}</td>
                  <td>{e.Employee_Name}</td>
                  <td>{e.Role}</td>
                  <td>{e.Date_of_Join?.slice(0, 10)}</td>
                  <td>{e.Experience}</td>
                  <td>{e.Lib_ID}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(e)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Edit</button>
                      <button onClick={() => handleDelete(e.Employee_ID)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Delete</button>
                    </div>
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
            <h3 className="modal-title">{modal === 'add' ? 'Add Employee' : 'Edit Employee'}</h3>
            <label className="field-label">Name</label>
            <input className="field-input" value={form.Employee_Name} onChange={(ev) => setForm({ ...form, Employee_Name: ev.target.value })} />

            <label className="field-label">Role</label>
            <select className="field-input" value={form.Role} onChange={(ev) => setForm({ ...form, Role: ev.target.value })}>
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            <label className="field-label">Join Date</label>
            <input className="field-input" type="date" value={form.Date_of_Join} onChange={(ev) => setForm({ ...form, Date_of_Join: ev.target.value })} />

            <label className="field-label">Experience (years)</label>
            <input className="field-input" type="number" value={form.Experience} onChange={(ev) => setForm({ ...form, Experience: ev.target.value })} />

            <label className="field-label">Library ID</label>
            <input className="field-input" type="number" value={form.Lib_ID} onChange={(ev) => setForm({ ...form, Lib_ID: ev.target.value })} />

            <label className="field-label">{modal === 'add' ? 'Password' : 'New Password (optional)'}</label>
            <input className="field-input" type="password" value={form.password} onChange={(ev) => setForm({ ...form, password: ev.target.value })} />

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

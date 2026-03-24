import { useState, useEffect } from 'react';
import { fineService, issueService } from '../services/entityServices';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function Fines() {
  const { hasRole } = useAuth();
  const [fines, setFines] = useState([]);
  const [tab,   setTab]   = useState('all');
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ Issue_Id: '', Amount: '', Reason: '' });
  const [formError, setFormError] = useState('');

  const canManageFines = hasRole('Admin', 'Librarian', 'Clerk');

  const load = async () => {
    const fn = tab === 'unpaid' ? fineService.getUnpaid : fineService.getAll;
    const { data } = await fn();
    setFines(data);
  };

  const loadIssueOptions = async () => {
    const { data } = await issueService.getAll();
    const openIssues = (data || []).filter((issue) => !issue.Return_Date);
    setIssues(openIssues);
  };

  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    if (canManageFines) loadIssueOptions();
  }, [canManageFines]);

  const handlePay = async (id) => {
    await fineService.markPaid(id);
    load();
  };

  const handleAddFine = async () => {
    if (!form.Issue_Id) {
      setFormError('Please select an issue');
      return;
    }

    const amount = Number(form.Amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }

    if (!form.Reason.trim()) {
      setFormError('Please enter a reason for the fine');
      return;
    }

    try {
      setFormError('');
      await fineService.create({
        Issue_Id: Number(form.Issue_Id),
        Amount: amount,
        Reason: form.Reason.trim(),
      });
      setForm({ Issue_Id: '', Amount: '', Reason: '' });
      await Promise.all([load(), loadIssueOptions()]);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add fine');
    }
  };

  const total = fines.reduce((sum, f) => sum + parseFloat(f.Amount || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Payments"
        title="Fines"
        subtitle="Track and settle overdue and custom penalties"
        actions={<span className="badge badge-overdue">Total outstanding: ₹{total.toFixed(2)}</span>}
      />

      <div className="page-body">
        {canManageFines && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-subtitle">Librarian Action</div>
            <div className="card-title">Add Fine To Issued Book</div>
            {formError && <div className="auth-error" style={{ marginTop: 12, marginBottom: 8 }}>{formError}</div>}

            <label className="field-label">Issue</label>
            <select
              className="field-input"
              value={form.Issue_Id}
              onChange={(e) => setForm((prev) => ({ ...prev, Issue_Id: e.target.value }))}
              style={{ marginBottom: 8 }}
            >
              <option value="">Select issued book</option>
              {issues.map((issue) => (
                <option key={issue.Issue_Id} value={issue.Issue_Id}>
                  {issue.Issue_Id} - {issue.BookName} - {issue.Mem_Name}
                </option>
              ))}
            </select>

            <label className="field-label">Amount</label>
            <input
              className="field-input"
              type="number"
              min="0"
              step="0.01"
              value={form.Amount}
              onChange={(e) => setForm((prev) => ({ ...prev, Amount: e.target.value }))}
              placeholder="Enter fine amount"
              style={{ marginBottom: 8 }}
            />

            <label className="field-label">Reason</label>
            <input
              className="field-input"
              value={form.Reason}
              onChange={(e) => setForm((prev) => ({ ...prev, Reason: e.target.value }))}
              placeholder="e.g., Book damage, missing pages"
            />

            <div style={{ marginTop: 12 }}>
              <button onClick={handleAddFine} className="btn btn-primary">Add Fine</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          {['all','unpaid'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className="btn btn-secondary" style={{ textTransform: 'capitalize', background: tab === t ? 'rgba(75,46,26,0.16)' : undefined }}>{t}</button>
          ))}
        </div>

        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                {['Fine ID','Member','Book','Amount','Reason','Status','Action'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => (
                <tr key={f.Fine_Id}>
                  <td>{f.Fine_Id}</td>
                  <td>{f.Mem_Name}</td>
                  <td>{f.BookName}</td>
                  <td>₹{parseFloat(f.Amount).toFixed(2)}</td>
                  <td>{f.Reason}</td>
                  <td>
                    <span className={`badge ${f.Paid ? 'badge-paid' : 'badge-overdue'}`}>
                      {f.Paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    {!f.Paid && canManageFines && (
                      <button onClick={() => handlePay(f.Fine_Id)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

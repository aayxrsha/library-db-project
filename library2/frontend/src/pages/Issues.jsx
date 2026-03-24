import { useState, useEffect } from 'react';
import { issueService, bookService } from '../services/entityServices';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function Issues() {
  const { isMember, hasRole } = useAuth();
  const [issues,  setIssues]  = useState([]);
  const [requests, setRequests] = useState([]);
  const [books, setBooks] = useState([]);
  const [tab,     setTab]     = useState('all'); // 'all' | 'overdue'
  const [requestBookId, setRequestBookId] = useState('');
  const [form,    setForm]    = useState({ Book_Id: '', Member_Id: '', Due_Date: '' });
  const [modal,   setModal]   = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const [requestDueDates, setRequestDueDates] = useState({});

  const load = async () => {
    if (isMember) {
      const [requestRes, bookRes] = await Promise.all([
        issueService.getRequests(),
        bookService.getAll(),
      ]);
      setRequests(requestRes.data);
      setBooks(bookRes.data.filter((book) => book.Available));
      return;
    }

    const fn = tab === 'overdue' ? issueService.getOverdue : issueService.getAll;
    const requestStatus = hasRole('Admin', 'Librarian') ? 'Pending' : undefined;
    const [issuesRes, requestsRes] = await Promise.all([
      fn(),
      issueService.getRequests(requestStatus ? { status: requestStatus } : {}),
    ]);
    setIssues(issuesRes.data);
    setRequests(requestsRes.data);
  };

  useEffect(() => { load(); }, [tab, isMember]);

  const handleIssue = async () => {
    setError('');
    try {
      await issueService.create(form);
      setModal(false);
      setForm({ Book_Id: '', Member_Id: '', Due_Date: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue book');
    }
  };

  const handleRequestBook = async () => {
    if (!requestBookId) return;
    setError('');
    try {
      await issueService.requestBook(Number(requestBookId));
      setRequestBookId('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleApproveRequest = async (requestId) => {
    const Due_Date = requestDueDates[requestId];
    if (!Due_Date) {
      setError('Due date is required before approving a request');
      return;
    }
    setError('');
    try {
      await issueService.approveRequest(requestId, { Due_Date });
      const next = { ...requestDueDates };
      delete next[requestId];
      setRequestDueDates(next);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const note = prompt('Optional rejection reason:') || '';
    setError('');
    try {
      await issueService.rejectRequest(requestId, { Note: note });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleReturn = async (id) => {
    if (!confirm('Mark this book as returned?')) return;
    const { data } = await issueService.returnBook(id);
    setResult(data);
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Circulation"
        title={isMember ? 'My Book Requests' : 'Issues & Returns'}
        subtitle={isMember ? 'Request books and track status' : 'Handle issue, return, and approval workflow'}
        actions={!isMember ? <button onClick={() => { setModal(true); setError(''); }} className="btn btn-primary">+ Issue Book</button> : null}
      />

      <div className="page-body">

      {error && (
        <div className="auth-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {isMember && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-subtitle">Action</div>
          <div className="card-title">Request a Book</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="field-input" style={{ flex: 1 }} value={requestBookId} onChange={(e) => setRequestBookId(e.target.value)}>
              <option value="">Select available book</option>
              {books.map((book) => (
                <option key={book.Book_Id} value={book.Book_Id}>{book.Book_Id} - {book.Name}</option>
              ))}
            </select>
            <button onClick={handleRequestBook} className="btn btn-primary">Request</button>
          </div>
        </div>
      )}

      {!isMember && hasRole('Admin', 'Librarian') && (
        <div className="card table-wrap" style={{ marginBottom: 16 }}>
          <div className="card-subtitle">Queue</div>
          <div className="card-title">Pending Requests</div>
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                {['Request ID','Book','Member','Requested At','Due Date','Action'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.Request_Id}>
                  <td>{request.Request_Id}</td>
                  <td>{request.BookName}</td>
                  <td>{request.Mem_Name}</td>
                  <td>{request.Request_Date?.slice(0, 19).replace('T', ' ')}</td>
                  <td>
                    <input
                      type="date"
                      className="field-input"
                      value={requestDueDates[request.Request_Id] || ''}
                      onChange={(e) => setRequestDueDates({ ...requestDueDates, [request.Request_Id]: e.target.value })}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApproveRequest(request.Request_Id)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Approve</button>
                      <button onClick={() => handleRejectRequest(request.Request_Id)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6}>No pending requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isMember && (
        <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              {['Request ID','Book','Requested At','Status','Processed By','Due Date','Note'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.Request_Id}>
                <td>{request.Request_Id}</td>
                <td>{request.BookName}</td>
                <td>{request.Request_Date?.slice(0, 19).replace('T', ' ')}</td>
                <td>
                  <span className={`badge ${request.Status === 'Approved' ? 'badge-paid' : request.Status === 'Rejected' ? 'badge-overdue' : 'badge-pending'}`}>
                    {request.Status}
                  </span>
                </td>
                <td>{request.ProcessedByName || '—'}</td>
                <td>{request.Due_Date ? request.Due_Date.slice(0, 10) : '—'}</td>
                <td>{request.Note || '—'}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7}>No requests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}

      {!isMember && (
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          {['all','overdue'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn btn-secondary" style={{ textTransform: 'capitalize', background: tab === t ? 'rgba(75,46,26,0.16)' : undefined }}>{t}</button>
          ))}
        </div>
      )}

      {result && (
        <div className="auth-error" style={{ background: '#e7f6e3', borderColor: '#97c28d', color: '#1e5630', marginBottom: '1rem' }}>
          Book returned!
          {result.fine ? ` Fine raised: ₹${result.fine.Amount} (${result.fine.DaysLate} days late)` : ' No fine — returned on time.'}
          <button onClick={() => setResult(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#1e5630' }}>✕</button>
        </div>
      )}

      {!isMember && (
      <div className="card table-wrap">
      <table className="table">
        <thead>
          <tr>
            {['ID','Book','Member','Issued','Due Date','Returned','Action'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map(i => {
            const overdue = !i.Return_Date && new Date(i.Due_Date) < new Date();
            return (
              <tr key={i.Issue_Id} style={{ background: overdue ? '#fff7ed' : 'transparent' }}>
                <td>{i.Issue_Id}</td>
                <td>{i.BookName}</td>
                <td>{i.Mem_Name}</td>
                <td>{i.Issue_Date?.slice(0,10)}</td>
                <td style={{ color: overdue ? '#a33f21' : 'inherit' }}>{i.Due_Date?.slice(0,10)}</td>
                <td>{i.Return_Date ? i.Return_Date.slice(0,10) : <span className="badge badge-pending">Pending</span>}</td>
                <td>
                  {!i.Return_Date && (
                    <button onClick={() => handleReturn(i.Issue_Id)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>Return</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      )}

      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Issue a Book</h3>
            {error && <div className="auth-error" style={{ marginTop: 0, marginBottom: 8 }}>{error}</div>}
            {[['Book ID','Book_Id','number'],['Member ID','Member_Id','number'],['Due Date','Due_Date','date']].map(([label, key, type]) => (
              <div key={key}>
                <label className="field-label">{label}</label>
                <input className="field-input" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div className="modal-actions">
              <button onClick={handleIssue} className="btn btn-primary">Issue</button>
              <button onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

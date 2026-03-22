import { useEffect, useState } from 'react';
import {
  createLibrarianFine,
  fetchLibrarianFines,
  fetchLibrarianRequests,
  issueLibrarianRequest,
  rejectLibrarianRequest
} from '../services/api';

function LibrarianPortal() {
  const [requests, setRequests] = useState([]);
  const [fines, setFines] = useState([]);
  const [fineForm, setFineForm] = useState({ member_user_id: '', request_id: '', amount: '', reason: '' });
  const [requestFilter, setRequestFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [requestsRes, finesRes] = await Promise.all([fetchLibrarianRequests(), fetchLibrarianFines()]);
      setRequests(requestsRes.data);
      setFines(finesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load librarian portal');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const issueRequest = async (requestId) => {
    setError('');
    setMessage('');

    try {
      await issueLibrarianRequest(requestId, {});
      setMessage(`Request ${requestId} issued successfully`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Issue failed');
    }
  };

  const rejectRequest = async (requestId) => {
    setError('');
    setMessage('');

    try {
      await rejectLibrarianRequest(requestId);
      setMessage(`Request ${requestId} rejected`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Reject failed');
    }
  };

  const submitFine = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await createLibrarianFine({
        member_user_id: Number(fineForm.member_user_id),
        request_id: fineForm.request_id ? Number(fineForm.request_id) : null,
        amount: Number(fineForm.amount),
        reason: fineForm.reason
      });

      setMessage('Fine added successfully');
      setFineForm({ member_user_id: '', request_id: '', amount: '', reason: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add fine');
    }
  };

  const filteredRequests = requests.filter((item) => {
    const byStatus = requestFilter === 'all' || item.status === requestFilter;
    const q = search.toLowerCase();
    const bySearch =
      String(item.request_id).toLowerCase().includes(q) ||
      String(item.member_name || '').toLowerCase().includes(q) ||
      String(item.book_id || '').toLowerCase().includes(q);

    return byStatus && bySearch;
  });

  const pendingCount = requests.filter((item) => item.status === 'pending').length;
  const issuedCount = requests.filter((item) => item.status === 'issued' || item.status === 'approved').length;
  const rejectedCount = requests.filter((item) => item.status === 'rejected').length;

  return (
    <section className="page fade-in">
      <div className="page-header">
        <span className="page-tag">Librarian</span>
        <div className="page-header-top">
          <h1 className="page-title">Librarian Control Desk</h1>
          <button className="btn btn-outline" onClick={load}>Refresh</button>
        </div>
        <p className="page-desc">Review requests, issue books, and manage fines.</p>
      </div>

      <div className="quick-info">
        <div className="quick-info-text">
          <h2>{pendingCount} Requests Need Review</h2>
          <p>{issuedCount} issued · {rejectedCount} rejected</p>
        </div>
        <div className="quick-info-actions">
          <button className="btn-white" onClick={() => setRequestFilter('pending')}>Pending Only</button>
          <button className="btn-ghost-white" onClick={() => setRequestFilter('all')}>All Requests</button>
        </div>
      </div>

      {message && <p className="ok-banner">{message}</p>}
      {error && <p className="error-banner">{error}</p>}

      <div className="filter-row">
        <div className="filter-tabs">
          {['all', 'pending', 'issued', 'rejected'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${requestFilter === tab ? 'active' : ''}`}
              onClick={() => setRequestFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search by request, member, book..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <h3 className="section-title">Book Issue Requests</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Member</th>
              <th>Member ID</th>
              <th>Book ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="6">No requests available.</td>
              </tr>
            ) : (
              filteredRequests.map((item) => (
                <tr key={item.request_id}>
                  <td>{item.request_id}</td>
                  <td>{item.member_name}</td>
                  <td>{item.member_ref_id || '-'}</td>
                  <td>{item.book_id}</td>
                  <td>
                    <span className={`badge ${item.status === 'pending' ? 'badge-issued' : 'badge-available'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === 'pending' ? (
                      <div className="inline-actions">
                        <button type="button" onClick={() => issueRequest(item.request_id)}>Issue</button>
                        <button type="button" className="secondary-btn" onClick={() => rejectRequest(item.request_id)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="portal-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Add Fine</span>
          </div>
          <div className="card-body">
            <form onSubmit={submitFine}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="member_user_id">Member User ID</label>
                  <input
                    className="form-input"
                    id="member_user_id"
                    value={fineForm.member_user_id}
                    onChange={(event) => setFineForm((prev) => ({ ...prev, member_user_id: event.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="request_id">Request or Issue ID</label>
                  <input
                    className="form-input"
                    id="request_id"
                    value={fineForm.request_id}
                    onChange={(event) => setFineForm((prev) => ({ ...prev, request_id: event.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="amount">Amount</label>
                  <input
                    className="form-input"
                    id="amount"
                    value={fineForm.amount}
                    onChange={(event) => setFineForm((prev) => ({ ...prev, amount: event.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reason">Reason</label>
                  <input
                    className="form-input"
                    id="reason"
                    value={fineForm.reason}
                    onChange={(event) => setFineForm((prev) => ({ ...prev, reason: event.target.value }))}
                  />
                </div>
              </div>

              <button className="btn btn-primary" type="submit">Add Fine</button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Fine Notes</span>
          </div>
          <div className="card-body">
            <ul style={{ margin: 0, paddingLeft: 18, color: '#78716C', lineHeight: 1.9, fontSize: 13 }}>
              <li>Link fine to request or issue when possible.</li>
              <li>Keep reason short and clear for member visibility.</li>
              <li>Use consistent amount policy for fairness.</li>
            </ul>
          </div>
        </div>
      </div>

      <h3 className="section-title">All Fines</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fine ID</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fines.length === 0 ? (
              <tr>
                <td colSpan="5">No fines available.</td>
              </tr>
            ) : (
              fines.map((fine) => (
                <tr key={fine.fine_id}>
                  <td>{fine.fine_id}</td>
                  <td>{fine.member_name}</td>
                  <td>{fine.amount}</td>
                  <td>{fine.reason || '-'}</td>
                  <td>{fine.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default LibrarianPortal;

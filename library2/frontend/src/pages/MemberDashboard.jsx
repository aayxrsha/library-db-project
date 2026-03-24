import { useEffect, useState } from 'react';
import { bookService, issueService } from '../services/entityServices';
import PageHeader from '../components/PageHeader';

export default function MemberDashboard() {
  const [stats, setStats] = useState({ books: 0, pending: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [booksRes, requestsRes] = await Promise.all([
        bookService.getAll(),
        issueService.getRequests(),
      ]);

      const all = requestsRes.data || [];
      setStats({
        books: booksRes.data.length,
        pending: all.filter((r) => r.Status === 'Pending').length,
        approved: all.filter((r) => r.Status === 'Approved').length,
        rejected: all.filter((r) => r.Status === 'Rejected').length,
      });
      setRequests(all.slice(0, 6));
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Member Space"
        title="Your Library Dashboard"
        subtitle="Track requests and discover available books"
      />

      <div className="page-body">
        <div className="stats-grid stagger-1">
          <StatCard tone="gold" icon="📚" label="Total Books" value={stats.books} />
          <StatCard tone="rust" icon="⏳" label="Pending Requests" value={stats.pending} />
          <StatCard tone="brown" icon="✅" label="Approved" value={stats.approved} />
          <StatCard tone="sienna" icon="✕" label="Rejected" value={stats.rejected} />
        </div>

        <div className="card stagger-2">
          <div className="card-subtitle">Recent</div>
          <div className="card-title">Your Latest Requests</div>

          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Book</th>
                  <th>Status</th>
                  <th>Requested At</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.Request_Id}>
                    <td>{r.Request_Id}</td>
                    <td>{r.BookName}</td>
                    <td>
                      <span className={`badge ${r.Status === 'Approved' ? 'badge-paid' : r.Status === 'Rejected' ? 'badge-overdue' : 'badge-pending'}`}>
                        {r.Status}
                      </span>
                    </td>
                    <td>{r.Request_Date?.slice(0, 19).replace('T', ' ')}</td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={4}>No requests yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ tone, icon, value, label }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

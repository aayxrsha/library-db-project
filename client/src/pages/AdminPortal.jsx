import { useEffect, useState } from 'react';
import { fetchAdminOverview } from '../services/api';

function DataTable({ title, rows }) {
  const headers = rows?.length ? Object.keys(rows[0]).slice(0, 8) : [];

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-body" style={{ paddingTop: 0 }}>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!rows?.length ? (
                <tr>
                  <td colSpan={Math.max(headers.length, 1)}>No data</td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx}>
                    {headers.map((header) => (
                      <td key={header}>{String(row[header] ?? '-')}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminPortal() {
  const [overview, setOverview] = useState({
    members: [],
    employees: [],
    books: [],
    requests: [],
    fines: [],
    issues: []
  });
  const [error, setError] = useState('');

  const load = async () => {
    setError('');

    try {
      const res = await fetchAdminOverview();
      setOverview(res.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin details');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="page fade-in">
      <div className="page-header">
        <span className="page-tag">Admin</span>
        <div className="page-header-top">
          <h1 className="page-title">Admin Master Dashboard</h1>
          <button className="btn btn-outline" onClick={load}>Refresh</button>
        </div>
        <p className="page-desc">Full visibility into members, employees, books, requests, fines, and issues.</p>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="summary-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Members', value: overview.members?.length || 0 },
          { label: 'Employees', value: overview.employees?.length || 0 },
          { label: 'Books', value: overview.books?.length || 0 },
          { label: 'Requests', value: overview.requests?.length || 0 },
          { label: 'Fines', value: overview.fines?.length || 0 },
          { label: 'Issues', value: overview.issues?.length || 0 }
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <p>{item.label}</p>
            <h2>{item.value}</h2>
          </div>
        ))}
      </div>

      <DataTable title="Members" rows={overview.members} />
      <DataTable title="Employees" rows={overview.employees} />
      <DataTable title="Books" rows={overview.books} />
      <DataTable title="Issue Requests" rows={overview.requests} />
      <DataTable title="Fines" rows={overview.fines} />
      <DataTable title="Issued / Returned Records" rows={overview.issues} />
    </section>
  );
}

export default AdminPortal;

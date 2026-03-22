import { useEffect, useState } from 'react';
import { fetchMemberDetails, fetchMembers } from '../services/api';

const AVATAR_COLORS = ['#FF6F00', '#3949AB', '#2E7D32', '#BF360C', '#6A1B9A', '#00838F'];

function buildInitials(name) {
  return String(name || 'NA')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchMembers();
        const normalized = (res.data || []).map((row, index) => {
          const type = String(row.type || row.membership_type || 'Student');
          return {
            id: String(row.member_id || row.id || `M-${1000 + index}`),
            name: row.full_name || row.name || row.member_name || `Member ${index + 1}`,
            type: type.charAt(0).toUpperCase() + type.slice(1),
            classLabel: row.class || row.department || row.section || 'General',
            books: Number(row.books_borrowed || row.borrowed_count || 0),
            joined: row.joined_on ? new Date(row.joined_on).toLocaleDateString() : 'N/A',
            avatar: AVATAR_COLORS[index % AVATAR_COLORS.length]
          };
        });

        setMembers(normalized);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load members');
      }
    }

    load();
  }, []);

  const filtered = members.filter((member) => {
    const type = member.type.toLowerCase();
    const matchType = filter === 'all' || type === filter;
    const q = search.toLowerCase();
    const matchSearch = member.name.toLowerCase().includes(q) || member.id.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const totalMembers = members.length;
  const students = members.filter((member) => member.type.toLowerCase() === 'student').length;
  const teachers = members.filter((member) => member.type.toLowerCase() === 'teacher').length;

  const handleView = async (member) => {
    setError('');
    setSelectedMember(member);
    setSelectedDetails(null);

    try {
      const res = await fetchMemberDetails(member.id);
      setSelectedDetails(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load member details');
    }
  };

  return (
    <section className="page slide-up">
      <div className="page-header">
        <span className="page-tag">Members</span>
        <div className="page-header-top">
          <h1 className="page-title">Library Members</h1>
          <button className="btn btn-primary">+ Register Member</button>
        </div>
        <p className="page-desc">Manage all registered library members.</p>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="filter-row">
        <div className="filter-tabs">
          {['all', 'student', 'teacher'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}s
            </button>
          ))}
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search by name or ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="members-grid">
        {filtered.map((member) => (
          <div className="member-card" key={member.id}>
            <div className="member-avatar" style={{ background: member.avatar }}>
              {buildInitials(member.name)}
            </div>
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-detail">{member.classLabel} · {member.id}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${member.type === 'Student' ? 'badge-returned' : 'badge-available'}`}>
                  {member.type}
                </span>
                <span style={{ fontSize: 11, color: '#78716C' }}>
                  {member.books} book{member.books !== 1 ? 's' : ''} borrowed
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ marginBottom: 6, display: 'block' }}
                onClick={() => handleView(member)}
              >
                View
              </button>
              <div style={{ fontSize: 10, color: '#A8A29E' }}>Since {member.joined}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedMember && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-header">
            <span className="card-title">
              Member Details: {selectedMember.name} ({selectedMember.id})
            </span>
          </div>
          <div className="card-body">
            {!selectedDetails ? (
              <p className="helper-text">Loading member details...</p>
            ) : (
              <>
                <h4 style={{ margin: '8px 0 10px' }}>Currently Borrowed Books</h4>
                <div className="table-wrap" style={{ marginBottom: 14 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Issue ID</th>
                        <th>Book ID</th>
                        <th>Book Title</th>
                        <th>Issue Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetails.currentlyBorrowed?.length ? (
                        selectedDetails.currentlyBorrowed.map((row) => (
                          <tr key={row.issue_id}>
                            <td>{row.issue_id}</td>
                            <td>{row.book_id}</td>
                            <td>{row.book_title || '-'}</td>
                            <td>{row.issue_date ? new Date(row.issue_date).toLocaleDateString() : '-'}</td>
                            <td>{row.status || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No currently borrowed books.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <h4 style={{ margin: '8px 0 10px' }}>Borrowing History</h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Issue ID</th>
                        <th>Book ID</th>
                        <th>Book Title</th>
                        <th>Issue Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetails.history?.length ? (
                        selectedDetails.history.map((row) => (
                          <tr key={`${row.issue_id}-${row.book_id}`}>
                            <td>{row.issue_id}</td>
                            <td>{row.book_id}</td>
                            <td>{row.book_title || '-'}</td>
                            <td>{row.issue_date ? new Date(row.issue_date).toLocaleDateString() : '-'}</td>
                            <td>{row.return_date ? new Date(row.return_date).toLocaleDateString() : '-'}</td>
                            <td>{row.status || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6">No history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">👥</span>
          <h3>No members found</h3>
          <p>Try adjusting your search.</p>
        </div>
      )}

      <div className="divider">Summary</div>

      <div className="summary-grid">
        {[
          { label: 'Total Members', value: totalMembers, icon: '👥', color: '#E8EAF6', text: '#3949AB' },
          { label: 'Students', value: students, icon: '🎓', color: '#FFF3E0', text: '#E65100' },
          { label: 'Teaching Staff', value: teachers, icon: '📖', color: '#E8F5E9', text: '#2E7D32' }
        ].map((summary, index) => (
          <div
            key={index}
            style={{
              background: summary.color,
              borderRadius: 12,
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}
          >
            <span style={{ fontSize: 28 }}>{summary.icon}</span>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 800, color: '#1C1917' }}>
                {summary.value}
              </div>
              <div style={{ fontSize: 12, color: summary.text, fontWeight: 600 }}>{summary.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Members;

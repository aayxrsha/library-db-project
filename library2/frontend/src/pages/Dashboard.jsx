import { useState, useEffect } from 'react';
import { bookService, memberService, issueService, fineService } from '../services/entityServices';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { employee } = useAuth();
  const [stats, setStats] = useState({ books: 0, members: 0, activeIssues: 0, unpaidFines: 0, overdueCount: 0 });
  const [issues, setIssues] = useState([]);
  const [books, setBooks] = useState([]);
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [booksRes, membersRes, issuesRes, overdueRes, finesRes] = await Promise.all([
        bookService.getAll(),
        memberService.getAll(),
        issueService.getAll(),
        issueService.getOverdue(),
        fineService.getUnpaid(),
      ]);

      const active = issuesRes.data.filter(i => !i.Return_Date).length;
      setStats({
        books:        booksRes.data.length,
        members:      membersRes.data.length,
        activeIssues: active,
        unpaidFines:  finesRes.data.reduce((s, f) => s + parseFloat(f.Amount || 0), 0),
        overdueCount: overdueRes.data.length,
      });

      setIssues(issuesRes.data.filter((i) => i.Return_Date).slice(0, 6));
      setBooks(booksRes.data.slice(0, 4));
      setOverdue(overdueRes.data.slice(0, 5));
    };
    load();
  }, []);

  const availability = stats.books > 0
    ? Math.round(((stats.books - stats.activeIssues) / stats.books) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Good Day, ${employee?.name || 'Librarian'}`}
        subtitle="Here is what is happening in your library today"
      />
      <div className="page-body">
        <div className="stats-grid stagger-1">
          <div className="stat-card gold">
            <span className="stat-icon">📚</span>
            <div className="stat-number">{stats.books}</div>
            <div className="stat-label">Total Books</div>
          </div>
          <div className="stat-card rust">
            <span className="stat-icon">👤</span>
            <div className="stat-number">{stats.members}</div>
            <div className="stat-label">Members</div>
          </div>
          <div className="stat-card brown">
            <span className="stat-icon">↗</span>
            <div className="stat-number">{stats.activeIssues}</div>
            <div className="stat-label">Currently Issued</div>
          </div>
          <div className="stat-card sienna">
            <span className="stat-icon">⚠</span>
            <div className="stat-number">{stats.overdueCount}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <div className="dashboard-grid stagger-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <div className="card-subtitle">Live Feed</div>
              <div className="card-title">Recent Returns</div>
              <div style={{ marginTop: 16 }}>
                {issues.map((item) => (
                  <div className="activity-item" key={item.Issue_Id}>
                    <div className="activity-dot return" />
                    <div>
                      <div className="activity-text">{item.BookName} returned by {item.Mem_Name}</div>
                      <div className="activity-time">Issue #{item.Issue_Id}</div>
                    </div>
                  </div>
                ))}
                {issues.length === 0 && <div className="activity-time">No recent returns yet.</div>}
              </div>
            </div>

            <div className="card">
              <div className="card-subtitle">Catalog</div>
              <div className="card-title">Recently Listed Books</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 16 }}>
                {books.map((book, i) => (
                  <div className="book-card" key={book.Book_Id}>
                    <div className="book-cover" style={{ background: ['#4b2e1a', '#8b3a1c', '#7a4f2d', '#c9922a'][i % 4] }}>
                      <span>{book.Available ? '📘' : '📕'}</span>
                    </div>
                    <div className="book-info">
                      <div className="book-title">{book.Name}</div>
                      <div className="book-author">{book.Author_Name || 'Unknown Author'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <div className="card-subtitle">Shortcuts</div>
              <div className="card-title">Quick Actions</div>
              <div className="quick-actions-grid" style={{ marginTop: 16 }}>
                <Link to="/issues" className="quick-action-btn"><span className="qa-icon">↗</span><span className="qa-label">Issue Book</span></Link>
                <Link to="/issues" className="quick-action-btn"><span className="qa-icon">↩</span><span className="qa-label">Return Book</span></Link>
                <Link to="/books" className="quick-action-btn"><span className="qa-icon">📚</span><span className="qa-label">Manage Books</span></Link>
                <Link to="/members" className="quick-action-btn"><span className="qa-icon">👤</span><span className="qa-label">Manage Members</span></Link>
              </div>
            </div>

            <div className="card" style={{ borderLeft: '3px solid var(--sienna)' }}>
              <div className="card-subtitle" style={{ color: 'var(--sienna)' }}>Attention Required</div>
              <div className="card-title">Overdue Books</div>
              <div style={{ marginTop: 16 }}>
                {overdue.map((item, i) => (
                  <div key={item.Issue_Id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < overdue.length - 1 ? '1px solid var(--tan-pale)' : 'none' }}>
                    <span style={{ fontFamily:'var(--font-body)', fontSize:15 }}>{item.BookName} — {item.Mem_Name}</span>
                    <span className="badge badge-overdue">{item.DaysOverdue}d</span>
                  </div>
                ))}
                {overdue.length === 0 && <div className="activity-time">No overdue books currently.</div>}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--brown)', borderColor: 'var(--brown)' }}>
              <div style={{ color:'var(--tan)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:8 }}>At a Glance</div>
              <div style={{ color:'var(--parchment)', fontFamily:'var(--font-serif)', fontSize:28, fontWeight:800, lineHeight:1.1 }}>
                {availability}%
              </div>
              <div style={{ color:'var(--tan)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', marginTop:4 }}>Books Available</div>
              <div style={{ marginTop:16, height:6, background:'rgba(200,169,126,0.2)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${availability}%`, background:'var(--gold)', borderRadius:3, transition:'width 1s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

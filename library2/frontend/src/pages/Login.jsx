import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/entityServices';

const MEMBER_TYPES = ['Student', 'Teacher', 'NT_Staff'];

export default function Login({ mode = 'employee' }) {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const isMemberMode = mode === 'member';
  const [form, setForm]   = useState({ accountType: mode, id: '', password: '' });
  const [memberModeTab, setMemberModeTab] = useState('login');
  const [registerForm, setRegisterForm] = useState({ Mem_Name: '', Member_Type: 'Student', Email: '', Contact: '', password: '' });
  const [registerBusy, setRegisterBusy] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  const demoAccounts = isMemberMode
    ? [
        { label: 'Member', id: 1, password: 'member123' },
      ]
    : [
        { label: 'Admin', id: 1, password: 'admin123' },
        { label: 'Librarian', id: 2, password: 'librarian123' },
      ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterBusy(true);
    setError('');
    setRegisterSuccess('');
    try {
      const { data } = await authService.memberRegister(registerForm);
      setRegisterSuccess(`Registration successful. Your Member ID is ${data.Member_Id}. Please use it to log in.`);
      setForm((prev) => ({ ...prev, id: String(data.Member_Id), password: '' }));
      setRegisterForm({ Mem_Name: '', Member_Type: 'Student', Email: '', Contact: '', password: '' });
      setMemberModeTab('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegisterBusy(false);
    }
  };

  return (
    <div className="landing-wrap">
      <div className="landing-bg-shape shape-a" />
      <div className="landing-bg-shape shape-b" />

      <div className="auth-card fade-in-up">
        <div className="landing-eyebrow">{mode === 'member' ? 'Member Access' : 'Employee Access'}</div>
        <h2 className="auth-title">{mode === 'member' ? 'Member Login' : 'Employee Login'}</h2>
        <p className="auth-subtitle">{isMemberMode && memberModeTab === 'register' ? 'Create your member account to get a new Member ID.' : 'Use your ID and password to continue.'}</p>

        {isMemberMode && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setMemberModeTab('login'); setError(''); }} style={{ background: memberModeTab === 'login' ? 'rgba(75,46,26,0.16)' : undefined }}>
              Member Login
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setMemberModeTab('register'); setError(''); }} style={{ background: memberModeTab === 'register' ? 'rgba(75,46,26,0.16)' : undefined }}>
              New Member Register
            </button>
          </div>
        )}

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {registerSuccess && (
          <div className="auth-error" style={{ background: '#e7f6e3', borderColor: '#97c28d', color: '#1e5630' }}>
            {registerSuccess}
          </div>
        )}

        {(!isMemberMode || memberModeTab === 'login') ? (
          <>
            <div className="demo-credentials">
              <div className="demo-title">Test Credentials</div>
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  className="demo-row"
                  onClick={() => setForm({ ...form, id: String(account.id), password: account.password })}
                >
                  <span>{account.label}</span>
                  <span>ID {account.id}</span>
                  <span>{account.password}</span>
                </button>
              ))}
              <div className="demo-hint">Click a row to auto-fill credentials.</div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label">{form.accountType === 'member' ? 'Member ID' : 'Employee ID'}</label>
              <input
                className="field-input"
                type="number"
                value={form.id}
                onChange={e => setForm({ ...form, id: e.target.value })}
                required
              />

              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />

              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary auth-submit"
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="auth-switch">
                {mode === 'member' ? (
                  <Link to="/login/employee">Employee login instead</Link>
                ) : (
                  <Link to="/login/member">Member login instead</Link>
                )}
                <span> · </span>
                <Link to="/">Back to Home</Link>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleRegister}>
            <label className="field-label">Full Name</label>
            <input
              className="field-input"
              value={registerForm.Mem_Name}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, Mem_Name: e.target.value }))}
              required
            />

            <label className="field-label">Member Type</label>
            <select
              className="field-input"
              value={registerForm.Member_Type}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, Member_Type: e.target.value }))}
              required
            >
              {MEMBER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              value={registerForm.Email}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, Email: e.target.value }))}
              required
            />

            <label className="field-label">Contact</label>
            <input
              className="field-input"
              value={registerForm.Contact}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, Contact: e.target.value }))}
            />

            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />

            <button
              type="submit"
              disabled={registerBusy}
              className="btn btn-primary auth-submit"
            >
              {registerBusy ? 'Registering…' : 'Register Member'}
            </button>

            <div className="auth-switch">
              <Link to="/login/employee">Employee login instead</Link>
              <span> · </span>
              <Link to="/">Back to Home</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

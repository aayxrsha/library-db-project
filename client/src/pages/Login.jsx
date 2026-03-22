import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setStoredAuth } from '../services/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await login({ identifier, password });
      const auth = {
        token: response.data.token,
        user: response.data.user
      };

      setStoredAuth(auth);
      onLogin(auth);

      if (auth.user.role === 'admin') {
        navigate('/admin');
      } else if (auth.user.role === 'librarian') {
        navigate('/librarian');
      } else {
        navigate('/member');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <section className="page fade-in">
      <h2>Login</h2>
      <p className="page-subtitle">Sign in as member or librarian.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="identifier">Email or Member ID</label>
        <input
          id="identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>

      {error && <p className="error-banner">{error}</p>}
      <p className="helper-text">Welcome</p>
    </section>
  );
}

export default Login;

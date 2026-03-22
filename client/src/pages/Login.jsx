import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setStoredAuth } from '../services/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await login({ email, password });
      const auth = {
        token: response.data.token,
        user: response.data.user
      };

      setStoredAuth(auth);
      onLogin(auth);

      navigate(auth.user.role === 'librarian' ? '/librarian' : '/member');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <section className="page fade-in">
      <h2>Login</h2>
      <p className="page-subtitle">Sign in as member or librarian.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
      <p className="helper-text">Default librarian: librarian@library.local / admin123</p>
    </section>
  );
}

export default Login;

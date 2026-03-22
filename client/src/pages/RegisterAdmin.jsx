import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerAdmin } from '../services/api';

function RegisterAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', registration_key: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await registerAdmin(form);
      setMessage('Admin account created. Please login.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Admin registration failed');
    }
  };

  return (
    <section className="page fade-in">
      <h2>Register Admin</h2>
      <p className="page-subtitle">Create a full-access admin account.</p>

      <form className="form-card" onSubmit={onSubmit}>
        <label htmlFor="full_name">Full Name</label>
        <input id="full_name" name="full_name" value={form.full_name} onChange={onChange} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={onChange} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={form.password} onChange={onChange} required />

        <label htmlFor="registration_key">Admin Registration Key</label>
        <input
          id="registration_key"
          name="registration_key"
          type="password"
          value={form.registration_key}
          onChange={onChange}
          required
        />

        <button type="submit">Create Admin</button>
      </form>

      {message && <p className="ok-banner">{message}</p>}
      {error && <p className="error-banner">{error}</p>}
    </section>
  );
}

export default RegisterAdmin;

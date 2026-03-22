import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerMember } from '../services/api';

function RegisterMember() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    member_ref_id: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await registerMember({
        ...form,
        member_ref_id: form.member_ref_id ? Number(form.member_ref_id) : null
      });
      setMessage('Account created. Please login.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <section className="page fade-in">
      <h2>Register Member</h2>
      <p className="page-subtitle">Create a member account to request book issues.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="full_name">Full Name</label>
        <input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />

        <label htmlFor="member_ref_id">Member Reference ID (optional)</label>
        <input id="member_ref_id" name="member_ref_id" value={form.member_ref_id} onChange={handleChange} />

        <button type="submit">Create Account</button>
      </form>

      {message && <p className="ok-banner">{message}</p>}
      {error && <p className="error-banner">{error}</p>}
    </section>
  );
}

export default RegisterMember;

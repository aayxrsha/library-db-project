import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerMember } from '../services/api';

function RegisterMember() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setMemberId(null);

    try {
      const response = await registerMember(form);
      setMemberId(response.data?.member_ref_id || null);
      setMessage('Account created. Please login with your Member ID and password.');
      setTimeout(() => navigate('/login'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <section className="page fade-in">
      <h2>Register Member</h2>
      <p className="page-subtitle">Create a member account. Member ID is auto-generated.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="full_name">Full Name</label>
        <input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />

        <button type="submit">Create Account</button>
      </form>

      {message && <p className="ok-banner">{message}</p>}
      {memberId && <p className="ok-banner">Your Member ID: {memberId}</p>}
      {error && <p className="error-banner">{error}</p>}
    </section>
  );
}

export default RegisterMember;

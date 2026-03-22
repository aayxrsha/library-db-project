import { useState } from 'react';
import { returnBook } from '../services/api';

function ReturnBook() {
  const [recordId, setRecordId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await returnBook({ record_id: Number(recordId) });
      setMessage(res.data.message || 'Book returned successfully');
      setRecordId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Return request failed');
    }
  };

  return (
    <section className="page slide-up">
      <h2>Return Book</h2>
      <p className="page-subtitle">Uses the return_book stored procedure from MySQL.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        <label htmlFor="record_id">Issue Record ID</label>
        <input
          id="record_id"
          name="record_id"
          value={recordId}
          onChange={(event) => setRecordId(event.target.value)}
          required
        />
        <button type="submit">Return Book</button>
      </form>

      {message && <p className="ok-banner">{message}</p>}
      {error && <p className="error-banner">{error}</p>}
    </section>
  );
}

export default ReturnBook;

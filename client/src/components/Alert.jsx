import React from 'react';

export default function Alert({ type = 'success', message, onClose }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`} role="status" aria-live="polite">
      <span>{type === 'error' ? '!' : 'OK'}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        className="btn btn-outline"
        style={{ marginTop: 0, padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

import { useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError('Invalid or missing token.');
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword: password });
      setSuccess(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
      <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Reset Password</h2>
        
        {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'var(--accent-success)', marginBottom: '1rem', textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '4px' }}>{success}</div>}
        
        {!token && !error && !success && (
          <div style={{ color: 'var(--accent-danger)', textAlign: 'center' }}>Missing reset token in URL.</div>
        )}

        {token && !success && (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label>New Password (min 6 chars)</label>
              <input type="password" required className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
          </form>
        )}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--primary-color)' }}>Go to Login</Link>
        </div>
      </div>
    </div>
  );
}

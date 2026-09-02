import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    axios.post(`${API_URL}/auth/verify-email`, { token })
      .then(res => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, [token, API_URL]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
      <div className="card" style={{ width: '400px', maxWidth: '90%', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Email Verification</h2>
        
        {status === 'loading' && <p>{message}</p>}
        {status === 'error' && <p style={{ color: 'var(--accent-danger)' }}>{message}</p>}
        {status === 'success' && <p style={{ color: 'var(--accent-success)' }}>{message}</p>}

        <div style={{ marginTop: '2rem' }}>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';
import { useAuth } from '../state/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please enter both email and password.');
      return;
    }
    if (mode === 'register') {
      if (!form.name || !form.confirm) {
        setError('All fields are required.');
        return;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (form.password !== form.confirm) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    const path = mode === 'login' ? '/auth/login' : '/auth/register';
    const payload =
      mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

    const result = await apiPost(path, payload);
    setLoading(false);

    if (result.token) {
      login(result.token, result.user);
      navigate(mode === 'login' ? '/generator' : '/plans');
      return;
    }

    setError(result.detail || 'Authentication failed.');
  };

  return (
    <div className="centered-card">
      <h1>NUR</h1>
      <p>AI Islamic Script & Shorts Generator</p>

      <div className="tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
          Sign In
        </button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
          Create Account
        </button>
      </div>

      <form onSubmit={onSubmit} className="form">
        {mode === 'register' ? (
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
          />
        ) : null}
        <input
          placeholder="Email"
          value={form.email}
          onChange={(event) => onChange('email', event.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => onChange('password', event.target.value)}
        />
        {mode === 'register' ? (
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirm}
            onChange={(event) => onChange('confirm', event.target.value)}
          />
        ) : null}

        {error ? <div className="error">{error}</div> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </button>
      </form>
    </div>
  );
}

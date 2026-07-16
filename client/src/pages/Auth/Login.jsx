import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ht-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-ht-text-1 tracking-tight">HabiTask</p>
          <p className="text-sm text-ht-text-3 mt-1">Your daily discipline companion</p>
        </div>

        {/* Form card */}
        <div className="bg-ht-surface border border-ht-border rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-ht-text-1">Welcome back</h2>

          {error && (
            <div className="bg-ht-danger/10 border border-ht-danger/20 text-ht-danger rounded-lg px-3 py-2.5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-ht-text-3 pt-1">
            No account?{' '}
            <Link to="/signup" className="text-ht-accent hover:text-ht-accent-2 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

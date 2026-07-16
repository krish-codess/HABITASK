import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', height: '', weight: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="min-h-screen bg-ht-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-ht-text-1 tracking-tight">HabiTask</p>
          <p className="text-sm text-ht-text-3 mt-1">Build discipline, one day at a time</p>
        </div>

        {/* Form card */}
        <div className="bg-ht-surface border border-ht-border rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-ht-text-1">Create account</h2>

          {error && (
            <div className="bg-ht-danger/10 border border-ht-danger/20 text-ht-danger rounded-lg px-3 py-2.5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="field-label">Full name</label>
              <input type="text" className="input-field" placeholder="Your name" {...field('name')} required autoFocus />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" {...field('email')} required autoComplete="email" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" className="input-field" placeholder="Min. 6 characters" {...field('password')} required autoComplete="new-password" />
            </div>

            {/* Optional body stats — compact 3-col */}
            <div>
              <label className="field-label">Body stats (optional)</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                  <input type="number" className="input-field text-center" placeholder="Age" {...field('age')} min="10" max="100" />
                </div>
                <div>
                  <input type="number" className="input-field text-center" placeholder="cm" {...field('height')} min="100" max="250" />
                </div>
                <div>
                  <input type="number" className="input-field text-center" placeholder="kg" {...field('weight')} min="20" max="300" />
                </div>
              </div>
              <p className="text-[11px] text-ht-text-3 mt-1.5 text-center">Age · Height · Weight</p>
            </div>

            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-ht-text-3 pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-ht-accent hover:text-ht-accent-2 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', height: '', weight: '' });
  const [error, setError] = useState('');
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
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-slate-100">HabiTask</h1>
          <p className="text-slate-400 mt-1 text-sm">Start your journey today</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-5 text-slate-100">Create account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input type="text" className="input-field" placeholder="Your name" {...field('name')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" {...field('email')} required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input type="password" className="input-field" placeholder="Min. 6 characters" {...field('password')} required autoComplete="new-password" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Age</label>
                <input type="number" className="input-field text-sm" placeholder="25" {...field('age')} min="10" max="100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Height (cm)</label>
                <input type="number" className="input-field text-sm" placeholder="170" {...field('height')} min="100" max="250" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Weight (kg)</label>
                <input type="number" className="input-field text-sm" placeholder="70" {...field('weight')} min="20" max="300" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

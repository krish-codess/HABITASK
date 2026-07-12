import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { updateProfile, updateGoals } from '../../api/users.js';
import { getWeightLogs, addWeight } from '../../api/weight.js';
import { getCalorieTrend } from '../../api/meals.js';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const today = () => new Date().toISOString().split('T')[0];

function StatCard({ label, value, unit, color = 'text-indigo-400', icon }) {
  return (
    <div className="bg-slate-700/50 rounded-xl p-3 text-center">
      <p className="text-lg">{icon}</p>
      <p className={`text-xl font-bold ${color}`}>{value ?? '—'}</p>
      <p className="text-xs text-slate-500 mt-0.5">{unit}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs">
        <p className="text-slate-400">{label}</p>
        <p className="text-indigo-400 font-bold">{payload[0].value} {payload[0].name === 'weight' ? 'kg' : 'kcal'}</p>
      </div>
    );
  }
  return null;
};

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [weightLogs, setWeightLogs] = useState([]);
  const [calorieTrend, setCalorieTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditGoals, setShowEditGoals] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', age: '', height: '', weight: '' });
  const [goalsForm, setGoalsForm] = useState({ goalWeight: '', goalCalories: '', goalSteps: '' });
  const [weightForm, setWeightForm] = useState({ weight: '', date: today() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', age: user.age || '', height: user.height || '', weight: user.weight || '' });
      setGoalsForm({ goalWeight: user.goalWeight || '', goalCalories: user.goalCalories || '', goalSteps: user.goalSteps || '' });
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [w, c] = await Promise.all([getWeightLogs(), getCalorieTrend()]);
        setWeightLogs(w);
        setCalorieTrend(c);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
      await refreshUser();
      setShowEditProfile(false);
    } catch {}
    setSaving(false);
  };

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateGoals(goalsForm);
      await refreshUser();
      setShowEditGoals(false);
    } catch {}
    setSaving(false);
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!weightForm.weight) return;
    setSaving(true);
    try {
      await addWeight(weightForm.weight, weightForm.date);
      const w = await getWeightLogs();
      setWeightLogs(w);
      await refreshUser();
      setShowAddWeight(false);
    } catch {}
    setSaving(false);
  };

  const currentWeight = user?.weight;
  const goalWeight = user?.goalWeight;
  const weightToGo = goalWeight && currentWeight ? Math.abs(currentWeight - goalWeight).toFixed(1) : null;
  const bmi = user?.height && user?.weight ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null;

  const bmiCategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-400' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  const bmiInfo = bmiCategory(bmi);
  const weightChartData = weightLogs.slice(-30).map((l) => ({
    date: l.date.slice(5),
    weight: l.weight,
  }));
  const calorieChartData = calorieTrend.slice(-14).map((c) => ({
    date: c.date.slice(5),
    calories: c.calories,
  }));

  return (
    <div className="space-y-5 py-4">
      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/20 rounded-2xl h-16 w-16 flex items-center justify-center text-3xl font-bold text-indigo-400 flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
          <button onClick={() => setShowEditProfile(true)} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
            Edit
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          <StatCard label="Age" value={user?.age} unit="yrs" icon="🎂" />
          <StatCard label="Height" value={user?.height} unit="cm" icon="📏" color="text-green-400" />
          <StatCard label="Weight" value={user?.weight} unit="kg" icon="⚖️" color="text-yellow-400" />
          {bmi && <StatCard label={bmiInfo.label} value={bmi} unit="BMI" icon="💊" color={bmiInfo.color} />}
        </div>
      </div>

      {/* Goals Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-100">Goals</h3>
          <button onClick={() => setShowEditGoals(true)} className="btn-secondary text-xs py-1.5 px-3">
            Edit Goals
          </button>
        </div>
        <div className="space-y-3">
          {user?.goalWeight && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-300">⚖️ Target Weight: {user.goalWeight} kg</span>
                {weightToGo && (
                  <span className={`text-xs font-medium ${currentWeight > goalWeight ? 'text-red-400' : 'text-green-400'}`}>
                    {weightToGo} kg to go
                  </span>
                )}
              </div>
              {currentWeight && goalWeight && (
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, ((user.weight - goalWeight) / (user.weight - goalWeight)) * 100 || 0))}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {user?.goalCalories && (
            <p className="text-sm text-slate-300">🥗 Daily Calories: <span className="text-indigo-400 font-semibold">{user.goalCalories} kcal</span></p>
          )}
          {user?.goalSteps && (
            <p className="text-sm text-slate-300">👟 Daily Steps: <span className="text-green-400 font-semibold">{user.goalSteps.toLocaleString()}</span></p>
          )}
          {!user?.goalWeight && !user?.goalCalories && !user?.goalSteps && (
            <p className="text-sm text-slate-500 text-center py-2">No goals set yet.</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Weight Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-100">Weight Progress</h3>
              <button onClick={() => setShowAddWeight(true)} className="btn-secondary text-xs py-1.5 px-3">
                Log Weight
              </button>
            </div>
            {weightChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  {goalWeight && <ReferenceLine y={goalWeight} stroke="#6366f1" strokeDasharray="3 3" label={{ value: 'Goal', fill: '#6366f1', fontSize: 10 }} />}
                  <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} name="weight" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Log at least 2 weight entries to see your trend.
              </div>
            )}
          </div>

          {/* Calorie Trend */}
          <div className="card">
            <h3 className="font-semibold text-slate-100 mb-4">14-Day Calorie Trend</h3>
            {calorieChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={calorieChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  {user?.goalCalories && <ReferenceLine y={user.goalCalories} stroke="#22c55e" strokeDasharray="3 3" />}
                  <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="calories" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Log meals to see your calorie trend.
              </div>
            )}
          </div>
        </>
      )}

      {/* Logout */}
      <button onClick={logout} className="btn-danger w-full">
        Sign Out
      </button>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-3">
          {[['name', 'Name', 'text', 'Your name'],
            ['age', 'Age', 'number', '25'],
            ['height', 'Height (cm)', 'number', '170'],
            ['weight', 'Current Weight (kg)', 'number', '70']
          ].map(([key, label, type, placeholder]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
              <input
                type={type}
                className="input-field"
                placeholder={placeholder}
                value={profileForm[key]}
                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Edit Goals Modal */}
      <Modal isOpen={showEditGoals} onClose={() => setShowEditGoals(false)} title="Set Goals">
        <form onSubmit={handleSaveGoals} className="space-y-3">
          {[['goalWeight', 'Target Weight (kg)', '65'],
            ['goalCalories', 'Daily Calorie Goal', '2000'],
            ['goalSteps', 'Daily Step Goal', '10000']
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
              <input
                type="number"
                className="input-field"
                placeholder={placeholder}
                value={goalsForm[key]}
                onChange={(e) => setGoalsForm({ ...goalsForm, [key]: e.target.value })}
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Goals'}
          </button>
        </form>
      </Modal>

      {/* Add Weight Modal */}
      <Modal isOpen={showAddWeight} onClose={() => setShowAddWeight(false)} title="Log Weight">
        <form onSubmit={handleAddWeight} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="70.5"
              value={weightForm.weight}
              onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Date</label>
            <input
              type="date"
              className="input-field"
              value={weightForm.date}
              max={today()}
              onChange={(e) => setWeightForm({ ...weightForm, date: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Log Weight'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

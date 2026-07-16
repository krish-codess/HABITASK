import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { updateProfile, updateGoals } from '../../api/users.js';
import { getWeightLogs, addWeight } from '../../api/weight.js';
import { getCalorieTrend } from '../../api/meals.js';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const todayStr = () => new Date().toISOString().split('T')[0];

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a1a2e', border: '1px solid #252538', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#8c8ca8' },
};

function bmiCategory(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', cls: 'text-blue-400' };
  if (bmi < 25)   return { label: 'Normal',       cls: 'text-ht-success' };
  if (bmi < 30)   return { label: 'Overweight',   cls: 'text-ht-warning' };
  return            { label: 'Obese',              cls: 'text-ht-danger' };
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const [weightLogs, setWeightLogs]   = useState([]);
  const [calorieTrend, setCalorieTrend] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditGoals, setShowEditGoals]     = useState(false);
  const [showAddWeight, setShowAddWeight]     = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', age: '', height: '', weight: '' });
  const [goalsForm, setGoalsForm]     = useState({ goalWeight: '', goalCalories: '', goalSteps: '' });
  const [weightForm, setWeightForm]   = useState({ weight: '', date: todayStr() });
  const [saving, setSaving]           = useState(false);

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
    try { await updateProfile(profileForm); await refreshUser(); setShowEditProfile(false); } catch {}
    setSaving(false);
  };

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await updateGoals(goalsForm); await refreshUser(); setShowEditGoals(false); } catch {}
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

  // Derived stats
  const bmi = user?.height && user?.weight
    ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
    : null;
  const bmiInfo = bmiCategory(Number(bmi));

  const currentWeight = user?.weight;
  const goalWeight    = user?.goalWeight;
  const weightDelta   = goalWeight && currentWeight
    ? (currentWeight - goalWeight).toFixed(1)
    : null;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  const weightChartData   = weightLogs.slice(-30).map((l) => ({ date: l.date.slice(5), weight: l.weight }));
  const calorieChartData  = calorieTrend.slice(-14).map((c) => ({ date: c.date.slice(5), calories: c.calories }));

  return (
    <div className="space-y-4 py-4">

      {/* Identity card */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-ht-accent/15 border border-ht-accent/30 flex items-center justify-center text-2xl font-bold text-ht-accent flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-ht-text-1 leading-tight">{user?.name}</h2>
            <p className="text-sm text-ht-text-2 mt-0.5 truncate">{user?.email}</p>
            {memberSince && (
              <p className="text-xs text-ht-text-3 mt-1">Member since {memberSince}</p>
            )}
          </div>
          <button onClick={() => setShowEditProfile(true)} className="btn-icon flex-shrink-0" title="Edit profile">
            <EditIcon />
          </button>
        </div>

        {/* Body stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-ht-border">
          {[
            { label: 'Age',     value: user?.age,    unit: 'yrs' },
            { label: 'Height',  value: user?.height, unit: 'cm'  },
            { label: 'Weight',  value: user?.weight, unit: 'kg'  },
            bmi ? { label: bmiInfo?.label || 'BMI', value: bmi, unit: 'BMI', cls: bmiInfo?.cls } : null,
          ].filter(Boolean).map(({ label, value, unit, cls }) => (
            <div key={label} className="text-center">
              <p className={`text-lg font-bold tabular-nums ${cls || 'text-ht-text-1'}`}>{value ?? '—'}</p>
              <p className="text-[10px] text-ht-text-3 mt-0.5">{unit}</p>
              <p className="text-[10px] text-ht-text-3">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goals card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Goals</p>
          <button onClick={() => setShowEditGoals(true)} className="btn-ghost h-7 px-2.5 text-xs gap-1.5">
            <EditIcon /> Edit
          </button>
        </div>

        {!user?.goalWeight && !user?.goalCalories && !user?.goalSteps ? (
          <div className="text-center py-4">
            <p className="text-sm text-ht-text-3 mb-3">No goals set yet</p>
            <button onClick={() => setShowEditGoals(true)} className="btn-primary h-8 px-4 text-xs">
              Set your goals
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {user?.goalWeight && (
              <div className="flex items-center justify-between py-2 border-b border-ht-border">
                <span className="text-sm text-ht-text-2">Target weight</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-ht-text-1">{user.goalWeight} kg</span>
                  {weightDelta !== null && (
                    <p className={`text-[11px] mt-0.5 ${Number(weightDelta) > 0 ? 'text-ht-warning' : Number(weightDelta) < 0 ? 'text-ht-success' : 'text-ht-success'}`}>
                      {Number(weightDelta) === 0 ? 'Goal reached! 🎉' : `${Math.abs(weightDelta)}kg to ${Number(weightDelta) > 0 ? 'lose' : 'gain'}`}
                    </p>
                  )}
                </div>
              </div>
            )}
            {user?.goalCalories && (
              <div className="flex items-center justify-between py-2 border-b border-ht-border">
                <span className="text-sm text-ht-text-2">Daily calories</span>
                <span className="text-sm font-semibold text-ht-text-1">{user.goalCalories} kcal</span>
              </div>
            )}
            {user?.goalSteps && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ht-text-2">Daily steps</span>
                <span className="text-sm font-semibold text-ht-text-1">{Number(user.goalSteps).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charts */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Weight chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label">Weight history</p>
              <button onClick={() => setShowAddWeight(true)} className="btn-ghost h-7 px-2.5 text-xs">
                + Log
              </button>
            </div>
            {weightChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weightChartData} margin={{ left: -20, right: 4, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#505068' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#505068' }} domain={['auto', 'auto']} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${v} kg`, 'Weight']} />
                  {goalWeight && (
                    <ReferenceLine y={goalWeight} stroke="#7c6af7" strokeDasharray="4 2" label={{ value: 'Goal', fill: '#7c6af7', fontSize: 10 }} />
                  )}
                  <Line type="monotone" dataKey="weight" stroke="#a294fc" strokeWidth={2} dot={{ fill: '#a294fc', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-ht-text-3">Log at least 2 entries to see your trend</p>
                <button onClick={() => setShowAddWeight(true)} className="btn-primary mt-3 mx-auto h-8 px-4 text-xs">
                  Log weight
                </button>
              </div>
            )}
          </div>

          {/* Calorie trend */}
          <div className="card">
            <p className="section-label mb-4">14-day calorie trend</p>
            {calorieChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={calorieChartData} margin={{ left: -20, right: 4, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#505068' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#505068' }} />
                  <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${v} kcal`, 'Calories']} />
                  {user?.goalCalories && (
                    <ReferenceLine y={user.goalCalories} stroke="#4ade80" strokeDasharray="4 2" />
                  )}
                  <Line type="monotone" dataKey="calories" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-sm text-ht-text-3">Log meals to see your calorie trend</p>
            )}
          </div>
        </>
      )}

      {/* Sign out — subtle, bottom of page */}
      <div className="pt-2 pb-2">
        <div className="divider mb-4" />
        <button onClick={logout} className="btn-ghost w-full text-ht-text-3 hover:text-ht-danger hover:border-ht-danger/30">
          Sign out
        </button>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-3">
          {[
            ['name',   'Name',             'text',   'Your name'],
            ['age',    'Age',              'number', '25'],
            ['height', 'Height (cm)',      'number', '170'],
            ['weight', 'Weight (kg)',      'number', '70'],
          ].map(([key, label, type, ph]) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input type={type} className="input-field" placeholder={ph}
                value={profileForm[key]} onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })} />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </Modal>

      {/* Edit Goals Modal */}
      <Modal isOpen={showEditGoals} onClose={() => setShowEditGoals(false)} title="Set Goals">
        <form onSubmit={handleSaveGoals} className="space-y-3">
          {[
            ['goalWeight',   'Target weight (kg)',   '65'],
            ['goalCalories', 'Daily calorie goal',   '2000'],
            ['goalSteps',    'Daily step goal',      '10000'],
          ].map(([key, label, ph]) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <input type="number" className="input-field" placeholder={ph}
                value={goalsForm[key]} onChange={(e) => setGoalsForm({ ...goalsForm, [key]: e.target.value })} />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save goals'}
          </button>
        </form>
      </Modal>

      {/* Add Weight Modal */}
      <Modal isOpen={showAddWeight} onClose={() => setShowAddWeight(false)} title="Log Weight">
        <form onSubmit={handleAddWeight} className="space-y-3">
          <div>
            <label className="field-label">Weight (kg)</label>
            <input type="number" step="0.1" className="input-field" placeholder="70.5"
              value={weightForm.weight} onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })}
              required autoFocus />
          </div>
          <div>
            <label className="field-label">Date</label>
            <input type="date" className="input-field" value={weightForm.date} max={todayStr()}
              onChange={(e) => setWeightForm({ ...weightForm, date: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Log weight'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { getWorkouts, createWorkout, deleteWorkout, getWeeklySummary } from '../../api/workouts.js';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import { TrashIcon, PlusIcon, ClockIcon, FireIcon } from '@heroicons/react/24/solid';

const today = () => new Date().toISOString().split('T')[0];

const EXERCISES = [
  'Running', 'Walking', 'Cycling', 'Swimming', 'Push-ups', 'Pull-ups', 'Squats',
  'Deadlift', 'Bench Press', 'Plank', 'Yoga', 'HIIT', 'Skipping', 'Weight Training',
  'Boxing', 'Dancing', 'Stretching', 'Surya Namaskar', 'Pranayama'
];

export default function WorkoutPage() {
  const [workouts, setWorkouts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ exerciseName: '', duration: '', caloriesBurned: '', notes: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());
  const [view, setView] = useState('today');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = view === 'today' ? { date: selectedDate } : { limit: 50 };
      const [w, s] = await Promise.all([getWorkouts(params), getWeeklySummary()]);
      setWorkouts(w);
      setSummary(s);
    } catch {}
    setLoading(false);
  }, [selectedDate, view]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.exerciseName || !form.duration) return;
    setAddLoading(true);
    try {
      const workout = await createWorkout({ ...form, date: selectedDate });
      setWorkouts((prev) => [workout, ...prev]);
      setForm({ exerciseName: '', duration: '', caloriesBurned: '', notes: '' });
      setShowAdd(false);
      const s = await getWeeklySummary();
      setSummary(s);
    } catch {}
    setAddLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete workout?')) return;
    await deleteWorkout(id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-5 py-4">
      {/* Weekly Summary */}
      {summary && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">This Week</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-indigo-400">{summary.totalSessions}</p>
              <p className="text-xs text-slate-400 mt-0.5">Sessions</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{summary.totalDuration}</p>
              <p className="text-xs text-slate-400 mt-0.5">Minutes</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-400">{Math.round(summary.totalCalories)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Calories</p>
            </div>
          </div>
          <div className="flex gap-1">
            {WEEK_DAYS.map((day, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const dateStr = date.toISOString().split('T')[0];
              const has = summary.byDay?.[dateStr];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-1.5 rounded-full ${has ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  <span className={`text-[10px] ${date.toDateString() === new Date().toDateString() ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          {['today', 'all'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {v === 'today' ? 'Today' : 'History'}
            </button>
          ))}
        </div>
        {view === 'today' && (
          <input type="date" value={selectedDate} max={today()} onChange={(e) => setSelectedDate(e.target.value)} className="input-field text-sm flex-1" />
        )}
        <button onClick={() => setShowAdd(true)} className="btn-primary py-2 flex items-center gap-1.5 flex-shrink-0">
          <PlusIcon className="h-4 w-4" />
          Log
        </button>
      </div>

      {/* Workout list */}
      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">💪</div>
          <p>No workouts logged yet.</p>
          <p className="text-sm mt-1">Start by logging your first session!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.id} className="card flex items-start gap-3">
              <div className="bg-indigo-500/20 rounded-xl p-2.5 flex-shrink-0">
                <span className="text-xl">🏋️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100">{w.exerciseName}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <ClockIcon className="h-3 w-3" />{w.duration} min
                  </span>
                  {w.caloriesBurned > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <FireIcon className="h-3 w-3" />{w.caloriesBurned} kcal
                    </span>
                  )}
                  <span className="text-xs text-slate-600">{w.date}</span>
                </div>
                {w.notes && <p className="text-xs text-slate-500 mt-1">{w.notes}</p>}
              </div>
              <button onClick={() => handleDelete(w.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10 flex-shrink-0">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Log Workout">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Exercise</label>
            <input
              list="exercises"
              className="input-field"
              placeholder="e.g. Running"
              {...f('exerciseName')}
              required
            />
            <datalist id="exercises">
              {EXERCISES.map((e) => <option key={e} value={e} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (min)</label>
              <input type="number" className="input-field" placeholder="30" {...f('duration')} min="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Calories Burned</label>
              <input type="number" className="input-field" placeholder="200" {...f('caloriesBurned')} min="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes (optional)</label>
            <input type="text" className="input-field" placeholder="How did it go?" {...f('notes')} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={addLoading}>
            {addLoading ? 'Saving...' : 'Save Workout'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

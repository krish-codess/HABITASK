import { useState, useEffect, useCallback, useRef } from 'react';
import { getWorkouts, createWorkout, deleteWorkout, getWeeklySummary } from '../../api/workouts.js';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import AppIcon from '../../components/UI/AppIcon.jsx';

const todayStr = () => new Date().toISOString().split('T')[0];

const EXERCISES = [
  'Running', 'Walking', 'Cycling', 'Swimming', 'Push-ups', 'Pull-ups', 'Squats',
  'Deadlift', 'Bench Press', 'Plank', 'Yoga', 'HIIT', 'Skipping', 'Weight Training',
  'Boxing', 'Dancing', 'Stretching', 'Surya Namaskar', 'Pranayama',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function WeeklyBars({ summary }) {
  const today = new Date();

  const days = WEEK_DAYS.map((label, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + i);
    const dateStr = d.toISOString().split('T')[0];
    const value = summary.byDay?.[dateStr];
    const numVal = typeof value === 'number' ? value : (value ? 1 : 0);
    return { label, dateStr, value: numVal, isToday: d.toDateString() === today.toDateString() };
  });

  const maxVal = Math.max(...days.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5 h-12">
      {days.map(({ label, value, isToday: isTd }) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex items-end justify-center" style={{ height: '36px' }}>
            <div
              className={`w-full rounded-sm transition-all duration-500 ${
                value > 0
                  ? isTd ? 'bg-ht-accent' : 'bg-ht-accent/40'
                  : 'bg-ht-elevated'
              }`}
              style={{ height: value > 0 ? `${Math.max((value / maxVal) * 100, 20)}%` : '6px' }}
            />
          </div>
          <span className={`text-[10px] font-medium ${isTd ? 'text-ht-accent' : 'text-ht-text-3'}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function WorkoutPage() {
  const [workouts, setWorkouts]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({ exerciseName: '', duration: '', caloriesBurned: '', notes: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [view, setView]           = useState('today');
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteTimerRef = useRef(null);
  const dateInputRef   = useRef(null);

  const isToday = selectedDate === todayStr();

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

  const handleDeleteClick = (id) => {
    if (pendingDelete === id) {
      clearTimeout(deleteTimerRef.current);
      setPendingDelete(null);
      deleteWorkout(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } else {
      setPendingDelete(id);
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => setPendingDelete(null), 2500);
    }
  };

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-4 py-4">

      {/* Weekly summary */}
      {summary && (
        <div className="card space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-ht-text-1 tabular-nums">{summary.totalSessions}</p>
              <p className="text-[11px] text-ht-text-3 mt-0.5 uppercase tracking-wide font-medium">Sessions</p>
            </div>
            <div className="text-center border-x border-ht-border">
              <p className="text-xl font-bold text-ht-success tabular-nums">{summary.totalDuration}</p>
              <p className="text-[11px] text-ht-text-3 mt-0.5 uppercase tracking-wide font-medium">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-orange-400 tabular-nums">{Math.round(summary.totalCalories)}</p>
              <p className="text-[11px] text-ht-text-3 mt-0.5 uppercase tracking-wide font-medium">Kcal</p>
            </div>
          </div>
          <WeeklyBars summary={summary} />
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-2">
        <div className="tab-bar flex-1">
          <button
            onClick={() => setView('today')}
            className={view === 'today' ? 'tab-item-active' : 'tab-item'}
          >
            Today
          </button>
          <button
            onClick={() => setView('all')}
            className={view === 'all' ? 'tab-item-active' : 'tab-item'}
          >
            History
          </button>
        </div>

        {/* Date picker — visible only in today view */}
        {view === 'today' && (
          <div className="relative h-8 w-8">
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={todayStr()}
              aria-label="Select date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <button className="btn-icon h-8 w-8" tabIndex={-1} aria-hidden="true">
              <AppIcon name="calendar" size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}

        <button onClick={() => setShowAdd(true)} className="btn-primary h-8 px-3 text-xs gap-1 flex-shrink-0">
          <span>+</span> Log
        </button>
      </div>

      {/* Viewing past date badge */}
      {view === 'today' && !isToday && (
        <div className="flex items-center gap-2">
          <span className="badge-warning">
            {formatDate(selectedDate)}
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="ml-1 opacity-70 hover:opacity-100"
            >×</button>
          </span>
        </div>
      )}

      {/* Workout list */}
      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : workouts.length === 0 ? (
        <div className="card flex flex-col items-center text-center py-10 gap-3">
          <span className="text-4xl">🏋️</span>
          <div>
            <p className="text-sm font-semibold text-ht-text-1">No workouts logged</p>
            <p className="text-xs text-ht-text-3 mt-1">
              {view === 'today' ? 'Log a session for this day.' : 'Your workout history will appear here.'}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            + Log workout
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="section-label">{view === 'today' ? 'Sessions' : 'All workouts'}</p>
          {workouts.map((w) => (
            <div key={w.id} className="card flex items-start gap-3 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ht-text-1">{w.exerciseName}</p>
                  {view === 'all' && (
                    <span className="badge-muted">{formatDate(w.date)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-ht-text-2">
                    <AppIcon name="clock" size={12} strokeWidth={2} />
                    {w.duration} min
                  </span>
                  {w.caloriesBurned > 0 && (
                    <span className="text-xs text-orange-400">
                      {w.caloriesBurned} kcal
                    </span>
                  )}
                </div>
                {w.notes && (
                  <p className="text-xs text-ht-text-3 mt-1.5 line-clamp-2">{w.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteClick(w.id)}
                aria-label="Delete workout"
                className={`flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-150 mt-0.5 ${
                  pendingDelete === w.id
                    ? 'bg-ht-danger/20 text-ht-danger'
                    : 'text-ht-text-3 hover:text-ht-danger hover:bg-ht-danger/10 opacity-40 group-hover:opacity-100'
                }`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          {pendingDelete && (
            <p className="text-[11px] text-ht-danger text-center animate-fade-in">
              Tap again to confirm delete
            </p>
          )}
        </div>
      )}

      {/* Log Workout Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setForm({ exerciseName: '', duration: '', caloriesBurned: '', notes: '' }); }} title="Log Workout">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="field-label">Exercise</label>
            <input
              list="exercises-list"
              className="input-field"
              placeholder="e.g. Running"
              autoFocus
              {...f('exerciseName')}
              required
            />
            <datalist id="exercises-list">
              {EXERCISES.map((e) => <option key={e} value={e} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Duration (min)</label>
              <input type="number" className="input-field" placeholder="30" min="1" {...f('duration')} required />
            </div>
            <div>
              <label className="field-label">Calories burned</label>
              <input type="number" className="input-field" placeholder="—" min="0" {...f('caloriesBurned')} />
            </div>
          </div>
          <div>
            <label className="field-label">Notes (optional)</label>
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

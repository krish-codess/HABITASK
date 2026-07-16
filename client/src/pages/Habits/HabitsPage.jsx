import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHabits, createHabit, deleteHabit,
  getHabitLogs, toggleHabitLog, getHeatmap, getStreak,
} from '../../api/habits.js';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import HabitHeatmap from './HabitHeatmap.jsx';
import AppIcon from '../../components/UI/AppIcon.jsx';

const todayStr = () => new Date().toISOString().split('T')[0];

const MOTIVATION = [
  [0,   'Ready to start?'],
  [25,  'Building momentum'],
  [50,  'Halfway there'],
  [75,  'Almost done!'],
  [99,  'One more to go!'],
  [100, 'Perfect day! 🎉'],
];
const getMotivation = (pct) => (MOTIVATION.find(([max]) => pct <= max) || MOTIVATION.at(-1))[1];

const CIRCUMFERENCE = 2 * Math.PI * 20;

function CheckMark() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function HabitRow({ habit, isCompleted, onToggle, streak, isPendingDelete, onDeleteClick }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    await onToggle(habit.id);
    setToggling(false);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 group ${
      isCompleted
        ? 'bg-ht-accent/10 border-ht-accent/20'
        : 'bg-ht-surface border-ht-border hover:border-ht-border-2'
    }`}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-90 ${
          toggling ? 'opacity-50 scale-90' : ''
        } ${
          isCompleted
            ? 'bg-ht-accent border-ht-accent'
            : 'border-ht-border-2 hover:border-ht-accent'
        }`}
      >
        {isCompleted && <CheckMark />}
      </button>

      {/* Emoji */}
      <span className="text-base leading-none select-none">{habit.icon}</span>

      {/* Name + Streak */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate transition-colors ${
          isCompleted ? 'text-ht-text-2' : 'text-ht-text-1'
        }`}>
          {habit.name}
        </p>
        {streak > 0 && (
          <p className="text-[11px] text-orange-400 mt-0.5 leading-none">
            🔥 {streak} day streak
          </p>
        )}
      </div>

      {/* Delete — two-tap confirmation */}
      <button
        onClick={() => onDeleteClick(habit.id)}
        aria-label="Delete habit"
        className={`flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-150 ${
          isPendingDelete
            ? 'bg-ht-danger/20 text-ht-danger'
            : 'text-ht-text-3 hover:text-ht-danger hover:bg-ht-danger/10 opacity-40 group-hover:opacity-100'
        }`}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

const ICON_OPTS = ['✅', '💪', '📚', '🧘', '🏃', '🥗', '💧', '😴', '🧼', '⭐', '🎯', '🔥'];

export default function HabitsPage() {
  const [habits, setHabits]           = useState([]);
  const [logs, setLogs]               = useState([]);
  const [heatmap, setHeatmap]         = useState([]);
  const [streaks, setStreaks]         = useState({});
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [newName, setNewName]         = useState('');
  const [newIcon, setNewIcon]         = useState('✅');
  const [addLoading, setAddLoading]   = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteTimerRef = useRef(null);
  const dateInputRef   = useRef(null);

  const isToday = selectedDate === todayStr();
  const completedIds = new Set(logs.map((l) => l.habitId));
  const completionRate = habits.length > 0
    ? Math.round((completedIds.size / habits.length) * 100)
    : 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, l, heat] = await Promise.all([
        getHabits(),
        getHabitLogs(selectedDate),
        getHeatmap(),
      ]);
      setHabits(h);
      setLogs(l);
      setHeatmap(heat);
    } catch {}
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (habitId) => {
    try {
      const result = await toggleHabitLog(habitId, selectedDate);
      setLogs((prev) =>
        result.completed
          ? [...prev, { habitId, date: selectedDate }]
          : prev.filter((l) => l.habitId !== habitId)
      );
      try {
        const { streak } = await getStreak(habitId);
        setStreaks((prev) => ({ ...prev, [habitId]: streak }));
      } catch {}
    } catch {}
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddLoading(true);
    try {
      const habit = await createHabit({ name: newName.trim(), icon: newIcon });
      setHabits((prev) => [...prev, habit]);
      setNewName('');
      setNewIcon('✅');
      setShowAdd(false);
    } catch {}
    setAddLoading(false);
  };

  const handleDeleteClick = (id) => {
    if (pendingDelete === id) {
      clearTimeout(deleteTimerRef.current);
      setPendingDelete(null);
      deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setLogs((prev)   => prev.filter((l) => l.habitId !== id));
    } else {
      setPendingDelete(id);
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => setPendingDelete(null), 2500);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4 py-4">

      {/* Top row: date badge + actions */}
      <div className="flex items-center justify-between">
        <div>
          {!isToday && (
            <span className="badge-warning">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
              <button
                onClick={() => setSelectedDate(todayStr())}
                className="ml-1 opacity-70 hover:opacity-100"
                aria-label="Return to today"
              >×</button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowAdd(true)} className="btn-primary h-8 px-3 text-xs gap-1">
            <span>+</span> Add habit
          </button>
          {/* Calendar icon — overlaid input triggers native date picker */}
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
            <button
              className="btn-icon h-8 w-8"
              tabIndex={-1}
              aria-hidden="true"
            >
              <AppIcon name="calendar" size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress card */}
      <div className="card flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="68" height="68" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" strokeWidth="4"
              className="stroke-ht-elevated" />
            <circle
              cx="24" cy="24" r="20" fill="none" strokeWidth="4"
              strokeDasharray={`${CIRCUMFERENCE * completionRate / 100} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              className="stroke-ht-accent transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ht-text-1">
            {completionRate}%
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-ht-text-1 leading-none tabular-nums">
            {completedIds.size}
            <span className="text-base font-normal text-ht-text-3">/{habits.length}</span>
          </p>
          <p className="text-xs text-ht-text-2 mt-1">habits complete</p>
          <p className="text-xs text-ht-accent mt-1.5 font-medium">{getMotivation(completionRate)}</p>
        </div>
      </div>

      {/* Habits list */}
      <div className="space-y-2">
        <p className="section-label">
          {isToday ? "Today's habits" : 'Habits'}
        </p>

        {habits.length === 0 ? (
          <div className="card flex flex-col items-center text-center py-10 gap-3">
            <span className="text-4xl">🌱</span>
            <div>
              <p className="text-sm font-semibold text-ht-text-1">No habits tracked yet</p>
              <p className="text-xs text-ht-text-3 mt-1 max-w-[200px] mx-auto">
                Start with one small habit. Consistency compounds.
              </p>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-1">
              + Add your first habit
            </button>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              isCompleted={completedIds.has(habit.id)}
              onToggle={handleToggle}
              streak={streaks[habit.id] || 0}
              isPendingDelete={pendingDelete === habit.id}
              onDeleteClick={handleDeleteClick}
            />
          ))
        )}

        {pendingDelete && (
          <p className="text-[11px] text-ht-danger text-center py-0.5 animate-fade-in">
            Tap again to confirm delete
          </p>
        )}
      </div>

      {/* Year overview heatmap */}
      {heatmap.length > 0 && (
        <div className="pt-1">
          <p className="section-label mb-3">Year overview</p>
          <HabitHeatmap data={heatmap} />
        </div>
      )}

      {/* Add Habit Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setNewName(''); setNewIcon('✅'); }} title="New Habit">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="field-label">Habit name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Morning walk"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="field-label">Icon</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ICON_OPTS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={`text-xl p-2 rounded-lg border-2 transition-all ${
                    newIcon === icon
                      ? 'border-ht-accent bg-ht-accent/10'
                      : 'border-ht-border bg-ht-elevated hover:border-ht-border-2'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={addLoading}>
            {addLoading ? 'Adding...' : 'Add Habit'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

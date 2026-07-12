import { useState, useEffect, useCallback } from 'react';
import { getHabits, createHabit, deleteHabit, getHabitLogs, toggleHabitLog, getHeatmap, getStreak } from '../../api/habits.js';
import Modal from '../../components/UI/Modal.jsx';
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx';
import HabitHeatmap from './HabitHeatmap.jsx';
import { TrashIcon, PlusIcon, FireIcon } from '@heroicons/react/24/solid';

const today = () => new Date().toISOString().split('T')[0];

function HabitRow({ habit, isCompleted, onToggle, onDelete, streak }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(habit.id);
    setToggling(false);
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${
      isCompleted ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800 border-slate-700/50 hover:border-slate-600'
    }`}>
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          isCompleted ? 'bg-indigo-500 border-indigo-500 scale-110' : 'border-slate-500 hover:border-indigo-400'
        }`}
      >
        {isCompleted && <span className="text-white text-xs font-bold">✓</span>}
      </button>

      <span className="text-xl">{habit.icon}</span>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCompleted ? 'text-indigo-300 line-through' : 'text-slate-100'}`}>
          {habit.name}
        </p>
        {streak > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <FireIcon className="h-3 w-3 text-orange-400" />
            <span className="text-xs text-orange-400">{streak} day streak</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(habit.id)}
        className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('✅');
  const [addLoading, setAddLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());

  const completedIds = new Set(logs.map((l) => l.habitId));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, l, heat] = await Promise.all([getHabits(), getHabitLogs(selectedDate), getHeatmap()]);
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
      if (result.completed) {
        try {
          const { streak } = await getStreak(habitId);
          setStreaks(prev => ({ ...prev, [habitId]: streak }));
        } catch {}
      }
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

  const handleDelete = async (id) => {
    if (!confirm('Delete this habit?')) return;
    await deleteHabit(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
  };

  const completionRate = habits.length > 0 ? Math.round((completedIds.size / habits.length) * 100) : 0;

  const ICON_OPTS = ['✅', '💪', '📚', '🧘', '🏃', '🥗', '💧', '😴', '🧼', '⭐', '🎯', '🔥'];

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5 py-4">
      {/* Date selector */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={today()}
          className="input-field text-sm flex-1"
        />
        <button
          onClick={() => setSelectedDate(today())}
          className="btn-secondary text-sm py-2 px-3"
        >
          Today
        </button>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-slate-400">Daily Progress</p>
            <p className="text-2xl font-bold text-slate-100">
              {completedIds.size}/{habits.length}
              <span className="text-base font-normal text-slate-400 ml-2">habits</span>
            </p>
          </div>
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-700" />
              <circle
                cx="24" cy="24" r="20"
                fill="none" stroke="currentColor" strokeWidth="4"
                strokeDasharray={`${125.6 * completionRate / 100} 125.6`}
                className="text-indigo-500 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-100">
              {completionRate}%
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Your Habits</h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            <PlusIcon className="h-4 w-4" />
            Add habit
          </button>
        </div>
        {habits.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No habits yet. Add some!</div>
        ) : (
          habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              isCompleted={completedIds.has(habit.id)}
              onToggle={handleToggle}
              onDelete={handleDelete}
              streak={streaks[habit.id] || 0}
            />
          ))
        )}
      </div>

      {/* Heatmap */}
      {heatmap.length > 0 && <HabitHeatmap data={heatmap} />}

      {/* Add Habit Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Habit">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Habit Name</label>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Pick an Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                    newIcon === icon ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500'
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

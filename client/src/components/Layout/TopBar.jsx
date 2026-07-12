import { useLocation } from 'react-router-dom';

const titles = {
  '/': 'Habits',
  '/workouts': 'Workouts',
  '/calories': 'Calories',
  '/social': 'Social',
  '/profile': 'Profile',
};

export default function TopBar() {
  const location = useLocation();
  const title = titles[location.pathname] || 'HabiTask';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-lg font-bold text-slate-100">{title}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </header>
  );
}

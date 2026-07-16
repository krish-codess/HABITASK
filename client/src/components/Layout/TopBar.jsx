import { useLocation, Link } from 'react-router-dom';
import AppIcon from '../UI/AppIcon.jsx';

const TITLES = {
  '/app':           'Habits',
  '/app/workouts':  'Workouts',
  '/app/calories':  'Calories',
  '/app/analytics': 'Analytics',
  '/app/social':    'Social',
  '/app/profile':   'Profile',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || 'HabiTask';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🎯</span>
          <span className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
            {title}
          </span>
        </Link>
        <span className="text-xs text-slate-500 font-medium">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </header>
  );
}

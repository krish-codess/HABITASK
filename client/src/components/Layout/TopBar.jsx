import { useLocation } from 'react-router-dom';

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

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="sticky top-0 z-40 bg-ht-bg/95 backdrop-blur-md border-b border-ht-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-base font-semibold text-ht-text-1 tracking-tight">
          {title}
        </h1>
        <span className="text-xs font-medium text-ht-text-3 bg-ht-elevated border border-ht-border px-2.5 py-1 rounded-md">
          {today}
        </span>
      </div>
    </header>
  );
}

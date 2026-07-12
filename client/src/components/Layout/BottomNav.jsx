import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: '🎯', label: 'Habits' },
  { to: '/workouts', icon: '💪', label: 'Workout' },
  { to: '/calories', icon: '🥗', label: 'Calories' },
  { to: '/social', icon: '👥', label: 'Social' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 safe-area-pb">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-150 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

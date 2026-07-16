import { NavLink } from 'react-router-dom';
import AppIcon from '../UI/AppIcon.jsx';

const NAV_ITEMS = [
  { to: '/app',           icon: 'calendar',   label: 'Habits',    end: true },
  { to: '/app/workouts',  icon: 'clock',      label: 'Workout'  },
  { to: '/app/calories',  icon: 'lunchbox',   label: 'Calories' },
  { to: '/app/analytics', icon: 'all',        label: 'Analytics'},
  { to: '/app/social',    icon: 'globe',      label: 'Social'   },
  { to: '/app/profile',   icon: 'user',       label: 'Profile'  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-150 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <AppIcon name={icon} size={20} strokeWidth={1.8} />
            <span className="text-[9px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

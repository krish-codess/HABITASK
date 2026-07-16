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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-ht-bg/95 backdrop-blur-md border-t border-ht-border"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around h-[58px] px-1">
        {NAV_ITEMS.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1.5 mx-0.5 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-ht-accent bg-ht-accent/10'
                  : 'text-ht-text-3 hover:text-ht-text-2 hover:bg-ht-elevated'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <AppIcon
                  name={icon}
                  size={20}
                  strokeWidth={isActive ? 2 : 1.6}
                />
                <span className={`text-[10px] font-medium tracking-wide leading-none ${isActive ? 'text-ht-accent' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { HomeIcon, TrophyIcon, SparklesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const navItems = [
  { path: '/journal', label: 'Journal', icon: HomeIcon },
  { path: '/goals', label: 'Goals', icon: TrophyIcon },
  { path: '/insights', label: 'Insights', icon: SparklesIcon },
  { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export default function BottomNav() {
  const activeClass = "text-blue-600";
  const inactiveClass = "text-slate-500 hover:text-blue-500";

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-t-md z-20">
      <div className="max-w-md mx-auto h-full flex justify-around items-center">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center space-y-1 transition-colors ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
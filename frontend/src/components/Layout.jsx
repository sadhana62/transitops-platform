import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench, Fuel, BarChart3, LogOut, Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vehicles', label: 'Vehicle Registry', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trips', icon: RouteIcon },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

const ROLE_LABELS = {
  FleetManager: 'Fleet Manager',
  Driver: 'Driver',
  SafetyOfficer: 'Safety Officer',
  FinancialAnalyst: 'Financial Analyst',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-base-950 text-base-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-base-700 bg-base-900">
        <div className="flex items-center gap-2 border-b border-base-700 px-5 py-5">
          <Compass className="h-6 w-6 text-signal-500" strokeWidth={2.2} />
          <div>
            <p className="font-display text-base font-semibold leading-none tracking-tight">TransitOps</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-base-400 mono">Fleet Control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-base-700 text-signal-500'
                    : 'text-base-200 hover:bg-base-800 hover:text-base-100'
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-base-700 p-4">
          <p className="text-sm font-medium text-base-100">{user?.name}</p>
          <p className="mono text-[11px] text-base-400">{ROLE_LABELS[user?.role] || user?.role}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded border border-base-600 px-3 py-1.5 text-xs text-base-200 hover:border-danger-500 hover:text-danger-500"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-7xl px-8 py-7">{children}</div>
      </main>
    </div>
  );
}

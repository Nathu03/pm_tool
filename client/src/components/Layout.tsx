import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Trello, Users, Bot, GitBranch, Settings, LogOut, Bell, Umbrella, Building2 } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

const NAV = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/projects',    label: 'Projects',    icon: FolderKanban },
  { to: '/team',        label: 'Team',        icon: Users },
  { to: '/leave',       label: 'Leave',       icon: Umbrella },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/ai',          label: 'AI Assistant',icon: Bot },
  { to: '/integrations',label: 'Integrations',icon: GitBranch },
  { to: '/settings',    label: 'Settings',    icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-full overflow-hidden bg-slate-950">
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-800 flex-shrink-0">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Trello className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">TaskFlow</span>
            <span className="text-sm font-bold text-indigo-400"> AI</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent',
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex-shrink-0 bg-slate-900 border-b border-slate-800 flex items-center justify-end px-5 gap-3">
          <button className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </header>
        <main className="flex-1 overflow-hidden bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

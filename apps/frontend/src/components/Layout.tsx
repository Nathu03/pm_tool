import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Trello, Users, Bot, GitBranch, Settings, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/ai', label: 'AI Assistant', icon: Bot },
  { to: '/integrations', label: 'Integrations', icon: GitBranch },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><Trello className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-white">TaskFlow AI</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors', isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800')}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">{user?.fullName?.[0] || 'U'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-500 hover:text-slate-300">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-end px-6">
          <button className="text-slate-400 hover:text-slate-200"><Bell className="w-5 h-5" /></button>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6"><Outlet /></main>
      </div>
    </div>
  );
}

import { Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';

function Navbar() {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-8 py-4 glass border-b border-slate-800/60">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-white font-heading">Marketing Automation CRM</h3>
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
          <Sparkles className="h-3 w-3" />
          AI-powered workflows
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors cursor-pointer" title="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-700/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/30">
            {initials(user?.first_name, user?.last_name)}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-slate-400 capitalize">{user?.role ?? 'admin'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;

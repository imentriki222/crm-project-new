import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Megaphone,
  Calendar,
  Cpu,
  Sparkles,
  LogOut,
  BrainCircuit,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/leads', name: 'Leads', icon: Users },
    { to: '/pipeline', name: 'Pipeline', icon: KanbanSquare },
    { to: '/campaigns', name: 'Campaigns', icon: Megaphone },
    { to: '/calendar', name: 'Calendar', icon: Calendar },
    { to: '/automations', name: 'Automations', icon: Cpu },
    { to: '/assistant', name: 'AI Assistant', icon: Sparkles },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#0f172a] border-r border-slate-800 flex flex-col justify-between py-6 z-30 shrink-0">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 mb-8">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none font-heading">LeadFlow CRM</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">CRM & Automation</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 shadow-sm shadow-indigo-500/5'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout button */}
      <div className="px-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

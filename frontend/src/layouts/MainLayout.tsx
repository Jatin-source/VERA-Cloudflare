import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  Home, 
  Clock, 
  Users, 
  FileText,
  ShieldCheck
} from 'lucide-react';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#070b14] text-gray-200 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0a101d] border-r border-[#1a2333] flex-col z-20 shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-widest">VERA</div>
              <div className="text-[10px] text-gray-400">Voice Evidence & Risk Auth</div>
            </div>
          </div>

          <nav className="space-y-2">
            <NavItem to="/" icon={<Home size={18} />} label="Dashboard" exact />
            <NavItem to="/sessions" icon={<Clock size={18} />} label="Sessions" />
            <NavItem to="/voice-profiles" icon={<Users size={18} />} label="Voice Profiles" />
            <NavItem to="/evidence" icon={<FileText size={18} />} label="Evidence" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#1a2333]/50 flex items-center">
          <ShieldCheck className="w-7 h-7 text-blue-500 mr-3 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white tracking-wider">VERA Android / Web</div>
            <div className="text-[10px] text-emerald-400 font-mono">v2.0 • Online</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] overflow-hidden relative">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Android Native Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a101d]/95 backdrop-blur-md border-t border-[#1a2333] z-50 flex items-center justify-around py-2 px-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <MobileNavItem to="/" icon={<Home size={20} />} label="Live Call" exact />
          <MobileNavItem to="/sessions" icon={<Clock size={20} />} label="Sessions" />
          <MobileNavItem to="/voice-profiles" icon={<Users size={20} />} label="Profiles" />
          <MobileNavItem to="/evidence" icon={<FileText size={20} />} label="Evidence" />
        </nav>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, exact }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
          : 'text-gray-400 hover:bg-[#121d30]/50 hover:text-gray-200'
      }`
    }
  >
    {icon}
    <span className="ml-3 text-sm">{label}</span>
  </NavLink>
);

const MobileNavItem: React.FC<NavItemProps> = ({ to, icon, label, exact }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'text-blue-400 font-medium scale-105' 
          : 'text-gray-400 hover:text-gray-300'
      }`
    }
  >
    <div className="relative">
      {icon}
    </div>
    <span className="text-[10px] mt-1 tracking-tight">{label}</span>
  </NavLink>
);

export default MainLayout;

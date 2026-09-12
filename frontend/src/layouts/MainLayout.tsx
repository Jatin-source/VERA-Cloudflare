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
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <aside className="w-full md:w-64 bg-[#0a101d] border-t md:border-t-0 md:border-r border-[#1a2333] flex flex-row md:flex-col z-20 order-2 md:order-1 shrink-0 overflow-x-auto custom-scrollbar">
        <div className="p-2 md:p-6 flex-1 flex md:block items-center">
          <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 w-full mt-0 md:mt-4">
            <NavItem to="/" icon={<Home size={18} />} label="Dashboard" exact />
            <NavItem to="/sessions" icon={<Clock size={18} />} label="Sessions" />
            <NavItem to="/voice-profiles" icon={<Users size={18} />} label="Voice Profiles" />
            <NavItem to="/evidence" icon={<FileText size={18} />} label="Evidence" />
          </nav>
        </div>

        <div className="hidden md:flex mt-auto p-6 items-center">
          <ShieldCheck className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <div className="text-sm font-bold text-white tracking-widest">VERA</div>
            <div className="text-[10px] text-gray-500">Detect • Verify • Protect</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070b14] overflow-hidden order-1 md:order-2">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-[#1a2333] flex items-center bg-[#0a101d]">
          <ShieldCheck className="w-6 h-6 text-blue-500 mr-2" />
          <div>
            <div className="text-sm font-bold text-white tracking-widest leading-tight">VERA</div>
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
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
      `flex flex-1 md:flex-none items-center justify-center md:justify-start px-3 py-2 md:px-4 md:py-3 rounded-lg transition-all duration-300 whitespace-nowrap ${
        isActive 
          ? 'bg-[#121d30] text-blue-400 font-medium' 
          : 'text-gray-400 hover:bg-[#121d30]/50 hover:text-gray-300'
      }`
    }
  >
    {icon}
    <span className="ml-2 md:ml-3 text-xs md:text-sm">{label}</span>
  </NavLink>
);

export default MainLayout;

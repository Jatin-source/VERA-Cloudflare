import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  PhoneCall,
  Clock, 
  Users, 
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  PhoneIncoming,
  Phone,
  PhoneOff
} from 'lucide-react';
import { useVoIP } from '../context/VoIPContext';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    callState, 
    incomingCallData, 
    callerReputation, 
    acceptIncomingCall, 
    rejectIncomingCall,
    peerId,
    callDuration,
    endActiveCall
  } = useVoIP();

  const handleAcceptAndNavigate = async () => {
    await acceptIncomingCall();
    if (location.pathname !== '/call') {
      navigate('/call');
    }
  };

  const rep = incomingCallData?.reputation || callerReputation;
  const isFraud = rep?.category === 'FRAUD_CONFIRMED';
  const isScam = rep?.category === 'SCAM_SUSPECTED';
  const isVerified = rep?.category === 'VERIFIED_USER';
  const isSuspicious = rep?.category === 'SUSPICIOUS';

  const modalBorderColor = isFraud
    ? 'border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)]'
    : isScam || isSuspicious
    ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)]'
    : isVerified
    ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)]'
    : 'border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.3)]';

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
            <NavItem to="/call" icon={<PhoneCall size={18} />} label="VoIP Call" />
            <NavItem to="/sessions" icon={<Clock size={18} />} label="Sessions" />
            <NavItem to="/voice-profiles" icon={<Users size={18} />} label="Voice Profiles" />
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
        
        {/* Mobile Top Safe Area Buffer (Prevents status bar, notch & camera punch-hole overlap) */}
        <div className="md:hidden w-full bg-[#0a101d] shrink-0 h-[max(env(safe-area-inset-top),2.25rem)]" />

        {/* Floating Call Mini-Bar when call is connected outside /call */}
        {callState === 'CONNECTED' && location.pathname !== '/call' && (
          <div className="bg-blue-950/80 border-b border-blue-500/40 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-md z-30 shadow-lg">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Call with {peerId || 'Caller'}</span>
              <span className="font-mono text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded">
                {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/call')}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Return to Call
              </button>
              <button
                onClick={endActiveCall}
                className="p-1 rounded bg-red-600 hover:bg-red-500 text-white"
                title="End Call"
              >
                <PhoneOff size={14} />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Global Incoming Call Threat Dossier Modal (Pops up automatically on Dashboard or any screen) */}
        {callState === 'INCOMING_RINGING' && incomingCallData && location.pathname !== '/call' && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`bg-[#0a101d] border-2 ${modalBorderColor} p-6 md:p-8 rounded-3xl max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in duration-200 shadow-2xl`}>
              
              {/* Call Icon Avatar */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 shadow-lg ${
                isFraud 
                  ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                  : isVerified
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                  : isScam || isSuspicious
                  ? 'bg-amber-950/60 border-amber-500 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                  : 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }`}>
                {isFraud ? (
                  <ShieldAlert size={38} className="animate-pulse text-red-400" />
                ) : isVerified ? (
                  <ShieldCheck size={38} className="text-emerald-400" />
                ) : (
                  <PhoneIncoming size={36} className="animate-bounce text-blue-400" />
                )}
              </div>

              {/* Central Threat & Reputation Alert Banner */}
              {rep && (
                <div className={`p-4 rounded-2xl text-left space-y-2 border ${
                  isFraud
                    ? 'bg-red-950/80 border-red-500/60 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]'
                    : isScam
                    ? 'bg-amber-950/80 border-amber-500/60'
                    : isVerified
                    ? 'bg-emerald-950/80 border-emerald-500/60 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-[#121d30] border-[#1a2333]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide ${
                      isFraud ? 'text-red-400' : isScam ? 'text-amber-400' : isVerified ? 'text-emerald-400' : 'text-gray-300'
                    }`}>
                      {isFraud && <ShieldAlert size={15} className="animate-pulse" />}
                      {isScam && <AlertTriangle size={15} />}
                      {isVerified && <ShieldCheck size={15} />}
                      {!isFraud && !isScam && !isVerified && <UserCheck size={15} />}
                      {isFraud ? 'Threat Alert: Fraud History' : isScam ? 'Warning: Scam Suspected' : isVerified ? 'Verified Authentic Caller' : 'Neutral Caller Profile'}
                    </span>
                    <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                      isFraud ? 'bg-red-900/60 text-red-300' : isScam ? 'bg-amber-900/60 text-amber-300' : isVerified ? 'bg-emerald-900/60 text-emerald-300' : 'bg-[#1a2333] text-gray-300'
                    }`}>
                      {rep.trust_score}% Trust
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed ${
                    isFraud ? 'text-red-200 font-medium' : isScam ? 'text-amber-200' : isVerified ? 'text-emerald-200' : 'text-gray-400'
                  }`}>
                    {isFraud
                      ? `Flagged in ${rep.scam_incidents_count || 1} previous calls on network for ${rep.threat_tags?.slice(0, 2).join(', ') || 'Voice Spoofing'}.`
                      : isScam
                      ? 'Previous calls exhibited suspicious extortion or urgent impersonation patterns.'
                      : isVerified
                      ? `Voiceprint biometrically verified. Clean communication record across ${rep.total_calls_analyzed || 1} calls.`
                      : 'First time calling on VERA collective defense network. Live forensic monitoring active.'}
                  </p>

                  {rep.threat_tags && rep.threat_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rep.threat_tags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-black/50 border border-white/10 font-mono text-gray-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-blue-400 font-semibold tracking-wide uppercase">
                  Incoming VoIP Call
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {rep?.display_name || incomingCallData.caller_id}
                </h3>
                {rep?.display_name && rep.display_name !== incomingCallData.caller_id && (
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{incomingCallData.caller_id}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-6 pt-2">
                <button
                  onClick={() => rejectIncomingCall('declined')}
                  className="w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
                  title="Decline Call"
                >
                  <PhoneOff size={26} />
                </button>
                <button
                  onClick={handleAcceptAndNavigate}
                  className="w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
                  title="Accept Call"
                >
                  <Phone size={26} className="animate-pulse" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Android Native Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a101d]/95 backdrop-blur-md border-t border-[#1a2333] z-40 flex items-center justify-around py-2 px-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <MobileNavItem to="/" icon={<Home size={20} />} label="Live" exact />
          <MobileNavItem to="/call" icon={<PhoneCall size={20} />} label="Call" />
          <MobileNavItem to="/sessions" icon={<Clock size={20} />} label="Sessions" />
          <MobileNavItem to="/voice-profiles" icon={<Users size={20} />} label="Profiles" />
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

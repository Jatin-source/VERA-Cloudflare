import React, { useState } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOff, 
  User, 
  Users, 
  Radio, 
  Clock, 
  ShieldCheck, 
  Mic, 
  MicOff, 
  Volume2,
  Activity,
  Wifi,
  RadioTower,
  Cpu
} from 'lucide-react';
import { useVoIPSignaling } from '../hooks/useVoIPSignaling';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const CallScreen: React.FC = () => {
  const {
    currentUser,
    switchUser,
    onlineUsers,
    callState,
    peerId,
    callDuration,
    incomingCallData,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endActiveCall,
    isMuted,
    toggleMute,
    webrtcState,
    isAudioTapActive,
    remoteAudioLevel,
  } = useVoIPSignaling();

  const [targetUser, setTargetUser] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserId.trim()) {
      switchUser(newUserId.trim());
      setIsEditingUser(false);
      setNewUserId('');
    }
  };

  const handleStartCall = (callee: string) => {
    if (!callee || callee === currentUser) return;
    initiateCall(callee);
  };

  const availablePeers = onlineUsers.filter((u) => u !== currentUser);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header & User Identity Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a101d] border border-[#1a2333] p-4 md:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <User size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Logged In As
            </div>
            <div className="text-lg font-bold text-white tracking-wide">{currentUser}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditingUser ? (
            <>
              <button
                onClick={() => switchUser(currentUser === 'User_A' ? 'User_B' : 'User_A')}
                className="text-xs px-3 py-2 bg-[#121d30] hover:bg-[#1a2842] text-blue-400 border border-blue-500/30 rounded-xl transition-all"
              >
                Switch to {currentUser === 'User_A' ? 'User_B' : 'User_A'}
              </button>
              <button
                onClick={() => {
                  setNewUserId(currentUser);
                  setIsEditingUser(true);
                }}
                className="text-xs px-3 py-2 bg-[#101726] hover:bg-[#18233a] text-gray-300 border border-[#1a2333] rounded-xl transition-all"
              >
                Rename
              </button>
            </>
          ) : (
            <form onSubmit={handleSwitchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="Enter User ID"
                className="bg-[#0d1627] border border-blue-500/50 text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUser(false)}
                className="text-xs px-2 py-1.5 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Call State Content */}
      {callState === 'IDLE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dial Card */}
          <div className="bg-[#0a101d] border border-[#1a2333] p-5 md:p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-base">
              <PhoneCall className="text-blue-400" size={20} />
              <span>Direct Dial</span>
            </div>
            <p className="text-xs text-gray-400">
              Enter any peer username registered on the VERA signaling network.
            </p>

            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                placeholder="Peer User ID (e.g. User_B)"
                className="w-full bg-[#0d1627] border border-[#1a2333] text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => handleStartCall(targetUser.trim())}
                disabled={!targetUser.trim() || targetUser.trim() === currentUser}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                <Phone size={18} />
                <span>Call Peer</span>
              </button>
            </div>
          </div>

          {/* Online Directory Card */}
          <div className="bg-[#0a101d] border border-[#1a2333] p-5 md:p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-semibold text-base">
                <Users className="text-emerald-400" size={20} />
                <span>Online Directory</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono">
                {availablePeers.length} Active
              </span>
            </div>

            {availablePeers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#1a2333] rounded-xl text-gray-500 text-xs space-y-2">
                <Radio className="mx-auto text-gray-600 animate-pulse" size={24} />
                <p>No other peers online right now.</p>
                <p className="text-[11px] text-gray-600">
                  Open another tab or mobile device to test calling!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availablePeers.map((peer) => (
                  <div
                    key={peer}
                    className="flex items-center justify-between p-3 bg-[#0d1627] hover:bg-[#121d30] border border-[#1a2333] rounded-xl transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                      <span className="text-sm font-medium text-gray-200">{peer}</span>
                    </div>
                    <button
                      onClick={() => handleStartCall(peer)}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OUTGOING RINGING STATE */}
      {callState === 'OUTGOING_RINGING' && (
        <div className="bg-[#0a101d] border border-blue-500/30 p-8 md:p-12 rounded-3xl text-center space-y-6 shadow-[0_0_40px_rgba(37,99,235,0.15)] max-w-lg mx-auto">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-600/20 animate-ping"></div>
            <div className="w-24 h-24 rounded-full bg-[#121d30] border-2 border-blue-500 flex items-center justify-center text-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.4)]">
              <PhoneCall size={40} className="animate-bounce" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Calling {peerId}...</h3>
            <p className="text-xs text-blue-400 font-medium tracking-wide mt-1 animate-pulse">
              Waiting for answer • Ringing
            </p>
          </div>

          <button
            onClick={endActiveCall}
            className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl flex items-center justify-center space-x-2 mx-auto shadow-lg shadow-rose-600/30 transition-all"
          >
            <PhoneOff size={18} />
            <span>Cancel Call</span>
          </button>
        </div>
      )}

      {/* CONNECTED IN-CALL STATE */}
      {callState === 'CONNECTED' && (
        <div className="bg-[#0a101d] border border-emerald-500/40 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] max-w-md mx-auto text-center space-y-5">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#102026] border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <User size={38} />
            </div>
            {webrtcState === 'connected' && (
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0a101d] flex items-center justify-center text-white" title="WebRTC Active">
                <Wifi size={12} />
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{peerId}</h2>
            <div className="inline-flex items-center px-3 py-1 mt-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-xs font-mono">
              <Clock size={12} className="mr-1.5" /> {formatTimer(callDuration)}
            </div>
          </div>

          {/* WebRTC Live Status Badge */}
          <div className="p-3 bg-[#0d1627] border border-[#1a2333] rounded-2xl space-y-1 text-xs">
            <div className="flex items-center justify-center space-x-2 text-blue-400 font-medium">
              <ShieldCheck size={16} />
              <span>Two-Way VoIP Call • WebRTC Audio</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-gray-400 font-mono">
              <Activity size={12} className={webrtcState === 'connected' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'} />
              <span>P2P Media: <strong className={webrtcState === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>{webrtcState.toUpperCase()}</strong></span>
            </div>
          </div>

          {/* Milestone 3: VERA Audio Tap Live Telemetry Card */}
          <div className="p-3.5 bg-[#091120] border border-blue-500/30 rounded-2xl space-y-2 text-left shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                <RadioTower size={14} className="text-blue-400" />
                <span>VERA Remote Audio Tap</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                isAudioTapActive 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-gray-800 text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAudioTapActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                {isAudioTapActive ? 'TAP ACTIVE' : 'TAP READY'}
              </span>
            </div>

            {/* Live Audio Level Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>Incoming Voice Level</span>
                <span>{Math.round(remoteAudioLevel * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-[#070b14] rounded-full overflow-hidden border border-[#1a2333]">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.max(4, Math.min(100, remoteAudioLevel * 100))}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Cpu size={11} className="text-blue-400 shrink-0" />
              <span>Passive Web Audio tap • Speakerphone isolated</span>
            </p>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-4 pt-1">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-2xl border transition-all ${
                isMuted
                  ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-[#121d30] border-[#1a2333] text-gray-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <button
              onClick={endActiveCall}
              className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
              title="End Call"
            >
              <PhoneOff size={24} />
            </button>

            <button
              className="p-4 bg-[#121d30] border border-[#1a2333] text-gray-300 hover:text-white rounded-2xl transition-all"
              title="Speaker Audio"
            >
              <Volume2 size={22} />
            </button>
          </div>
        </div>
      )}

      {/* ENDED STATE */}
      {callState === 'ENDED' && (
        <div className="bg-[#0a101d] border border-gray-800 p-8 rounded-3xl text-center space-y-4 max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <PhoneOff size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Call Ended</h3>
            <p className="text-xs text-gray-400 mt-1">Returning to directory...</p>
          </div>
        </div>
      )}

      {/* INCOMING CALL MODAL / OVERLAY */}
      {callState === 'INCOMING_RINGING' && incomingCallData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a101d] border-2 border-blue-500/50 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.3)] max-w-sm w-full text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-blue-400 mx-auto shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <PhoneIncoming size={36} className="animate-bounce" />
            </div>

            <div>
              <p className="text-xs text-blue-400 font-medium tracking-wide uppercase">
                Incoming VoIP Call
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {incomingCallData.caller_id}
              </h3>
            </div>

            <div className="flex items-center justify-center space-x-6 pt-2">
              <button
                onClick={() => rejectIncomingCall('declined')}
                className="w-14 h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
                title="Decline"
              >
                <PhoneOff size={24} />
              </button>
              <button
                onClick={acceptIncomingCall}
                className="w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                title="Accept"
              >
                <Phone size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallScreen;

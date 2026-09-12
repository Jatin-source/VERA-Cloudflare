import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
  AlertTriangle,
  Mic, 
  MicOff, 
  Volume2,
  Activity,
  Wifi,
  RadioTower,
  Layers,
  BrainCircuit,
  Lock,
  FileText,
  Fingerprint
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
    chunksProcessedCount,
    veraSessionId,
    veraTelemetry,
    isAiConnected,
    fullTranscript,
    detectedSignals,
  } = useVoIPSignaling();

  const [targetUser, setTargetUser] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript container on new text
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fullTranscript]);

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

  // Derive risk metrics
  const riskLevel = veraTelemetry?.risk_level?.toLowerCase() || 'low';
  const overallRisk = veraTelemetry?.overall_risk_score !== undefined 
    ? Math.round(veraTelemetry.overall_risk_score * 100) 
    : 0;
  const voiceIntegrity = veraTelemetry?.voice_integrity_score !== undefined
    ? Math.round(veraTelemetry.voice_integrity_score * 100)
    : 100;
  const decision = veraTelemetry?.decision?.toUpperCase() || 'ALLOW';

  const isHighThreat = riskLevel === 'high' || riskLevel === 'critical' || decision === 'BLOCK';

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

      {/* CONNECTED IN-CALL STATE WITH LIVE AI TELEMETRY */}
      {callState === 'CONNECTED' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* CRITICAL SECURITY THREAT ALERT BANNER */}
          {isHighThreat && (
            <div className="bg-rose-950/90 border-2 border-rose-500 p-4 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-start space-x-3 animate-pulse">
              <ShieldAlert className="text-rose-400 shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  CRITICAL FRAUD / DEEPFAKE THREAT DETECTED
                </h4>
                <p className="text-xs text-rose-200 mt-1">
                  Remote caller exhibits synthetic voice anomalies or coercive fraud tactics. 
                  Do NOT share banking passwords, OTPs, or authorize money transfers.
                </p>
              </div>
            </div>
          )}

          {/* Peer & Call Controls Card */}
          <div className="bg-[#0a101d] border border-[#1a2333] p-6 rounded-3xl shadow-xl text-center space-y-5">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#102026] border-2 border-blue-500 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
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

            {/* P2P Status Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-[#121d30] border border-[#1a2333] text-gray-300 flex items-center gap-1.5 font-mono">
                <Activity size={12} className={webrtcState === 'connected' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'} />
                <span>P2P Media: <strong className={webrtcState === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>{webrtcState.toUpperCase()}</strong></span>
              </span>
              <span className="px-3 py-1 rounded-full bg-[#121d30] border border-[#1a2333] text-gray-300 flex items-center gap-1.5 font-mono">
                <RadioTower size={12} className="text-blue-400" />
                <span>Chunks: <strong>{chunksProcessedCount}</strong></span>
              </span>
              {isAudioTapActive && (
                <span className="px-3 py-1 rounded-full bg-[#121d30] border border-[#1a2333] text-gray-300 flex items-center gap-1.5 font-mono">
                  <Layers size={12} className="text-purple-400" />
                  <span>Tap: <strong className="text-purple-400">16kHz</strong></span>
                </span>
              )}
            </div>

            {/* Call Action Buttons */}
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

          {/* MILESTONE 6: REAL-TIME AI TELEMETRY DASHBOARD */}
          <div className="bg-[#0a101d] border border-[#1a2333] p-5 md:p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                <BrainCircuit className="text-purple-400" size={18} />
                <span>VERA Real-Time AI Intelligence</span>
                {veraSessionId && (
                  <span className="hidden sm:inline text-[10px] text-gray-500 font-mono">
                    ({veraSessionId.slice(0, 8)})
                  </span>
                )}
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 ${
                isAiConnected 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-gray-800 text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                {isAiConnected ? 'INFERENCE ACTIVE' : 'CONNECTING AI'}
              </span>
            </div>

            {/* Risk Gauges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Overall Risk Card */}
              <div className="p-3.5 bg-[#0d1627] border border-[#1a2333] rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    {riskLevel === 'low' ? (
                      <ShieldCheck size={13} className="text-emerald-400" />
                    ) : (
                      <ShieldAlert size={13} className="text-rose-400" />
                    )}
                    Overall Risk
                  </span>
                  <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded ${
                    riskLevel === 'low' ? 'bg-emerald-950 text-emerald-400' :
                    riskLevel === 'medium' ? 'bg-amber-950 text-amber-400' :
                    'bg-rose-950 text-rose-400'
                  }`}>
                    {riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono">{overallRisk}%</div>
                <div className="w-full h-1.5 bg-[#070b14] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      riskLevel === 'low' ? 'bg-emerald-500' :
                      riskLevel === 'medium' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${overallRisk}%` }}
                  ></div>
                </div>
              </div>

              {/* Voice Integrity (Deepfake) Card */}
              <div className="p-3.5 bg-[#0d1627] border border-[#1a2333] rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Fingerprint size={12} className="text-blue-400" />
                    Voice Authenticity
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono">{voiceIntegrity}%</div>
                <div className="w-full h-1.5 bg-[#070b14] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      voiceIntegrity > 70 ? 'bg-emerald-500' :
                      voiceIntegrity > 40 ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${voiceIntegrity}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-gray-500">
                  {voiceIntegrity < 40 ? '⚠️ Synthetic / Cloned' : 'Authentic Human'}
                </div>
              </div>

              {/* Decision Policy Card */}
              <div className="p-3.5 bg-[#0d1627] border border-[#1a2333] rounded-2xl space-y-2">
                <span className="text-gray-400 text-xs">Policy Action</span>
                <div className={`text-base font-bold font-mono px-2 py-1 rounded-xl text-center ${
                  decision === 'ALLOW' ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400' :
                  decision === 'MONITOR' ? 'bg-blue-950/80 border border-blue-500/40 text-blue-400' :
                  decision === 'CHALLENGE' ? 'bg-amber-950/80 border border-amber-500/40 text-amber-400' :
                  'bg-rose-950/80 border border-rose-500/40 text-rose-400'
                }`}>
                  {decision}
                </div>
                <div className="text-[10px] text-gray-500 text-center">
                  {decision === 'ALLOW' ? 'Safe to proceed' :
                   decision === 'MONITOR' ? 'Analyzing conversation' :
                   decision === 'CHALLENGE' ? 'Verify caller identity' :
                   'High threat risk'}
                </div>
              </div>
            </div>

            {/* Contributing Threat Signals */}
            {detectedSignals.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs text-gray-400 font-medium">Triggered Threat Signals:</span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedSignals.map((sig, i) => (
                    <span 
                      key={i} 
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300 font-mono flex items-center gap-1"
                    >
                      <AlertTriangle size={10} className="text-rose-400" />
                      {typeof sig === 'string' ? sig : (sig.rule || sig.description || 'Scam Tactic')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Live Streaming Transcript Window */}
            <div className="space-y-2 pt-2 border-t border-[#1a2333]">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <FileText size={14} className="text-blue-400" />
                  Live Voice Transcript (Whisper ASR)
                </span>
                <span className="text-[10px] font-mono text-gray-500">Auto-streaming</span>
              </div>

              <div className="p-3.5 bg-[#070b14] border border-[#1a2333] rounded-2xl min-h-[90px] max-h-40 overflow-y-auto font-mono text-xs text-gray-300 space-y-1.5 leading-relaxed">
                {fullTranscript ? (
                  <p className="text-gray-200">{fullTranscript}</p>
                ) : (
                  <div className="h-16 flex items-center justify-center space-x-2 text-gray-500 text-xs italic">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <span>Listening to remote caller audio...</span>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* Passive Audio Tap VU-Meter */}
            <div className="pt-2 border-t border-[#1a2333] space-y-1.5">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <RadioTower size={11} className="text-blue-400" />
                  Remote WebRTC Audio Tap
                </span>
                <span>{Math.round(remoteAudioLevel * 100)}% Volume</span>
              </div>
              <div className="w-full h-1.5 bg-[#070b14] rounded-full overflow-hidden border border-[#1a2333]">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.max(4, Math.min(100, remoteAudioLevel * 100))}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1">
              <span className="flex items-center gap-1">
                <Lock size={10} className="text-emerald-400" />
                Audio & AI Decoupled Failure Domains
              </span>
              <span>16,000Hz WAV Chunks</span>
            </div>
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

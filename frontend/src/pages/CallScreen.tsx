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
  VolumeX,
  Unlock,
  Activity,
  Wifi,
  RadioTower,
  Layers,
  BrainCircuit,
  Lock,
  FileText,
  Fingerprint,
  Building2,
  BadgeAlert,
  CheckCircle,
  Copy,
  ExternalLink,
  X,
  Search,
  Check,
  UserCheck,
  Shield
} from 'lucide-react';
import { useVoIP } from '../context/VoIPContext';
import { CallerLocationMap } from '../components/CallerLocationMap';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export interface OfficialEntity {
  category: string;
  name: string;
  phone: string;
  description: string;
  badge: string;
}

export const OFFICIAL_DIRECTORY: OfficialEntity[] = [
  {
    category: 'EMERGENCY & CYBER',
    name: 'National Cyber Crime Helpline',
    phone: '1930',
    description: 'Immediate reporting of online financial fraud & cyber impersonation',
    badge: 'GOVT HELPLINE'
  },
  {
    category: 'EMERGENCY & CYBER',
    name: 'Police Emergency Support',
    phone: '112',
    description: 'National emergency response support system across India',
    badge: 'EMERGENCY'
  },
  {
    category: 'EMERGENCY & CYBER',
    name: 'Telecom Fraud (DoT / Sanchar Saathi)',
    phone: '1963',
    description: 'Department of Telecommunications reporting for spoofed / scam calls',
    badge: 'GOVT TRAI'
  },
  {
    category: 'BANKING & FINANCIAL',
    name: 'Reserve Bank of India (RBI) Fraud Desk',
    phone: '14440',
    description: 'Official RBI automated helpline for banking fraud reporting',
    badge: 'CENTRAL BANK'
  },
  {
    category: 'BANKING & FINANCIAL',
    name: 'State Bank of India (SBI) Fraud Helpline',
    phone: '1800111109',
    description: '24x7 SBI cyber fraud and immediate card/account blocking helpline',
    badge: 'SBI OFFICIAL'
  },
  {
    category: 'BANKING & FINANCIAL',
    name: 'HDFC Bank Emergency Fraud Desk',
    phone: '18002583838',
    description: 'Dedicated 24/7 hotline to stop unauthorized transactions',
    badge: 'HDFC OFFICIAL'
  },
  {
    category: 'BANKING & FINANCIAL',
    name: 'ICICI Bank Fraud Reporting',
    phone: '18002667777',
    description: 'Direct line to ICICI fraud prevention cell',
    badge: 'ICICI OFFICIAL'
  },
  {
    category: 'BANKING & FINANCIAL',
    name: 'Axis Bank Emergency Cell',
    phone: '18001035577',
    description: 'Immediate support for suspected unauthorized debits or phishing',
    badge: 'AXIS OFFICIAL'
  },
  {
    category: 'BANKING & FINANCIAL',
    name: 'Punjab National Bank (PNB)',
    phone: '18001802222',
    description: 'PNB customer security and suspicious call reporting',
    badge: 'PNB OFFICIAL'
  },
  {
    category: 'BANKING & FINANCIAL',
    name: 'Kotak Mahindra Bank',
    phone: '18602662666',
    description: 'Kotak 24x7 fraud prevention helpline',
    badge: 'KOTAK OFFICIAL'
  },
  {
    category: 'TECH & COMMERCE',
    name: 'Amazon Customer Service',
    phone: '180030009009',
    description: 'Amazon verified customer care (never asks for remote desktop access)',
    badge: 'COMMERCE'
  },
  {
    category: 'TECH & COMMERCE',
    name: 'Income Tax Department (e-Filing Helpline)',
    phone: '18001030025',
    description: 'Official Income Tax helpline (tax officers never call demanding immediate wire transfer)',
    badge: 'TAX DEPT'
  }
];

const CallScreen: React.FC = () => {
  const {
    currentUser,
    switchUser,
    onlineUsers,
    callState,
    peerId,
    callerReputation,
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
    identityClaim,
    isAiConnected,
    fullTranscript,
    detectedSignals,
    isSpeakerOn,
    toggleSpeaker,
    isTouchLocked,
    toggleTouchLock,
  } = useVoIP();

  const [targetUser, setTargetUser] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [activeVerifyTab, setActiveVerifyTab] = useState<'challenge' | 'directory' | 'block'>('challenge');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [directorySearch, setDirectorySearch] = useState('');
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript container on new text
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fullTranscript]);

  // Close verification modal if call ends
  useEffect(() => {
    if (callState !== 'CONNECTED') {
      setShowVerifyModal(false);
    }
  }, [callState]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(id);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const copyChallengeScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedChallenge(true);
    setTimeout(() => setCopiedChallenge(false), 2000);
  };

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
  const overallRisk = veraTelemetry?.overall_risk_score !== undefined && veraTelemetry?.overall_risk_score !== null
    ? Math.round(veraTelemetry.overall_risk_score * 100) 
    : 0;

  // AI Voice Probability (0.0 to 1.0)
  const rawAiVoice = veraTelemetry?.ai_voice_probability !== undefined && veraTelemetry?.ai_voice_probability !== null
    ? veraTelemetry.ai_voice_probability
    : (veraTelemetry?.voice_integrity_score !== undefined && veraTelemetry?.voice_integrity_score !== null
        ? Math.max(0, 1 - (veraTelemetry.voice_integrity_score > 1 ? veraTelemetry.voice_integrity_score / 100 : veraTelemetry.voice_integrity_score))
        : 0.03); // Default clean baseline (3%) when no audio / initial connection

  const aiVoicePercent = Math.round(rawAiVoice * 100);
  const decision = veraTelemetry?.decision?.toUpperCase() || 'ALLOW';

  const isHighThreat = riskLevel === 'high' || riskLevel === 'critical' || decision === 'BLOCK' || aiVoicePercent > 60 || (identityClaim?.has_claim && overallRisk >= 75);

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

          {/* MILESTONE 17: OFFICIAL IDENTITY CLAIM & IMPERSONATION BANNER */}
          {identityClaim?.has_claim && (
            <div className="bg-[#1c1305] border-2 border-amber-500/90 p-4 sm:p-5 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.25)] space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <BadgeAlert size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Building2 size={13} />
                        Official Identity Claim Detected
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono font-semibold">
                        {identityClaim.authority_type || 'AUTHORITY'}
                      </span>
                      {identityClaim.confidence && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono">
                          {Math.round(identityClaim.confidence * 100)}% Match
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      Claiming: <span className="text-amber-200 underline decoration-amber-500/50 underline-offset-4">{identityClaim.claimed_entity}</span>
                      {identityClaim.claimed_role && (
                        <span className="text-xs font-normal text-gray-300 ml-2">({identityClaim.claimed_role})</span>
                      )}
                    </h3>
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      Caller states they represent this organization. Legitimate authorities <strong>never</strong> demand OTPs, passwords, or immediate wire transfers over incoming phone calls.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                <button
                  onClick={() => {
                    setActiveVerifyTab('challenge');
                    setShowVerifyModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <ShieldCheck size={16} />
                  <span>Verify Caller Identity</span>
                  <span className="px-1.5 py-0.2 bg-black/20 rounded text-[10px] font-mono uppercase tracking-tight">Out-of-Band</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveVerifyTab('directory');
                      setShowVerifyModal(true);
                    }}
                    className="px-3 py-2 bg-[#121d30] hover:bg-[#1a2842] text-amber-300 border border-amber-500/30 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <PhoneCall size={13} />
                    <span>Official Numbers</span>
                  </button>
                  <button
                    onClick={endActiveCall}
                    className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <PhoneOff size={13} />
                    <span>Hang Up</span>
                  </button>
                </div>
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
              {callerReputation && (
                <span className={`px-3 py-1 rounded-full border text-xs flex items-center gap-1.5 font-mono ${
                  callerReputation.category === 'VERIFIED_USER'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                    : callerReputation.category === 'FRAUD_CONFIRMED'
                    ? 'bg-red-950/60 border-red-500/40 text-red-400'
                    : callerReputation.category === 'SCAM_SUSPECTED'
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                    : 'bg-[#121d30] border-[#1a2333] text-gray-300'
                }`}>
                  <Shield size={12} />
                  <span>Trust: <strong>{callerReputation.trust_score}%</strong> ({callerReputation.category.replace('_', ' ')})</span>
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
                onClick={toggleSpeaker}
                className={`p-4 rounded-2xl border transition-all ${
                  isSpeakerOn
                    ? 'bg-[#121d30] border-[#1a2333] text-blue-400 hover:text-white'
                    : 'bg-amber-600/20 border-amber-500 text-amber-400'
                }`}
                title={isSpeakerOn ? 'Speakerphone ON' : 'Earpiece Mode'}
              >
                {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>

              <button
                onClick={toggleTouchLock}
                className={`p-4 rounded-2xl border transition-all ${
                  isTouchLocked
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                    : 'bg-[#121d30] border-[#1a2333] text-gray-300 hover:text-white'
                }`}
                title="Ear Guard (Prevent Cheek Touches)"
              >
                <Lock size={22} />
              </button>
            </div>
          </div>

          {/* CALLER GEOLOCATION MINI MAP (UI MOCKUP) */}
          <CallerLocationMap callerName={peerId || incomingCallData?.caller_id || (targetUser ? targetUser.trim() : null) || 'Remote Caller'} />

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

            {/* Risk & Identity Telemetry Gauges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

              {/* Calibrated AI Voice Likelihood / Synthetic Risk Card */}
              <div className="p-3.5 bg-[#0d1627] border border-[#1a2333] rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Fingerprint size={12} className={aiVoicePercent <= 25 ? 'text-emerald-400' : aiVoicePercent <= 60 ? 'text-amber-400' : 'text-rose-400'} />
                    AI Voice Likelihood
                  </span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    aiVoicePercent <= 25 ? 'bg-emerald-950/60 text-emerald-400' :
                    aiVoicePercent <= 60 ? 'bg-amber-950/60 text-amber-400' :
                    'bg-rose-950/60 text-rose-400'
                  }`}>
                    {aiVoicePercent <= 25 ? 'GENUINE' : aiVoicePercent <= 60 ? 'EVALUATING' : 'SYNTHETIC'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono flex items-baseline gap-1">
                  <span>{aiVoicePercent}%</span>
                  <span className="text-[10px] font-normal text-gray-400">risk</span>
                </div>
                <div className="w-full h-1.5 bg-[#070b14] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      aiVoicePercent <= 25 ? 'bg-emerald-500' :
                      aiVoicePercent <= 60 ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, aiVoicePercent))}%` }}
                  ></div>
                </div>
                <div className={`text-[10px] font-medium ${
                  aiVoicePercent <= 25 ? 'text-emerald-400' :
                  aiVoicePercent <= 60 ? 'text-amber-400' :
                  'text-rose-400'
                }`}>
                  {aiVoicePercent <= 25 ? 'Authentic Human Voice' :
                   aiVoicePercent <= 60 ? 'Acoustic Noise / Compression' :
                   '⚠️ High AI / Deepfake Threat'}
                </div>
              </div>

              {/* MILESTONE 17: Caller Identity Claim Card */}
              <div className="p-3.5 bg-[#0d1627] border border-[#1a2333] rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Building2 size={13} className={identityClaim?.has_claim ? 'text-amber-400' : 'text-gray-500'} />
                    Caller Claim
                  </span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    identityClaim?.has_claim ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {identityClaim?.has_claim ? 'CLAIM DETECTED' : 'STANDARD'}
                  </span>
                </div>
                
                <div className="text-xs font-bold text-white truncate">
                  {identityClaim?.has_claim ? (
                    <span className="text-amber-300">{identityClaim.claimed_entity}</span>
                  ) : (
                    <span className="text-gray-400 font-normal">No Authority Claim</span>
                  )}
                </div>

                {identityClaim?.has_claim ? (
                  <button
                    onClick={() => {
                      setActiveVerifyTab('challenge');
                      setShowVerifyModal(true);
                    }}
                    className="w-full py-1 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <ShieldCheck size={12} />
                    <span>Verify Identity</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-gray-500">
                    Regular peer-to-peer call
                  </div>
                )}
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

      {/* INCOMING CALL MODAL / OVERLAY WITH CENTRAL THREAT REPUTATION */}
      {callState === 'INCOMING_RINGING' && incomingCallData && (() => {
        const rep = incomingCallData.reputation || callerReputation;
        const isFraud = rep?.category === 'FRAUD_CONFIRMED';
        const isScam = rep?.category === 'SCAM_SUSPECTED';
        const isVerified = rep?.category === 'VERIFIED_USER';
        const isSuspicious = rep?.category === 'SUSPICIOUS';

        const borderColor = isFraud
          ? 'border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]'
          : isScam || isSuspicious
          ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.35)]'
          : isVerified
          ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
          : 'border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.3)]';

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`bg-[#0a101d] border-2 ${borderColor} p-6 md:p-8 rounded-3xl max-w-md w-full text-center space-y-5 animate-in fade-in zoom-in duration-200`}>
              
              {/* Call Icon Avatar */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 shadow-lg ${
                isFraud 
                  ? 'bg-red-950/60 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : isVerified
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : isScam || isSuspicious
                  ? 'bg-amber-950/60 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }`}>
                {isFraud ? (
                  <ShieldAlert size={38} className="animate-pulse" />
                ) : isVerified ? (
                  <ShieldCheck size={38} />
                ) : (
                  <PhoneIncoming size={36} className="animate-bounce" />
                )}
              </div>

              {/* Central Threat & Reputation Alert Banner */}
              {rep && (
                <div className={`p-3.5 rounded-2xl text-left space-y-1.5 border ${
                  isFraud
                    ? 'bg-red-950/80 border-red-500/50'
                    : isScam
                    ? 'bg-amber-950/80 border-amber-500/50'
                    : isVerified
                    ? 'bg-emerald-950/80 border-emerald-500/50'
                    : 'bg-[#121d30] border-[#1a2333]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide ${
                      isFraud ? 'text-red-400' : isScam ? 'text-amber-400' : isVerified ? 'text-emerald-400' : 'text-gray-300'
                    }`}>
                      {isFraud && <ShieldAlert size={14} className="animate-pulse" />}
                      {isScam && <AlertTriangle size={14} />}
                      {isVerified && <ShieldCheck size={14} />}
                      {!isFraud && !isScam && !isVerified && <UserCheck size={14} />}
                      {isFraud ? 'Threat Alert: Fraud History' : isScam ? 'Warning: Scam Suspected' : isVerified ? 'Verified Authentic Caller' : 'Neutral Caller Profile'}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isFraud ? 'bg-red-900/60 text-red-300' : isScam ? 'bg-amber-900/60 text-amber-300' : isVerified ? 'bg-emerald-900/60 text-emerald-300' : 'bg-[#1a2333] text-gray-300'
                    }`}>
                      {rep.trust_score}% Trust
                    </span>
                  </div>

                  <p className={`text-xs ${
                    isFraud ? 'text-red-300' : isScam ? 'text-amber-300' : isVerified ? 'text-emerald-300' : 'text-gray-400'
                  }`}>
                    {isFraud
                      ? `Flagged in ${rep.scam_incidents_count || 1} previous calls on the network for ${rep.threat_tags?.slice(0, 2).join(', ') || 'Voice Spoofing'}.`
                      : isScam
                      ? 'Previous calls exhibited suspicious extortion or urgent impersonation patterns.'
                      : isVerified
                      ? `Voiceprint biometrically verified. Clean communication record across ${rep.total_calls_analyzed || 1} calls.`
                      : 'First time calling on VERA collective defense network. Live forensic monitoring active.'}
                  </p>

                  {rep.threat_tags && rep.threat_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rep.threat_tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-blue-400 font-medium tracking-wide uppercase">
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
        );
      })()}
      {/* MILESTONE 18: IN-CALL OUT-OF-BAND VERIFICATION SUITE MODAL */}
      {showVerifyModal && callState === 'CONNECTED' && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0a101d] border-2 border-amber-500/60 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.25)] space-y-4 my-auto relative animate-in fade-in duration-200">
            {/* Live Audio Continuity Indicator */}
            <div className="flex items-center justify-between bg-[#121d30] border border-[#1a2333] px-3.5 py-2 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-gray-300 font-medium">
                  Live Call Active: <strong className="text-white">{peerId}</strong> ({formatTimer(callDuration)})
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Audio Non-Disrupted</span>
            </div>

            {/* Modal Header & Close */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-amber-400" size={22} />
                  <span>Out-of-Band Identity Verification</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Caller claims: <span className="text-amber-300 font-semibold">{identityClaim?.claimed_entity || 'Authority Organization'}</span>
                  {identityClaim?.claimed_role && <span className="text-gray-400"> ({identityClaim.claimed_role})</span>}
                </p>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1.5 rounded-xl bg-[#121d30] hover:bg-[#1a2842] text-gray-400 hover:text-white border border-[#1a2333] transition-all"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#070b14] border border-[#1a2333] rounded-2xl text-xs">
              <button
                onClick={() => setActiveVerifyTab('challenge')}
                className={`py-2 px-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeVerifyTab === 'challenge'
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <CheckCircle size={14} />
                <span>In-App Challenge</span>
              </button>

              <button
                onClick={() => setActiveVerifyTab('directory')}
                className={`py-2 px-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeVerifyTab === 'directory'
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <PhoneCall size={14} />
                <span>Official Directory</span>
              </button>

              <button
                onClick={() => setActiveVerifyTab('block')}
                className={`py-2 px-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeVerifyTab === 'block'
                    ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                    : 'text-gray-400 hover:text-rose-400'
                }`}
              >
                <PhoneOff size={14} />
                <span>Hang Up & Block</span>
              </button>
            </div>

            {/* TAB 1: IN-APP PUSH CHALLENGE PROTOCOL */}
            {activeVerifyTab === 'challenge' && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 bg-[#0d1627] border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                    <span>Read this verbatim to the caller:</span>
                    <button
                      onClick={() => copyChallengeScript("Before we proceed, please trigger an official in-app verification push notification to my registered mobile app. I will check it now.")}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#121d30] border border-amber-500/40 text-amber-300 hover:text-white flex items-center gap-1 transition-all"
                    >
                      {copiedChallenge ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                      <span>{copiedChallenge ? 'Copied Script!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-200 italic font-mono bg-[#070b14] p-3 rounded-xl border border-[#1a2333] leading-relaxed">
                    "Before we proceed, please trigger an official in-app verification push notification to my registered mobile app. I will check it now."
                  </p>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <span>Genuine financial fraud desks can send in-app push authorization alerts directly into your official banking app.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <span><strong>Never</strong> accept SMS links or install remote apps (AnyDesk, TeamViewer) at caller's request.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <span>If caller threatens police action, account freeze, or refuses in-app push: <strong>It is an active scam. Hang up immediately.</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VERIFIED OFFICIAL CALLBACK DIRECTORY */}
            {activeVerifyTab === 'directory' && (
              <div className="space-y-3 pt-1">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Search bank, cyber cell, or emergency helpline..."
                    className="w-full bg-[#0d1627] border border-[#1a2333] text-white text-xs pl-8 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Directory List */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {OFFICIAL_DIRECTORY
                    .filter((item) => {
                      if (!directorySearch.trim()) return true;
                      const q = directorySearch.toLowerCase();
                      return item.name.toLowerCase().includes(q) || item.phone.includes(q) || item.category.toLowerCase().includes(q);
                    })
                    .sort((a, b) => {
                      // Rank matched entity claim first
                      const claimName = (identityClaim?.claimed_entity || '').toLowerCase();
                      const matchA = claimName && a.name.toLowerCase().includes(claimName.split(' ')[0].toLowerCase());
                      const matchB = claimName && b.name.toLowerCase().includes(claimName.split(' ')[0].toLowerCase());
                      if (matchA && !matchB) return -1;
                      if (!matchA && matchB) return 1;
                      return 0;
                    })
                    .map((item, idx) => {
                      const claimName = (identityClaim?.claimed_entity || '').toLowerCase();
                      const isMatched = claimName && item.name.toLowerCase().includes(claimName.split(' ')[0].toLowerCase());
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border transition-all ${
                            isMatched
                              ? 'bg-amber-950/40 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                              : 'bg-[#0d1627] border-[#1a2333] hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-white">{item.name}</h4>
                                {isMatched && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-500 text-black font-bold rounded uppercase">
                                    Caller Claim Match
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">{item.description}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#121d30] border border-[#1a2333] text-gray-300 font-mono shrink-0">
                              {item.badge}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#1a2333]/80">
                            <span className="text-sm font-bold font-mono text-emerald-400 tracking-wider">
                              {item.phone}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(item.phone, item.phone)}
                                className="px-2.5 py-1 bg-[#121d30] hover:bg-[#1a2842] text-gray-300 hover:text-white border border-[#1a2333] rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all"
                              >
                                {copiedNumber === item.phone ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                <span>{copiedNumber === item.phone ? 'Copied!' : 'Copy'}</span>
                              </button>
                              <a
                                href={`tel:${item.phone}`}
                                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all"
                              >
                                <ExternalLink size={11} />
                                <span>Dial</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 3: SAFE HANGUP & BLOCK */}
            {activeVerifyTab === 'block' && (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-400" />
                    <span>Safe Call Termination & Protection</span>
                  </h4>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    It is always 100% safe to disconnect an incoming call. Legitimate banks and government agencies will never take punitive action against you for hanging up to verify independently.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      endActiveCall();
                      setShowVerifyModal(false);
                    }}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    <PhoneOff size={18} />
                    <span>Hang Up Active Call Now</span>
                  </button>

                  <p className="text-[10px] text-gray-500 text-center font-mono">
                    After hanging up, dial the verified official hotline from the directory tab.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div className="pt-2 border-t border-[#1a2333] flex items-center justify-end">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 bg-[#121d30] hover:bg-[#1a2842] text-gray-300 hover:text-white border border-[#1a2333] rounded-xl text-xs font-semibold transition-all"
              >
                Return to Live Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone 7: Ear Guard Screen Touch Lock Overlay */}
      {isTouchLocked && callState === 'CONNECTED' && (
        <div 
          onClick={toggleTouchLock}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
        >
          <div className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-6 animate-pulse">
            <Lock size={36} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ear Guard Active</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-8">
            Screen is touch-protected to prevent accidental cheek presses while holding the phone to your ear.
          </p>
          <div className="px-6 py-3 bg-[#121d30] border border-[#1a2333] rounded-2xl text-blue-400 font-semibold text-xs flex items-center gap-2">
            <Unlock size={16} />
            <span>Tap Anywhere to Unlock</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallScreen;

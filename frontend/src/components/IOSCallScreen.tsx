import React, { useState } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  Wifi, Battery, ChevronUp, ShieldCheck, 
  AlertTriangle, MessageSquare, X
} from 'lucide-react';
import { CallerLocationMap } from './CallerLocationMap';

export interface IOSCallScreenProps {
  callState: 'incoming' | 'active';
  callerName?: string;
  callerNumber?: string;
  relationship?: string;
  callDuration?: number;
  // VoIP Actions
  onAnswer?: () => void;
  onDecline?: () => void;
  onEndCall?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isSpeakerOn?: boolean;
  onToggleSpeaker?: () => void;
  // VERA Telemetry
  voiceIntegrityScore?: number | null; // 0.0 to 1.0 (or > 1 as percentage)
  aiVoiceProbability?: number | null;  // 0.0 to 1.0
  overallRiskScore?: number | null;    // 0.0 to 1.0
  riskLevel?: string;
  speakerMatchPercent?: number | null; // 0 to 100
  isCloneAttack?: boolean;
  liveLocationText?: string;
  transcriptText?: string;
  identityClaimText?: string;
  onOpenFullDossier?: () => void;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const IOSCallScreen: React.FC<IOSCallScreenProps> = ({
  callState,
  callerName = 'Unknown Caller',
  callerNumber,
  relationship,
  callDuration = 0,
  onAnswer,
  onDecline,
  onEndCall,
  isMuted = false,
  onToggleMute,
  isSpeakerOn = false,
  onToggleSpeaker,
  voiceIntegrityScore,
  aiVoiceProbability,
  overallRiskScore,
  riskLevel = 'low',
  speakerMatchPercent,
  isCloneAttack = false,
  liveLocationText = 'Mumbai, Maharashtra',
  transcriptText,
  identityClaimText,
  onOpenFullDossier
}) => {
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  // Derive display values
  const aiProb = aiVoiceProbability ?? (voiceIntegrityScore !== undefined && voiceIntegrityScore !== null 
    ? Math.max(0, 1 - (voiceIntegrityScore > 1 ? voiceIntegrityScore / 100 : voiceIntegrityScore))
    : 0.03);
  const aiPercent = Math.round(aiProb * 100);

  const rawIntegrity = voiceIntegrityScore !== undefined && voiceIntegrityScore !== null
    ? (voiceIntegrityScore > 1 ? voiceIntegrityScore : voiceIntegrityScore * 100)
    : Math.max(0, 100 - aiPercent);
  const integrityPercent = Math.round(rawIntegrity);

  const riskPercent = overallRiskScore !== undefined && overallRiskScore !== null
    ? Math.round(overallRiskScore > 1 ? overallRiskScore : overallRiskScore * 100)
    : Math.min(100, Math.round(aiPercent * 0.9));

  const isHighThreat = isCloneAttack || riskLevel === 'critical' || riskLevel === 'high' || aiPercent >= 60;

  return (
    <div className="w-full flex items-center justify-center p-0 md:p-6 min-h-screen bg-[#070B14]">
      {/* PHONE FRAME (Center-aligned on desktop, edge-to-edge on mobile) */}
      <div className="w-full md:w-[400px] h-[100dvh] md:h-[820px] bg-[#F5F7FA] md:rounded-[48px] md:border-[8px] md:border-[#1E293B] shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col justify-between select-none">
        
        {/* =========================================================================
            LAYER 1: TOP STATUS BAR & DYNAMIC ISLAND CONTAINER (STRICT Z-INDEX z-[60])
            ========================================================================= */}
        <div className="relative z-[60] w-full px-7 pt-3.5 pb-2 flex justify-between items-center text-slate-800">
          {/* iOS Clock */}
          <span className="text-[14px] font-semibold tracking-tight font-sans">9:41</span>

          {/* DYNAMIC ISLAND COMPONENT */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 top-2 z-50 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isIslandExpanded 
                ? 'w-[90%] max-w-[370px] h-auto max-h-[300px] p-3.5 bg-[#0a101d] border border-[#1a2333] rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] cursor-default' 
                : `w-[120px] h-8 bg-black rounded-[2rem] flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 ${
                    isHighThreat ? 'ring-2 ring-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''
                  }`
            }`}
            onClick={() => {
              if (!isIslandExpanded) setIsIslandExpanded(true);
            }}
          >
            {/* COLLAPSED STATE */}
            {!isIslandExpanded ? (
              <div className="flex items-center space-x-3 px-3">
                {/* Left Indicator Dot */}
                <span className={`w-2.5 h-2.5 rounded-full ${isHighThreat ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                {/* Center Audio Waveform Bar */}
                <div className="flex items-center space-x-0.5">
                  <span className="w-0.5 h-2 bg-slate-500 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-cyan-400 rounded-full" />
                  <span className="w-0.5 h-2 bg-slate-500 rounded-full animate-pulse" />
                </div>
                {/* Right Indicator Dot */}
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
            ) : (
              /* EXPANDED STATE (VERA Security Monitor) */
              <div className="w-full flex flex-col gap-1.5 animate-in fade-in duration-200">
                {/* Island Header */}
                <div className="flex items-center justify-between border-b border-[#1a2333] pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isHighThreat ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
                    <span className="text-[11px] font-bold tracking-wider uppercase text-gray-200 font-mono">
                      VERA Security Monitor
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIslandExpanded(false);
                    }}
                    className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[#1a2333] transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                </div>

                {/* Internal Rows Wrapper */}
                <div className="flex flex-col gap-1 text-left">
                  {/* Row 1: Voice Integrity */}
                  <div className="flex justify-between items-center border-b border-[#1a2333] pb-1 pt-0.5">
                    <span className="text-[12px] text-gray-300 font-medium">Voice Integrity</span>
                    <div className="flex flex-col items-end leading-tight">
                      <span className={`text-[15px] font-bold font-mono ${isCloneAttack || aiPercent >= 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {integrityPercent}%
                      </span>
                      <span className={`text-[10px] font-medium ${isCloneAttack || aiPercent >= 60 ? 'text-red-400' : 'text-slate-400'}`}>
                        {isCloneAttack ? 'AI VOICE CLONE' : aiPercent >= 60 ? 'SYNTHETIC RISK' : 'GENUINE HUMAN'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Overall Risk */}
                  <div className="flex justify-between items-center border-b border-[#1a2333] pb-1 pt-0.5">
                    <span className="text-[12px] text-gray-300 font-medium">Overall Threat Risk</span>
                    <div className="flex flex-col items-end leading-tight">
                      <span className={`text-[15px] font-bold font-mono ${riskPercent >= 70 ? 'text-red-400' : riskPercent >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {riskPercent}%
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-mono">
                        {riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Live Location */}
                  <div className="flex justify-between items-center border-b border-[#1a2333] pb-1 pt-0.5">
                    <span className="text-[12px] text-gray-300 font-medium">Caller Location</span>
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-[13px] font-semibold text-white truncate max-w-[180px]">
                        {liveLocationText}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        Cellular / IP Verified
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Speaker Voiceprint (Optional enrolled) */}
                  {speakerMatchPercent !== undefined && speakerMatchPercent !== null && (
                    <div className="flex justify-between items-center border-b border-[#1a2333] pb-1 pt-0.5">
                      <span className="text-[12px] text-gray-300 font-medium">Speaker Voiceprint</span>
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-[14px] font-bold font-mono text-cyan-300">
                          {speakerMatchPercent}% Match
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {relationship || 'Trusted Contact'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenFullDossier) {
                      onOpenFullDossier();
                    } else {
                      setIsDossierModalOpen(true);
                    }
                  }}
                  className="w-full mt-1.5 h-[38px] rounded-[1rem] border border-[#1a2333] bg-[#111928] hover:bg-[#182338] text-blue-400 text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <ShieldCheck size={14} />
                  <span>VIEW SECURITY ANALYSIS</span>
                </button>
              </div>
            )}
          </div>

          {/* iOS Right Status Icons */}
          <div className="flex items-center space-x-2 text-slate-800">
            <span className="text-[10px] font-semibold tracking-tighter">5G</span>
            <Wifi size={14} strokeWidth={2.5} />
            <Battery size={16} strokeWidth={2.5} />
          </div>
        </div>

        {/* =========================================================================
            LAYER 2: CALLER INFO & AVATAR (STRICT Z-INDEX z-10)
            ========================================================================= */}
        <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-6 pt-6 pb-8">
          {/* Top Caller Typography */}
          <div className="text-center w-full">
            {/* Wi-Fi / VoLTE call subtitle */}
            <div className="text-slate-500 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 mb-2">
              <Wifi size={13} className="text-slate-400" />
              <span>Incoming Wi-Fi call: VERA</span>
            </div>

            {/* Caller Name / Identifier */}
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-tight mb-1 truncate max-w-[320px] mx-auto">
              {callerName}
            </h1>

            {/* Phone Number / Relation Tag */}
            {callerNumber && (
              <div className="text-xs text-slate-500 font-mono mb-1">
                {callerNumber} {relationship ? `(${relationship})` : ''}
              </div>
            )}

            {/* Call State Subtext / Timer */}
            <div className="text-sm font-medium">
              {callState === 'incoming' ? (
                <span className="text-slate-500 animate-pulse">Incoming call...</span>
              ) : (
                <span className="text-emerald-600 font-mono font-semibold tracking-wider">
                  {formatTimer(callDuration)}
                </span>
              )}
            </div>

            {/* High Threat In-Call Indicator */}
            {isHighThreat && callState === 'active' && (
              <div className="mt-2.5 mx-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold animate-pulse">
                <AlertTriangle size={13} />
                <span>Deepfake Anomaly Detected</span>
              </div>
            )}
          </div>

          {/* Large iOS Silhouette Avatar */}
          <div className="mt-6 mb-8 flex items-center justify-center">
            <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] shadow-inner flex flex-col items-center justify-end overflow-hidden border-2 border-white/60">
              {/* Silhouette Head */}
              <div className="w-16 h-16 rounded-full bg-[#94a3b8] mb-1.5 shadow-sm" />
              {/* Silhouette Shoulders */}
              <div className="w-32 h-16 rounded-t-full bg-[#94a3b8]" />
            </div>
          </div>

          {/* =========================================================================
              LAYER 3: BOTTOM CALL CONTROLS
              ========================================================================= */}
          <div className="w-full">
            {callState === 'incoming' ? (
              /* INCOMING CALL CONTROLS */
              <div className="flex flex-col items-center w-full max-w-[320px] mx-auto space-y-4">
                {/* Message Quick Action Pill */}
                <button 
                  type="button"
                  className="bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold py-2 px-5 rounded-full shadow-sm border border-slate-200/80 flex items-center gap-2 transition-all active:scale-95"
                >
                  <MessageSquare size={13} className="text-slate-500" />
                  <span>Message</span>
                </button>

                {/* Frosted Action Pill: Decline (Left) & Answer (Right) */}
                <div className="w-full bg-white/80 backdrop-blur-md rounded-full p-2 pl-6 pr-2 flex items-center justify-between border border-slate-200/80 shadow-lg">
                  <button
                    onClick={onDecline}
                    className="text-slate-600 hover:text-red-500 text-sm font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={onAnswer}
                    className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all transform hover:scale-105 active:scale-95"
                    title="Answer Call"
                  >
                    <Phone size={24} className="fill-white" />
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE CALL CONTROLS */
              <div className="flex flex-col items-center w-full space-y-6">
                {/* Secondary In-Call Actions */}
                <div className="flex items-center justify-center gap-10">
                  {/* Mute Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={onToggleMute}
                      className={`w-16 h-16 rounded-full shadow-md flex items-center justify-center transition-all active:scale-95 ${
                        isMuted 
                          ? 'bg-slate-800 text-white shadow-slate-900/20' 
                          : 'bg-white hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <span className="text-[11px] font-medium text-slate-600 mt-1.5">
                      {isMuted ? 'Muted' : 'Mute'}
                    </span>
                  </div>

                  {/* Speaker Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={onToggleSpeaker}
                      className={`w-16 h-16 rounded-full shadow-md flex items-center justify-center transition-all active:scale-95 ${
                        isSpeakerOn 
                          ? 'bg-slate-800 text-white shadow-slate-900/20' 
                          : 'bg-white hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    </button>
                    <span className="text-[11px] font-medium text-slate-600 mt-1.5">
                      {isSpeakerOn ? 'Speaker' : 'Audio'}
                    </span>
                  </div>
                </div>

                {/* End Call Button */}
                <button
                  onClick={onEndCall}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/35 transition-all transform hover:scale-105 active:scale-95 mx-auto"
                  title="End Call"
                >
                  <PhoneOff size={30} className="fill-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECURITY AUDIT TRAY / MODAL (Triggered by "VIEW SECURITY ANALYSIS")
          ========================================================================= */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A101D] border border-[#1E293B] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <ShieldCheck size={20} className="text-cyan-400" />
                <span>Live Security & Geolocation Audit</span>
              </div>
              <button 
                onClick={() => setIsDossierModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E293B]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Geolocation Map */}
            <CallerLocationMap callerName={callerName} />

            {/* Live Transcript Snippet */}
            {transcriptText && (
              <div className="p-3.5 rounded-2xl bg-[#0E1526] border border-[#1E293B] space-y-1.5">
                <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  Live Conversational Transcript
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{transcriptText}"
                </p>
              </div>
            )}

            {/* Identity Claim */}
            {identityClaimText && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <strong>Official Authority Claim:</strong> {identityClaimText}
              </div>
            )}

            <button
              onClick={() => setIsDossierModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Back to Phone Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IOSCallScreen;

import React, { useState } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  Wifi, Battery, ChevronUp, ShieldCheck, 
  MessageSquare, X
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
  liveLocationText = 'Locating...',
  transcriptText,
  identityClaimText,
  onOpenFullDossier
}) => {
  // Start expanded by default on active call or toggleable
  const [isIslandExpanded, setIsIslandExpanded] = useState(true);
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
    <div className="w-full h-full max-h-screen flex items-center justify-center p-0 md:p-2 bg-[#070B14] overflow-hidden select-none">
      {/* PHONE FRAME (Center-aligned on desktop, edge-to-edge on mobile, zero scrollbars) */}
      <div className="w-full max-w-[390px] h-[100dvh] md:h-[min(760px,calc(100vh-16px))] bg-[#F5F7FA] md:rounded-[44px] md:border-[7px] md:border-[#1E293B] shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col justify-between select-none">
        
        {/* =========================================================================
            LAYER 1: TOP STATUS BAR & DYNAMIC ISLAND CONTAINER (STRICT Z-INDEX z-[60])
            ========================================================================= */}
        <div className="relative z-[60] w-full px-6 pt-3 pb-1 flex justify-between items-center text-slate-800">
          {/* iOS Clock */}
          <span className="text-[13px] font-semibold tracking-tight font-sans">9:41</span>

          {/* DYNAMIC ISLAND / VERA SECURITY MONITOR COMPONENT (TOP CENTRE & CLICKABLE) */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 top-2 z-50 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isIslandExpanded 
                ? 'w-[92%] max-w-[350px] p-3 sm:p-3.5 bg-[#0a101d] border border-[#1a2333] rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.7)]' 
                : `w-[124px] h-8 bg-black rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 ${
                    isHighThreat ? 'ring-2 ring-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''
                  }`
            }`}
            onClick={() => {
              if (!isIslandExpanded) setIsIslandExpanded(true);
            }}
          >
            {/* COLLAPSED STATE (Click to expand) */}
            {!isIslandExpanded ? (
              <div className="flex items-center space-x-3 px-3 w-full justify-between">
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
              /* EXPANDED STATE (VERA Security Monitor - Click Header to Collapse) */
              <div className="w-full flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                {/* Island Header: Clickable to toggle collapse */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsIslandExpanded(false);
                  }}
                  className="flex items-center justify-between border-b border-[#1a2333] pb-1.5 cursor-pointer group"
                  title="Click to minimize Dynamic Island"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isHighThreat ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className="text-[11px] font-bold tracking-wider uppercase text-gray-200 font-mono">
                      VERA SECURITY MONITOR
                    </span>
                  </div>
                  <div className="text-gray-400 group-hover:text-white p-0.5 rounded-full transition-colors">
                    <ChevronUp size={15} />
                  </div>
                </div>

                {/* Metrics Rows */}
                <div className="flex flex-col gap-1 text-left">
                  {/* Row 1: Voice Integrity */}
                  <div className="flex justify-between items-center border-b border-[#1a2333]/80 pb-1 pt-0.5">
                    <span className="text-[12px] text-gray-300 font-medium">Voice Integrity</span>
                    <div className="flex flex-col items-end leading-tight">
                      <span className={`text-[10px] font-semibold ${isCloneAttack || aiPercent >= 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isCloneAttack ? 'CLONE ATTACK' : aiPercent >= 60 ? 'SYNTHETIC RISK' : 'Genuine'}
                      </span>
                      <span className={`text-[15px] font-bold font-mono ${isCloneAttack || aiPercent >= 60 ? 'text-red-400' : 'text-white'}`}>
                        {integrityPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Overall Risk */}
                  <div className="flex justify-between items-center border-b border-[#1a2333]/80 pb-1 pt-0.5">
                    <span className="text-[12px] text-gray-300 font-medium">Overall Risk</span>
                    <div className="flex flex-col items-end leading-tight">
                      <span className={`text-[10px] font-bold font-mono uppercase ${riskPercent >= 70 ? 'text-red-400' : riskPercent >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {riskLevel}
                      </span>
                      <span className={`text-[15px] font-bold font-mono ${riskPercent >= 70 ? 'text-red-400' : riskPercent >= 40 ? 'text-amber-400' : 'text-white'}`}>
                        {riskPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Live Location */}
                  <div className="flex justify-between items-center border-b border-[#1a2333]/80 pb-1 pt-0.5">
                    <span className="text-[12px] text-gray-300 font-medium">Live Location</span>
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-[13px] font-semibold text-white truncate max-w-[170px]">
                        {liveLocationText}
                      </span>
                    </div>
                  </div>

                  {/* Optional Row 4: Speaker Voiceprint */}
                  {speakerMatchPercent !== undefined && speakerMatchPercent !== null && (
                    <div className="flex justify-between items-center border-b border-[#1a2333]/80 pb-1 pt-0.5">
                      <span className="text-[12px] text-gray-300 font-medium">Speaker Match</span>
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-[14px] font-bold font-mono text-cyan-300">
                          {speakerMatchPercent}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button: View Security Analysis */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenFullDossier) {
                      onOpenFullDossier();
                    } else {
                      setIsDossierModalOpen(true);
                    }
                  }}
                  className="w-full mt-1.5 h-[34px] rounded-[1rem] border border-[#1a2333] bg-[#111928] hover:bg-[#182338] text-blue-400 hover:text-blue-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>VIEW SECURITY ANALYSIS →</span>
                </button>
              </div>
            )}
          </div>

          {/* iOS Right Status Icons */}
          <div className="flex items-center space-x-1.5 text-slate-800">
            <span className="text-[9px] font-semibold tracking-tighter">5G</span>
            <Wifi size={13} strokeWidth={2.5} />
            <Battery size={15} strokeWidth={2.5} />
          </div>
        </div>

        {/* =========================================================================
            LAYER 2: CALLER INFO & AVATAR & CONTROLS (FITTED, STRICTLY NON-SCROLLABLE)
            ========================================================================= */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-5 py-2 overflow-hidden w-full">
          
          {/* Top Caller Typography */}
          <div className="text-center w-full min-h-[38px] flex flex-col justify-center">
            {!isIslandExpanded ? (
              /* Full Typography when island is collapsed */
              <div className="animate-in fade-in duration-200">
                <div className="text-slate-500 text-xs font-medium flex items-center justify-center gap-1 mb-1">
                  <Wifi size={12} className="text-slate-400" />
                  <span>Wi-Fi Call: VERA</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-0.5 truncate max-w-[280px] mx-auto">
                  {callerName}
                </h1>
                {callerNumber && (
                  <div className="text-[11px] text-slate-500 font-mono mb-0.5">
                    {callerNumber} {relationship ? `(${relationship})` : ''}
                  </div>
                )}
                <div className="text-xs font-semibold">
                  {callState === 'incoming' ? (
                    <span className="text-slate-500 animate-pulse">Incoming call...</span>
                  ) : (
                    <span className="text-emerald-600 font-mono tracking-wider">
                      {formatTimer(callDuration)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Compact Caller Chip when island is expanded */
              <div className="pt-1 animate-in fade-in duration-200">
                <div className="inline-flex items-center gap-2 bg-slate-200/60 border border-slate-300/60 px-3 py-1 rounded-full text-xs font-semibold text-slate-800">
                  <span className="truncate max-w-[160px]">{callerName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[11px] font-mono text-emerald-600">
                    {callState === 'active' ? formatTimer(callDuration) : 'Incoming...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Large iOS Silhouette Avatar (Responsive clamp scaling to fit perfectly) */}
          <div className="my-auto flex items-center justify-center py-2">
            <div className="w-[clamp(110px,18vh,160px)] h-[clamp(110px,18vh,160px)] rounded-full bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] shadow-inner flex flex-col items-center justify-end overflow-hidden border-2 border-white/70">
              {/* Silhouette Head */}
              <div className="w-[clamp(44px,7vh,64px)] h-[clamp(44px,7vh,64px)] rounded-full bg-[#94a3b8] mb-1 shadow-sm" />
              {/* Silhouette Shoulders */}
              <div className="w-[clamp(88px,14vh,128px)] h-[clamp(44px,7vh,64px)] rounded-t-full bg-[#94a3b8]" />
            </div>
          </div>

          {/* =========================================================================
              LAYER 3: BOTTOM CALL CONTROLS CARD (EXACT REPLICATION FROM SCREENSHOT)
              ========================================================================= */}
          <div className="w-full pb-3">
            {callState === 'incoming' ? (
              /* INCOMING CALL CONTROLS */
              <div className="w-full max-w-[330px] mx-auto flex flex-col items-center gap-3">
                {/* Message Quick Action Pill */}
                <button 
                  type="button"
                  className="bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold py-1.5 px-4 rounded-full shadow-sm border border-slate-200/80 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <MessageSquare size={13} className="text-slate-500" />
                  <span>Message</span>
                </button>

                {/* Frosted Action Card: Decline (Left) & Answer (Right) */}
                <div className="w-full bg-[#edf2f7]/85 backdrop-blur-md rounded-[2.2rem] p-3.5 sm:p-4 border border-slate-200/60 shadow-sm flex items-center justify-around">
                  {/* Decline */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={onDecline}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95 hover:scale-105"
                      title="Decline Call"
                    >
                      <PhoneOff size={22} />
                    </button>
                    <span className="text-[11px] font-medium text-slate-600 mt-1">Decline</span>
                  </div>

                  {/* Answer */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={onAnswer}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all active:scale-95 hover:scale-105"
                      title="Answer Call"
                    >
                      <Phone size={22} className="fill-white" />
                    </button>
                    <span className="text-[11px] font-medium text-slate-600 mt-1">Answer</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE CALL CONTROLS (MATCHES USER SCREENSHOT) */
              <div className="w-full max-w-[330px] mx-auto bg-[#edf2f7]/85 backdrop-blur-md rounded-[2.2rem] p-3.5 sm:p-4 border border-slate-200/60 shadow-sm flex flex-col items-center gap-3">
                {/* Secondary Actions: Mute & Speaker */}
                <div className="flex items-center justify-center gap-12 w-full">
                  {/* Mute Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={onToggleMute}
                      className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-sm flex items-center justify-center transition-all active:scale-95 ${
                        isMuted 
                          ? 'bg-slate-800 text-white' 
                          : 'bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <span className="text-[11px] font-medium text-slate-600 mt-1">
                      {isMuted ? 'Muted' : 'Mute'}
                    </span>
                  </div>

                  {/* Speaker Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={onToggleSpeaker}
                      className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-sm flex items-center justify-center transition-all active:scale-95 ${
                        isSpeakerOn 
                          ? 'bg-slate-800 text-white' 
                          : 'bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
                    </button>
                    <span className="text-[11px] font-medium text-slate-600 mt-1">
                      {isSpeakerOn ? 'Speaker' : 'Audio'}
                    </span>
                  </div>
                </div>

                {/* Big Red Circular End Call Button */}
                <button
                  onClick={onEndCall}
                  className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white flex items-center justify-center shadow-lg shadow-red-500/40 transition-all transform hover:scale-105 active:scale-95"
                  title="End Call"
                >
                  <PhoneOff size={24} className="fill-white" />
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
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
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

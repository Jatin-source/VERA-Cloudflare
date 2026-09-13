import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mic, 
  Activity, 
  MessageSquareWarning, 
  AlertOctagon, 
  Loader2, 
  Radio, 
  FileAudio, 
  Fingerprint, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Users,
  Phone,
  PhoneOff,
  RadioTower
} from 'lucide-react';
import { api, type SessionResponse, type CallerReputation } from '../services/api';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLiveDetection } from '../hooks/useLiveDetection';
import { useVoIP } from '../context/VoIPContext';

interface BatchRiskResult {
  overall_risk_score: number;
  risk_level: string;
  contributing_signals: string[];
  confidence?: number;
  voice_integrity_score?: number;
  voice_label?: string;
  voice_confidence?: number;
  speaker_similarity_score?: number | null;
  transcript?: string;
}

interface BatchDecisionResult {
  decision: string;
  escalated?: boolean;
}

type AnalysisStage =
  | 'idle'
  | 'decoding'
  | 'voice'
  | 'speech'
  | 'risk'
  | 'policy'
  | 'done'
  | 'error';

// const STAGE_LABELS: Record<AnalysisStage, string> = {
  // idle: '',
  // decoding: 'Decoding audio...',
  // voice: 'Analyzing voice integrity...',
  // speech: 'Transcribing speech...',
  // risk: 'Calculating risk score...',
  // policy: 'Evaluating policy...',
  // done: 'Analysis complete.',
  // error: 'Analysis failed.',
// };


const LiveWaveform: React.FC<{ analyser: AnalyserNode | null; isActive: boolean }> = ({ analyser, isActive }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!analyser || !isActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3B82F6';
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (canvas.height / 2);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isActive]);

  if (!isActive) {
    return (
      <div className="w-full h-12 bg-[#121d30]/30 rounded-lg border border-[#1a2333] flex items-center justify-center">
        <span className="text-xs text-gray-600 font-mono">MIC IDLE</span>
      </div>
    );
  }

  return (
    <div className="w-full h-12 bg-[#0d1627] rounded-lg border border-blue-900/50 flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
      <canvas ref={canvasRef} width={300} height={40} className="w-full h-full opacity-80" />
    </div>
  );
};

const Dashboard: React.FC = () => {
  
  const navigate = useNavigate();
  const { 
    callState, 
    incomingCallData, 
    callerReputation, 
    acceptIncomingCall, 
    rejectIncomingCall 
  } = useVoIP();
  const [reputationList, setReputationList] = useState<CallerReputation[]>([]);

  useEffect(() => {
    api.getReputationList(10).then((data) => {
      if (data && Array.isArray(data)) setReputationList(data);
    }).catch((e) => console.warn('Failed to load reputation list:', e));
  }, []);

  const [activeSession, setActiveSession] = useState<SessionResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionMode, setDetectionMode] = useState<'batch' | 'Live'>('batch');

  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>('idle');
  console.log(analysisStage);
  const [batchRisk, setBatchRisk] = useState<BatchRiskResult | null>(null);
  const [batchDecision, setBatchDecision] = useState<BatchDecisionResult | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const {
    /* isRecording, */
    /* recordingTime, */
    /* audioBlob, */
    error: recorderError,
    /* startRecording, */
    /* stopRecording, */
    clearRecording,
  } = useAudioRecorder();

  const {
    connectionState,
    telemetry,
    telemetryHistory,
    accumulatedSignals,
    accumulatedTranscript,
    error: liveError,
    startLiveDetection,
    stopLiveDetection,
    getAnalyser
  } = useLiveDetection();

  /* formatTime */

  const handleStartSession = async () => {
    setIsInitializing(true);
    setError(null);
    setBatchRisk(null);
    setBatchDecision(null);
    setDecisionError(null);
    setAnalysisStage('idle');
    clearRecording();
    if (connectionState !== 'Disconnected') stopLiveDetection();
    try {
      const session = await api.createSession();
      setActiveSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to VERA backend.');
    } finally {
      setIsInitializing(false);
    }
  };

    const handleRunAnalysis = async (blob: Blob) => {
    if (!activeSession) return;
    setBatchRisk(null);
    setBatchDecision(null);
    setDecisionError(null);
    setError(null);
    setAnalysisStage('decoding');
    try {
      setAnalysisStage('voice');
      let riskRes;
      try {
        riskRes = await api.analyzeRisk(activeSession.session_id, blob);
      } catch (riskErr) {
        setError(riskErr instanceof Error ? riskErr.message : 'Risk analysis failed.');
        setAnalysisStage('error');
        return;
      }
      const ra = riskRes.data.risk_analysis as {
        overall_risk_score: number;
        risk_level: string;
        contributing_signals: string[];
        confidence?: number;
        voice_integrity_score?: number;
        voice_label?: string;
        voice_confidence?: number;
        speaker_similarity_score?: number | null;
      };
      const extractedRisk = {
        overall_risk_score: ra.overall_risk_score,
        risk_level: ra.risk_level,
        contributing_signals: ra.contributing_signals ?? [],
        confidence: ra.confidence,
        voice_integrity_score: ra.voice_integrity_score,
        voice_label: ra.voice_label,
        voice_confidence: ra.voice_confidence,
        speaker_similarity_score: ra.speaker_similarity_score ?? null,
        transcript: riskRes.data.transcript ?? '',
      };
      setBatchRisk(extractedRisk);
      setAnalysisStage('policy');
      try {
        const decisionRes = await api.getDecision(activeSession.session_id, blob);
        setBatchDecision(decisionRes.data.policy);
      } catch (decErr) {
        setDecisionError(decErr instanceof Error ? decErr.message : 'Policy decision unavailable.');
      }
      setAnalysisStage('done');
    } catch (unexpectedErr) {
      setError(unexpectedErr instanceof Error ? unexpectedErr.message : 'Unexpected analysis error.');
      setAnalysisStage('error');
    }
  };

  const displayRiskData =
    detectionMode === 'Live' && telemetry
      ? {
          overall_risk_score: telemetry.overall_risk_score,
          risk_level: telemetry.risk_level ?? 'unavailable',
          contributing_signals: accumulatedSignals.length > 0 ? accumulatedSignals : (telemetry.signals ?? []),
          transcript: accumulatedTranscript || telemetry.transcript,
          voice_integrity_score: telemetry.voice_integrity_score,
        }
      : batchRisk
      ? {
          overall_risk_score: batchRisk.overall_risk_score,
          risk_level: batchRisk.risk_level,
          contributing_signals: batchRisk.contributing_signals,
          transcript: batchRisk.transcript,
          voice_integrity_score: batchRisk.voice_integrity_score,
        }
      : null;

  const displayDecisionData =
    detectionMode === 'Live' && telemetry
      ? { decision: telemetry.decision ?? 'unavailable' }
      : batchDecision;

  /* isProcessing */

  /* isMicActive */

  return (
    <div className="flex flex-col h-full bg-[#070b14] text-gray-200">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#1a2333] bg-[#0a101d]">
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-wide text-white">VERA</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest">Voice Evidence & Risk Auth</p>
            </div>
          </div>
          <div className="flex sm:hidden items-center px-2.5 py-1 bg-[#0d1627] rounded-lg border border-[#1a2333]">
            <Radio className={`w-3.5 h-3.5 mr-1.5 ${connectionState === 'Live' ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
            <span className="text-[11px] font-semibold">{connectionState}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <div className="flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#0d1627] rounded-lg border border-[#1a2333] shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-400">System Online</span>
              <span className="text-[8px] sm:text-[9px] text-gray-500">Port 8010</span>
            </div>
          </div>
          
          <div className="flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#0d1627] rounded-lg border border-[#1a2333] shrink-0">
            <ShieldAlert className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 mr-1.5 sm:mr-2" />
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] text-gray-500 uppercase">Session</span>
              <span className="text-[11px] sm:text-xs font-mono text-gray-300">{activeSession ? activeSession.session_id.split('-')[0] + '...' : 'NONE'}</span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center px-4 py-2 bg-[#0d1627] rounded-lg border border-[#1a2333] shrink-0">
            <Radio className={`w-4 h-4 mr-2 ${connectionState === 'Live' ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
            <span className="text-xs font-semibold">{connectionState}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 overflow-y-auto flex-1">
        
        {/* Dynamic Incoming Call Threat Banner on Dashboard */}
        {callState === 'INCOMING_RINGING' && incomingCallData && (() => {
          const rep = incomingCallData.reputation || callerReputation;
          const isFraud = rep?.category === 'FRAUD_CONFIRMED';
          const isScam = rep?.category === 'SCAM_SUSPECTED';
          const isVerified = rep?.category === 'VERIFIED_USER';

          return (
            <div className={`mb-6 p-4 md:p-5 rounded-2xl border-2 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${
              isFraud
                ? 'bg-red-950/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] text-red-200'
                : isScam
                ? 'bg-amber-950/90 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] text-amber-200'
                : isVerified
                ? 'bg-emerald-950/90 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-emerald-200'
                : 'bg-blue-950/90 border-blue-500 text-blue-200'
            }`}>
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shrink-0 border-2 shadow-lg ${
                  isFraud ? 'bg-red-900 border-red-400 text-white' :
                  isVerified ? 'bg-emerald-900 border-emerald-400 text-white' :
                  isScam ? 'bg-amber-900 border-amber-400 text-white' :
                  'bg-blue-900 border-blue-400 text-white'
                }`}>
                  {isFraud ? <ShieldAlert size={30} className="animate-pulse text-red-300" /> :
                   isVerified ? <ShieldCheck size={30} className="text-emerald-300" /> :
                   <Phone size={28} className="animate-bounce text-blue-300" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      {isFraud ? '🚨 Fraud History Alert' : isScam ? '⚠️ Scam Suspected' : isVerified ? '🛡️ Verified Caller' : 'Incoming Call'}
                    </span>
                    {rep && (
                      <span className="text-xs font-mono font-bold bg-black/50 px-2 py-0.5 rounded">
                        {rep.trust_score}% Trust
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {rep?.display_name || incomingCallData.caller_id}
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5">
                    {isFraud
                      ? `Warning: Caller flagged across network for ${rep?.threat_tags?.slice(0, 2).join(', ') || 'Voice Clone / Impersonation'}.`
                      : isVerified
                      ? `Voiceprint biometrically verified across ${rep?.total_calls_analyzed || 1} previous calls.`
                      : 'Incoming VoIP call. Live forensic monitoring active.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => rejectIncomingCall('declined')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
                >
                  <PhoneOff size={15} /> Decline
                </button>
                <button
                  onClick={async () => {
                    await acceptIncomingCall();
                    navigate('/call');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 animate-pulse"
                >
                  <Phone size={15} /> Answer & View Live
                </button>
              </div>
            </div>
          );
        })()}

        {/* Welcome & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">Live Voice Guardian</h2>
            <p className="text-xs sm:text-sm text-gray-400">Real-time voice analysis for scam & deepfake protection.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {!activeSession ? (
              <button 
                onClick={handleStartSession}
                disabled={isInitializing}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center active:scale-95"
              >
                {isInitializing ? <Loader2 size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
                Initialize Session
              </button>
            ) : (
              <>
                <button
                  onClick={connectionState === 'Disconnected' ? () => { setDetectionMode('Live'); activeSession && startLiveDetection(activeSession.session_id); } : stopLiveDetection}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 ${connectionState === 'Disconnected' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-red-600/20 text-red-500 border border-red-900/50 hover:bg-red-600/30'} text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center active:scale-95`}
                >
                  {connectionState === 'Disconnected' ? (
                    <><Mic size={16} className="mr-2" /> Start Live Mic</>
                  ) : (
                    <><div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 animate-pulse" /> Stop Mic</>
                  )}
                </button>
                
                <label className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-[#121d30] border border-[#1a2333] hover:bg-[#1a2333] text-gray-300 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95">
                  <FileAudio size={16} className="mr-2" />
                  Upload WAV
                  <input 
                    type="file" 
                    accept="audio/wav" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && activeSession) {
                        setDetectionMode('batch');
                        if(connectionState !== 'Disconnected') stopLiveDetection();
                        handleRunAnalysis(file);
                      }
                    }} 
                  />
                </label>
              </>
            )}
          </div>
        </div>
        
        {/* Error Banner */}
        {(error || liveError || recorderError || decisionError) && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertTriangle size={18} className="mr-3 shrink-0" />
            <span className="text-sm">{error || liveError || recorderError || decisionError}</span>
          </div>
        )}

        {/* 4 Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          
          {/* Voice Integrity */}
          <div className="bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center text-gray-300 font-semibold text-sm">
                <FileAudio size={16} className="text-blue-500 mr-2" />
                Voice Integrity
              </div>
              <span className="px-2 py-0.5 border border-emerald-900/50 bg-emerald-900/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {displayRiskData?.voice_integrity_score != null && (displayRiskData.voice_integrity_score < 0.5 || (displayRiskData.voice_integrity_score > 1 && displayRiskData.voice_integrity_score < 50)) ? 'Synthetic' : 'Genuine'}
              </span>
            </div>
            
            <div className="relative z-10 mb-4">
              <div className="text-4xl font-bold text-white mb-1">
                {displayRiskData?.voice_integrity_score != null 
                  ? (displayRiskData.voice_integrity_score <= 1.0 ? (displayRiskData.voice_integrity_score * 100).toFixed(1) : displayRiskData.voice_integrity_score.toFixed(1)) 
                  : '--'}%
              </div>
              <div className="w-full h-1.5 bg-[#121d30] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-full transition-all duration-1000"
                  style={{ width: `${displayRiskData?.voice_integrity_score != null ? (displayRiskData.voice_integrity_score <= 1.0 ? displayRiskData.voice_integrity_score * 100 : displayRiskData.voice_integrity_score) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-auto relative z-10">
              <div>
                <div className="text-[10px] text-gray-500">Confidence</div>
                <div className="text-xs text-white font-mono">
                  '98.4%'
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Model</div>
                <div className="text-xs text-gray-300 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                  MelodyMachine V2
                </div>
              </div>
            </div>
          </div>
          
          {/* Overall Risk */}
          <div className="bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 flex items-center shadow-lg">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="flex items-center text-gray-300 font-semibold text-sm mb-4">
                <ShieldAlert size={16} className="text-blue-500 mr-2" />
                Overall Risk
              </div>
              <div className="flex items-center space-x-6">
                {/* Ring Chart (Simulated) */}
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-[6px] border-[#121d30] border-t-emerald-400 border-r-emerald-400 transform -rotate-45 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="transform rotate-45 text-xl font-bold text-white">
                    {displayRiskData?.overall_risk_score != null ? (displayRiskData.overall_risk_score <= 1.0 ? displayRiskData.overall_risk_score * 100 : displayRiskData.overall_risk_score).toFixed(1) : '--'}%
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className={`text-lg font-bold uppercase tracking-wide ${
                    displayRiskData?.risk_level === 'critical' ? 'text-red-500' :
                    displayRiskData?.risk_level === 'high' ? 'text-orange-500' :
                    displayRiskData?.risk_level === 'medium' ? 'text-yellow-500' :
                    'text-emerald-400'
                  }`}>
                    {displayRiskData?.risk_level ? displayRiskData.risk_level.replace('_', ' ') + ' RISK' : 'LOW RISK'}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Assessed Risk Level</div>
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded text-[10px] font-bold uppercase ${
                    displayRiskData?.risk_level === 'critical' ? 'bg-red-900/30 text-red-500 border border-red-900/50' :
                    displayRiskData?.risk_level === 'high' ? 'bg-orange-900/30 text-orange-500 border border-orange-900/50' :
                    displayRiskData?.risk_level === 'medium' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-900/50' :
                    'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'
                  }`}>
                    {displayRiskData?.risk_level || 'LOW'} 
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decision */}
          <div className="bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 flex flex-col shadow-lg">
            <div className="flex items-center text-gray-300 font-semibold text-sm mb-4">
              <CheckCircle2 size={16} className="text-emerald-500 mr-2" />
              Decision
            </div>
            
            <div className={`flex-1 rounded-lg border ${
              displayDecisionData?.decision === 'block' ? 'bg-red-900/20 border-red-900/50' : 
              displayDecisionData?.decision === 'warn' ? 'bg-yellow-900/20 border-yellow-900/50' : 
              displayDecisionData?.decision === 'verify' ? 'bg-orange-900/20 border-orange-900/50' : 
              'bg-emerald-900/10 border-emerald-900/50'
            } flex flex-col items-center justify-center p-4`}>
              <div className={`text-3xl font-bold uppercase tracking-widest ${
                displayDecisionData?.decision === 'block' ? 'text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                displayDecisionData?.decision === 'warn' ? 'text-yellow-500' : 
                displayDecisionData?.decision === 'verify' ? 'text-orange-500' : 
                'text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}>
                {displayDecisionData?.decision || 'ALLOW'}
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">
                {displayDecisionData?.decision === 'block' ? 'Critical threat detected. Transaction halted.' : 'No immediate threat detected'}
              </div>
            </div>
          </div>
          
          {/* Detection Status */}
          <div className="bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center text-gray-300 font-semibold text-sm">
                <Activity size={16} className="text-blue-500 mr-2" />
                Detection Status
              </div>
              {connectionState === 'Live' ? (
                <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-900/50 text-[10px] font-bold rounded-full flex items-center uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></div> LIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 text-[10px] font-bold rounded-full flex items-center uppercase">
                  IDLE
                </span>
              )}
            </div>
            
            <ul className="space-y-4 flex-1">
              <li className="flex items-center text-sm text-gray-300">
                <div className={`w-1.5 h-1.5 rounded-full ${connectionState === 'Live' ? 'bg-emerald-500' : 'bg-gray-600'} mr-3`}></div>
                Listening...
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <div className={`w-1.5 h-1.5 rounded-full ${connectionState === 'Live' ? 'bg-emerald-500' : 'bg-gray-600'} mr-3`}></div>
                Processing 3s chunks
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <div className={`w-1.5 h-1.5 rounded-full ${connectionState === 'Disconnected' ? 'bg-gray-600' : 'bg-emerald-500'} mr-3`}></div>
                WebSocket {connectionState.toLowerCase()}
                </li>
              </ul>
              
              <div className="mt-4 w-full">
                <LiveWaveform analyser={getAnalyser()} isActive={connectionState !== 'Disconnected' && connectionState !== 'Error'} />
              </div>
          </div>
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Live Transcript */}
          <div className="col-span-1 md:col-span-4 bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 shadow-lg flex flex-col h-80">
            <div className="flex justify-between items-center mb-4 border-b border-[#1a2333] pb-3">
              <div className="flex items-center text-gray-300 font-semibold text-sm">
                <MessageSquareWarning size={16} className="text-gray-400 mr-2" />
                Live Transcript
              </div>
              {connectionState === 'Live' && (
                <span className="px-2 py-0.5 bg-blue-900/20 text-blue-400 text-[10px] rounded-full flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></div> Listening...
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {displayRiskData?.transcript ? (
                <div className="flex items-start">
                  <Activity className="text-blue-500 mt-1 mr-3 shrink-0" size={16} />
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono mb-1">00:12 [Chunk 1]</div>
                    <div className="text-sm text-gray-300 leading-relaxed italic">
                      "{displayRiskData.transcript}"
                    </div>
                  </div>
                </div>
              ) : telemetryHistory.length > 0 ? (
                telemetryHistory.map((evt, idx) => (
                  <div key={idx} className="flex items-start">
                    <Activity className="text-blue-500 mt-1 mr-3 shrink-0" size={16} />
                    <div>
                      <div className="text-[10px] text-gray-500 font-mono mb-1">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'SYS'}
                      </div>
                      <div className="text-sm text-gray-300 leading-relaxed italic">
                        "{evt.transcript || '<silence>'}"
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  No transcript data available.
                </div>
              )}
            </div>
          </div>

          {/* Middle Column (Signals & Scenario) */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-4">
            
            {/* Security Signals */}
            <div className="bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 shadow-lg flex-1">
              <div className="flex items-center text-gray-300 font-semibold text-sm mb-4">
                <Fingerprint size={16} className="text-gray-400 mr-2" />
                Security Signals
              </div>
              <div className="flex flex-wrap gap-2">
                {displayRiskData?.contributing_signals && displayRiskData.contributing_signals.length > 0 ? (
                  displayRiskData.contributing_signals.map((sig, i) => {
                    const isHigh = sig.toLowerCase().includes('otp') || sig.toLowerCase().includes('transfer') || sig.toLowerCase().includes('urgent');
                    return (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center ${
                          isHigh ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50'
                        }`}
                      >
                        {isHigh ? <AlertOctagon size={12} className="mr-1.5" /> : <ShieldAlert size={12} className="mr-1.5" />}
                        {sig.replace(/_/g, ' ')}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-500">No anomalous vectors detected</span>
                )}
              </div>
            </div>

            {/* Scenario */}
            <div className="bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 shadow-lg flex-1">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center text-gray-300 font-semibold text-sm">
                  <ShieldCheck size={16} className="text-gray-400 mr-2" />
                  Scenario
                </div>
                {displayRiskData?.risk_level === 'critical' || displayRiskData?.risk_level === 'high' ? (
                  <span className="px-2 py-0.5 border border-red-900/50 text-red-500 bg-red-900/20 text-[10px] rounded-full uppercase tracking-wider flex items-center">
                    <AlertOctagon size={10} className="mr-1" /> Suspicious Request
                  </span>
                ) : null}
              </div>
              
              <div className="flex items-center bg-[#121d30]/50 p-4 rounded-lg border border-[#1a2333]">
                <div className="p-2 bg-red-900/20 rounded-lg mr-4">
                  <Users className="text-red-400" size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200 font-medium">Suspicious request</div>
                  <div className="text-xs text-gray-500">Possible social engineering attempt detected.</div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Right Column (Timeline) */}
          <div className="col-span-1 md:col-span-4 bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 shadow-lg flex flex-col h-80">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center text-gray-300 font-semibold text-sm">
                <Activity size={16} className="text-blue-500 mr-2" />
                Live Risk Timeline
              </div>
              <span className="text-[10px] text-gray-500">Last 5 chunks</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center px-4 relative">
              <div className="absolute top-1/2 left-4 right-4 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 transform -translate-y-1/2"></div>
              
              <div className="flex justify-between relative z-10 w-full">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-[#0a101d] shadow-[0_0_10px_rgba(16,185,129,0.8)] mb-2"></div>
                  <div className="text-[10px] font-bold text-emerald-500">LOW</div>
                  <div className="text-[9px] text-gray-500">00:03</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-[#0a101d] mb-2"></div>
                  <div className="text-[10px] font-bold text-emerald-500">LOW</div>
                  <div className="text-[9px] text-gray-500">00:06</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-500 bg-[#0a101d] mb-2"></div>
                  <div className="text-[10px] font-bold text-yellow-500">MEDIUM</div>
                  <div className="text-[9px] text-gray-500">00:09</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-[#0a101d] mb-2"></div>
                  <div className="text-[10px] font-bold text-orange-500">HIGH</div>
                  <div className="text-[9px] text-gray-500">00:12</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-[#0a101d] shadow-[0_0_10px_rgba(239,68,68,0.8)] mb-2"></div>
                  <div className="text-[10px] font-bold text-red-500">CRITICAL</div>
                  <div className="text-[9px] text-gray-500">00:15</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
          
          {/* Central Caller Reputation & Threat Intelligence Feed */}
          <div className="col-span-1 md:col-span-6 bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b border-[#1a2333] pb-3">
              <div className="flex items-center text-gray-300 font-semibold text-sm">
                <RadioTower size={16} className="text-blue-400 mr-2" />
                Central Caller Reputation & Threat Intel
              </div>
              <span 
                onClick={() => navigate('/sessions')}
                className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 transition-colors font-medium"
              >
                View All Sessions
              </span>
            </div>
            
            <div className="overflow-x-auto">
              {reputationList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  Connecting to centralized network threat ledger...
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-[#1a2333]">
                      <th className="pb-2 font-normal">Caller</th>
                      <th className="pb-2 font-normal">Category</th>
                      <th className="pb-2 font-normal">Trust</th>
                      <th className="pb-2 font-normal">Threat Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reputationList.slice(0, 5).map((r) => (
                      <tr key={r.caller_id} className="border-b border-[#1a2333]/50 hover:bg-[#0d1627]/60 transition-colors">
                        <td className="py-2.5 text-gray-200 font-semibold text-xs">
                          {r.display_name || r.caller_id}
                          {r.display_name && r.display_name !== r.caller_id && (
                            <span className="block text-[10px] font-mono text-gray-500">{r.caller_id}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            r.category === 'VERIFIED_USER' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' :
                            r.category === 'FRAUD_CONFIRMED' ? 'bg-red-950/60 text-red-400 border-red-500/30' :
                            r.category === 'SCAM_SUSPECTED' ? 'bg-amber-950/60 text-amber-400 border-amber-500/30' :
                            'bg-[#121d30] text-gray-300 border-[#1a2333]'
                          }`}>
                            {r.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs font-mono font-bold text-gray-300">
                          {r.trust_score}%
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {r.threat_tags && r.threat_tags.length > 0 ? (
                              r.threat_tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-gray-300">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-500">Clean</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          {/* Quick Scenarios */}
          <div className="col-span-1 md:col-span-6 bg-[#0a101d] border border-[#1a2333] rounded-xl p-5 shadow-lg">
            <div className="flex items-center text-gray-300 font-semibold text-sm mb-4 border-b border-[#1a2333] pb-3">
              <Activity size={16} className="text-gray-400 mr-2" />
              Quick Scenarios
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#121d30]/30 border border-[#1a2333] rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-[#121d30]/60 transition-colors group">
                <MessageSquareWarning size={16} className="text-emerald-500 mb-2" />
                <div className="text-[10px] text-gray-300 text-center mb-1">Normal Conversation</div>
                <div className="text-[9px] text-emerald-500 font-bold">Safe</div>
              </div>
              <div className="bg-[#121d30]/30 border border-[#1a2333] rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-[#121d30]/60 transition-colors">
                <Users size={16} className="text-orange-500 mb-2" />
                <div className="text-[10px] text-gray-300 text-center mb-1">Suspicious Request</div>
                <div className="text-[9px] text-orange-500 font-bold">High Risk</div>
              </div>
              <div className="bg-[#121d30]/30 border border-red-900/30 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-[#121d30]/60 transition-colors">
                <ShieldAlert size={16} className="text-red-500 mb-2" />
                <div className="text-[10px] text-gray-300 text-center mb-1">OTP Scam</div>
                <div className="text-[9px] text-red-500 font-bold">Critical</div>
              </div>
              <div className="bg-[#121d30]/30 border border-red-900/30 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-[#121d30]/60 transition-colors">
                <Activity size={16} className="text-red-500 mb-2" />
                <div className="text-[10px] text-gray-300 text-center mb-1">AI Generated</div>
                <div className="text-[9px] text-red-500 font-bold">Critical</div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

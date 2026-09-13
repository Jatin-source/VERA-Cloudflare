import React, { useEffect, useState } from 'react';
import { 
  Activity, Clock, RefreshCw, Eye, ShieldAlert, 
  AlertTriangle, XCircle, ShieldCheck, 
  UserCheck, Shield, Tag, User, Cpu, RadioTower
} from 'lucide-react';
import { api, type SessionResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For modal/details view
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);



  const getReputationBadge = (category: string | undefined | null) => {
    const cat = (category || 'CLEAN_NEUTRAL').toUpperCase();
    if (cat === 'VERIFIED_USER') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
          <ShieldCheck size={11} className="mr-1 text-emerald-400" /> VERIFIED
        </span>
      );
    }
    if (cat === 'FRAUD_CONFIRMED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/70 border border-red-500/40 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <ShieldAlert size={11} className="mr-1 text-red-400" /> FRAUD CONFIRMED
        </span>
      );
    }
    if (cat === 'SCAM_SUSPECTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/30">
          <AlertTriangle size={11} className="mr-1 text-amber-400" /> SCAM SUSPECTED
        </span>
      );
    }
    if (cat === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/40 border border-amber-500/20">
          <AlertTriangle size={11} className="mr-1 text-amber-300" /> SUSPICIOUS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-300 bg-[#121d30] border border-[#1a2333]">
        <UserCheck size={11} className="mr-1 text-gray-400" /> NEUTRAL
      </span>
    );
  };

  const getTrustScoreMeter = (score: number | undefined | null) => {
    const val = typeof score === 'number' ? score : 50;
    const color = val >= 75 ? 'bg-emerald-500 text-emerald-400' : val >= 40 ? 'bg-amber-500 text-amber-400' : 'bg-red-500 text-red-400';
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-[#101726] rounded-full h-1.5 overflow-hidden border border-[#1a2333]">
          <div className={`h-full rounded-full ${color.split(' ')[0]}`} style={{ width: `${Math.max(5, val)}%` }}></div>
        </div>
        <span className={`text-xs font-mono font-bold ${color.split(' ')[1]}`}>{val}%</span>
      </div>
    );
  };

  const getRiskBadge = (risk: string | undefined | null) => {
    if (!risk) return <span className="text-vera-textMuted text-xs">Unavailable</span>;
    const r = risk.toLowerCase();
    if (r === 'low') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-vera-success bg-vera-success/10 border border-vera-success/20">LOW</span>;
    }
    if (r === 'medium') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-vera-warning bg-vera-warning/10 border border-vera-warning/20">MEDIUM</span>;
    }
    if (r === 'high') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-vera-danger bg-vera-danger/10 border border-vera-danger/20">HIGH</span>;
    }
    if (r === 'critical') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-red-500 bg-red-900/20 border border-red-700/30">CRITICAL</span>;
    }
    return <span className="text-vera-textMuted text-xs">Unavailable</span>;
  };

  const getDecisionBadge = (decision: string | undefined | null) => {
    if (!decision) return <span className="text-vera-textMuted text-xs">Unavailable</span>;
    const d = decision.toLowerCase();
    if (d === 'allow') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-vera-success bg-vera-success/10 border border-vera-success/20">ALLOW</span>;
    }
    if (d === 'warn') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-vera-warning bg-vera-warning/10 border border-vera-warning/20">WARN</span>;
    }
    if (d === 'verify' || d === 'challenge') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-vera-danger bg-vera-danger/10 border border-vera-danger/20">VERIFY</span>;
    }
    if (d === 'block') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase text-red-500 bg-red-900/20 border border-red-700/30">BLOCK</span>;
    }
    return <span className="text-vera-textMuted text-xs">Unavailable</span>;
  };

  const shortenUUID = (uuid: string) => {
    if (uuid.length <= 12) return uuid;
    return `${uuid.substring(0, 8)}...${uuid.substring(uuid.length - 4)}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full">
      
      {/* Header */}
      <div className="bg-vera-panel border border-vera-border rounded-xl shadow-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-vera-accent/20 text-vera-accent border border-vera-accent/30 flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-vera-text tracking-wide">Session & Threat History</h2>
            <p className="text-sm text-vera-textMuted">Centralized voice forensics, reputation scores, and live risk audits.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchSessions}
            disabled={loading}
            className="px-5 py-2 bg-vera-dark hover:bg-vera-border disabled:opacity-50 border border-vera-border text-vera-text rounded-lg font-medium transition-colors shadow flex items-center justify-center w-full md:w-auto text-sm"
          >
            <RefreshCw size={15} className={`mr-2 ${loading ? 'animate-spin text-vera-accent' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-vera-danger/10 px-4 py-3 rounded-lg border border-vera-danger/30 text-sm text-vera-danger flex items-center">
          <AlertTriangle size={16} className="mr-2" />
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-vera-panel border border-vera-border rounded-xl shadow-lg overflow-hidden flex flex-col">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-vera-textMuted">
            <Activity size={48} className="mb-4 text-vera-accent/50 animate-pulse" />
            <h3 className="text-lg font-medium text-vera-text mb-1 tracking-wide">Loading Central Sessions...</h3>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-vera-textMuted">
            <ShieldAlert size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-vera-text mb-2 tracking-wide">No analysis sessions yet.</h3>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-vera-accent hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg"
            >
              Start a new analysis
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-vera-dark border-b border-vera-border text-xs text-vera-textMuted uppercase tracking-wider">
                  <th className="p-4 font-semibold whitespace-nowrap">Caller / Identity</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Created</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Central Reputation</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Trust Score</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Verdict</th>
                  <th className="p-4 font-semibold text-right whitespace-nowrap">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vera-border bg-vera-panel">
                {sessions.map((session) => {
                  const callerDisplay = session.caller_name || session.caller_id || 'Unknown Caller';
                  return (
                    <tr key={session.session_id} className="hover:bg-vera-dark/50 transition-colors group">
                      {/* Caller / Identity */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-xs ${
                            session.reputation_category === 'VERIFIED_USER' 
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400' 
                              : session.reputation_category === 'FRAUD_CONFIRMED'
                              ? 'bg-red-950/50 border-red-500/40 text-red-400'
                              : 'bg-[#121d30] border-[#1a2333] text-gray-300'
                          }`}>
                            <User size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                              {callerDisplay}
                              {session.reputation_category === 'VERIFIED_USER' && (
                                <span title="Biometrically Verified">
                                  <ShieldCheck size={13} className="text-emerald-400 inline" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-gray-400 flex items-center gap-1">
                              <span title={session.session_id}>ID: {shortenUUID(session.session_id)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock size={13} className="mr-1.5 opacity-60 text-gray-400" />
                          <span>{new Date(session.created_at + 'Z').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>

                      {/* Central Reputation Category */}
                      <td className="p-4">
                        {getReputationBadge(session.reputation_category)}
                      </td>

                      {/* Trust Score */}
                      <td className="p-4">
                        {getTrustScoreMeter(session.trust_score)}
                      </td>

                      {/* Risk & Decision */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5">
                          {getRiskBadge(session.risk_level)}
                          {getDecisionBadge(session.decision)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedSession(session)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-vera-dark border border-vera-border text-vera-textMuted hover:text-vera-accent hover:border-vera-accent/50 transition-colors shadow"
                          title="View Central Intelligence Dossier"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Central Threat Intelligence Dossier Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedSession(null)}>
          <div className="bg-vera-panel border border-vera-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-vera-border bg-vera-dark">
              <h3 className="text-sm font-semibold text-white flex items-center uppercase tracking-wider">
                <Shield size={16} className="mr-2 text-vera-accent" /> Caller Threat Dossier
              </h3>
              <button 
                onClick={() => setSelectedSession(null)}
                className="text-vera-textMuted hover:text-white transition-colors p-1"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Profile Card */}
              <div className="bg-[#0a101d] border border-[#1a2333] p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border ${
                    selectedSession.reputation_category === 'VERIFIED_USER' 
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                      : selectedSession.reputation_category === 'FRAUD_CONFIRMED'
                      ? 'bg-red-950/60 border-red-500/40 text-red-400'
                      : 'bg-[#121d30] border-[#1a2333] text-gray-300'
                  }`}>
                    <User size={22} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                      {selectedSession.caller_name || selectedSession.caller_id || 'Unknown Caller'}
                    </h4>
                    <span className="text-xs font-mono text-gray-400">
                      {selectedSession.caller_id || 'No Number Available'}
                    </span>
                  </div>
                </div>
                <div>
                  {getReputationBadge(selectedSession.reputation_category)}
                </div>
              </div>

              {/* Central Ledger Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a101d] border border-[#1a2333] p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider block">Network Trust Score</span>
                  <div className="pt-1">
                    {getTrustScoreMeter(selectedSession.trust_score)}
                  </div>
                </div>
                <div className="bg-[#0a101d] border border-[#1a2333] p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider block">Scam Incidents Count</span>
                  <span className={`text-base font-bold font-mono ${
                    (selectedSession.scam_count || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {selectedSession.scam_count || 0} Flags Recorded
                  </span>
                </div>
              </div>

              {/* Threat Tags */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Tag size={12} className="text-vera-accent" /> Forensic Threat & Trust Tags
                </span>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {selectedSession.threat_tags && selectedSession.threat_tags.length > 0 ? (
                    selectedSession.threat_tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono border ${
                          tag.toLowerCase().includes('clone') || tag.toLowerCase().includes('scam') || tag.toLowerCase().includes('anomaly')
                            ? 'bg-red-950/50 border-red-500/30 text-red-400'
                            : tag.toLowerCase().includes('verified')
                            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#121d30] border-[#1a2333] text-gray-300'
                        }`}
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">No threat tags associated with this record.</span>
                  )}
                </div>
              </div>

              {/* Session Analysis Breakdown */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-vera-border">
                <div>
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider block mb-1.5">Session Risk</span>
                  {getRiskBadge(selectedSession.risk_level)}
                </div>
                <div>
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider block mb-1.5">Policy Decision</span>
                  {getDecisionBadge(selectedSession.decision)}
                </div>
              </div>

              {/* Autonomous AI Conversation & Threat Intelligence Card */}
              <div className="pt-3 border-t border-vera-border space-y-3">
                <div className="bg-[#070b14] border border-[#1a2333] p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Cpu size={13} /> Autonomous AI Conversation Analysis
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-500/30">
                      Neural Engine v2.4
                    </span>
                  </div>

                  {/* Autonomous Verdict Description */}
                  <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                    selectedSession.reputation_category === 'FRAUD_CONFIRMED'
                      ? 'bg-red-950/40 border-red-500/30 text-red-200'
                      : selectedSession.reputation_category === 'SCAM_SUSPECTED'
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                      : selectedSession.reputation_category === 'VERIFIED_USER'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-[#121d30]/60 border-[#1a2333] text-gray-300'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-white">
                      {selectedSession.reputation_category === 'FRAUD_CONFIRMED' ? (
                        <>
                          <ShieldAlert size={14} className="text-red-400" />
                          <span className="text-red-400">Autonomous Verdict: Confirmed Fraud History</span>
                        </>
                      ) : selectedSession.reputation_category === 'SCAM_SUSPECTED' ? (
                        <>
                          <AlertTriangle size={14} className="text-amber-400" />
                          <span className="text-amber-400">Autonomous Verdict: High Scam Probability</span>
                        </>
                      ) : selectedSession.reputation_category === 'VERIFIED_USER' ? (
                        <>
                          <ShieldCheck size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Autonomous Verdict: Verified Authentic Caller</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} className="text-blue-400" />
                          <span className="text-blue-400">Autonomous Verdict: Neutral Communication Baseline</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300">
                      {selectedSession.reputation_category === 'FRAUD_CONFIRMED'
                        ? 'VERA detected synthetic deepfake speech artifacts, spoofed spectral harmonics, or fraudulent social engineering patterns during conversation analysis. Flagged across the decentralized network.'
                        : selectedSession.reputation_category === 'SCAM_SUSPECTED'
                        ? 'Conversational transcription exhibited urgent financial extortion patterns, pressure tactics, or unverified claims. Elevated risk latch active.'
                        : selectedSession.reputation_category === 'VERIFIED_USER'
                        ? 'Speaker acoustic features match registered voice embeddings with >95% biometric authenticity. Clean conversational history recorded.'
                        : 'No synthetic acoustic anomalies or deceptive speech cues detected in conversation. Standard baseline monitoring active.'}
                    </p>
                  </div>

                  {/* Automated Network Dispatch Notice */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono bg-[#0d1627] p-2.5 rounded-lg border border-[#1a2333]">
                    <RadioTower size={14} className="text-blue-400 shrink-0 animate-pulse" />
                    <span>
                      <strong>Network Intelligence:</strong> This verified or fraud status is automatically rendered on the other user's dashboard when this caller initiates a call.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sessions;

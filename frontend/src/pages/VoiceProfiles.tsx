import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, Mic, Square, 
  Upload, ShieldCheck, AlertTriangle, Search, Activity, 
  Phone, Clock, Sparkles, CheckCircle2, Volume2, X, RefreshCw,
  Fingerprint, FileAudio
} from 'lucide-react';
import { api, type VoiceProfile } from '../services/api';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const RELATIONSHIP_OPTIONS = [
  { label: 'Family', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { label: 'Colleague', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { label: 'VIP / Executive', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { label: 'Friend', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { label: 'Official / Banker', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
];

const VoiceProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Enrollment Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Delete confirmation
  const [profileToDelete, setProfileToDelete] = useState<VoiceProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Audio Recorder Hook
  const {
    isRecording,
    recordingTime,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording
  } = useAudioRecorder();

  // Load profiles from backend
  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVoiceProfiles();
      setProfiles(data);
    } catch (err: any) {
      console.error('Failed to load voice profiles:', err);
      setError(err?.message || 'Failed to fetch voice profiles from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Update preview URL when recording finishes or file changes
  useEffect(() => {
    if (activeTab === 'record' && audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (activeTab === 'upload' && uploadFile) {
      const url = URL.createObjectURL(uploadFile);
      setAudioPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioPreviewUrl(null);
    }
  }, [audioBlob, uploadFile, activeTab]);

  const handleOpenModal = () => {
    setUserId('');
    setDisplayName('');
    setRelationship('Family');
    setActiveTab('record');
    setUploadFile(null);
    setAudioPreviewUrl(null);
    setEnrollError(null);
    clearRecording();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isRecording) {
      stopRecording();
    }
    clearRecording();
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setEnrollError(null);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError(null);

    if (!userId.trim()) {
      setEnrollError('Caller Phone Number or Identifier is required');
      return;
    }
    if (!displayName.trim()) {
      setEnrollError('Contact Name is required');
      return;
    }

    let finalAudioBlob: Blob | null = null;
    if (activeTab === 'record') {
      if (!audioBlob || audioBlob.size < 4000) {
        setEnrollError('Please record at least 2 seconds of clear speech');
        return;
      }
      finalAudioBlob = audioBlob;
    } else {
      if (!uploadFile) {
        setEnrollError('Please select a valid audio file to upload');
        return;
      }
      finalAudioBlob = uploadFile;
    }

    setEnrolling(true);
    try {
      await api.enrollVoiceProfile({
        userId: userId.trim(),
        displayName: displayName.trim(),
        relationship: relationship.trim(),
        audioBlob: finalAudioBlob
      });
      handleCloseModal();
      await loadProfiles();
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setEnrollError(err?.message || 'Failed to enroll voice profile');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    setDeleting(true);
    try {
      await api.deleteVoiceProfile(profileToDelete.profile_id);
      setProfileToDelete(null);
      await loadProfiles();
    } catch (err: any) {
      alert(`Failed to delete profile: ${err?.message || 'Server error'}`);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered profiles
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = 
      (p.display_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.user_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.relationship?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'All') return matchesSearch;
    return matchesSearch && p.relationship?.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  const totalVerifiedCalls = profiles.reduce((acc, p) => acc + (p.total_calls_verified || 0), 0);

  const getRelationshipStyle = (rel?: string) => {
    const found = RELATIONSHIP_OPTIONS.find(opt => opt.label.toLowerCase().includes((rel || '').toLowerCase()));
    return found?.color || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-16 w-full animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Fingerprint size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Trusted Speaker Profiles
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-medium">
                BIOMETRIC SHIELD
              </span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Enroll verified contacts with high-fidelity acoustic voiceprints. VERA matches incoming calls in real time to instantly neutralize AI voice clones and impersonation fraud.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadProfiles} 
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#232E48] bg-[#0E1526]/80 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
            title="Refresh Directory"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={handleOpenModal}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all transform active:scale-95"
          >
            <Plus size={18} className="mr-2" />
            Add Trusted Speaker
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A101D]/80 border border-[#1E293B] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-mono uppercase tracking-wider">Enrolled Voiceprints</div>
            <div className="text-2xl font-bold text-white mt-1">{profiles.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Acoustic models registered</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-[#0A101D]/80 border border-[#1E293B] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-mono uppercase tracking-wider">Calls Authenticated</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{totalVerifiedCalls}</div>
            <div className="text-xs text-emerald-500/80 mt-0.5">Real-time voiceprint matches</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-[#0A101D]/80 border border-[#1E293B] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-mono uppercase tracking-wider">Impersonation Shield</div>
            <div className="text-xl font-bold text-cyan-400 mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              ACTIVE
            </div>
            <div className="text-xs text-cyan-500/80 mt-0.5">Detects deepfakes mimicking contacts</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Fingerprint size={22} />
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search contact, phone, or relation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A101D]/80 border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Family', 'Colleague', 'VIP', 'Friend'].map(pill => (
            <button
              key={pill}
              onClick={() => setSelectedFilter(pill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === pill
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#0E1526] text-slate-400 border border-[#1E293B] hover:text-white'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Profiles Directory Grid */}
      {loading ? (
        <div className="bg-[#0A101D]/60 border border-[#1E293B] rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
          <RefreshCw size={36} className="animate-spin text-cyan-400 mb-3" />
          <p className="text-sm">Loading biometric speaker profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="bg-[#0A101D]/60 border border-[#1E293B] rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {profiles.length === 0 ? 'No Trusted Profiles Enrolled Yet' : 'No Matching Contacts Found'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            {profiles.length === 0
              ? 'Add trusted family members, colleagues, or VIPs. When they call, VERA will automatically verify their authentic acoustic voiceprint and block AI-synthesized clones.'
              : 'Try changing your search query or filter tags.'}
          </p>
          {profiles.length === 0 && (
            <button
              onClick={handleOpenModal}
              className="flex items-center px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-medium shadow-lg transition-all"
            >
              <Plus size={16} className="mr-2" />
              Enroll First Voiceprint
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProfiles.map(p => {
            const bio = p.features || {};
            return (
              <div 
                key={p.profile_id}
                className="bg-[#0A101D]/90 border border-[#1E293B] hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-[0_4px_25px_rgba(6,182,212,0.1)] group relative overflow-hidden"
              >
                {/* Top decorative glow */}
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all pointer-events-none" />

                <div>
                  {/* Card Header: Avatar & Info */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-lg shadow-inner">
                        {p.display_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {p.display_name}
                        </h3>
                        <div className="flex items-center text-xs text-slate-400 mt-0.5">
                          <Phone size={11} className="mr-1 text-slate-500" />
                          <span className="font-mono">{p.user_id}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${getRelationshipStyle(p.relationship)}`}>
                      {p.relationship}
                    </span>
                  </div>

                  {/* Biometric Voiceprint Metrics Card */}
                  <div className="bg-[#0E1526]/80 rounded-xl p-3 border border-[#1A2338] space-y-2 mb-4 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center">
                        <Activity size={12} className="mr-1.5 text-cyan-400" />
                        Pitch (F0):
                      </span>
                      <span className="text-white font-semibold">
                        {bio.pitch_mean_hz ? `${bio.pitch_mean_hz} Hz` : 'Calibrated'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center">
                        <Sparkles size={12} className="mr-1.5 text-blue-400" />
                        Timbre Centroid:
                      </span>
                      <span className="text-slate-200">
                        {bio.spectral_centroid_hz ? `${Math.round(bio.spectral_centroid_hz)} Hz` : '128-dim acoustic'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1.5 text-purple-400" />
                        Sample Duration:
                      </span>
                      <span className="text-slate-300">{p.sample_duration}s reference</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-[#1E293B]">
                      <span className="flex items-center text-emerald-400">
                        <CheckCircle2 size={12} className="mr-1.5" />
                        Calls Verified:
                      </span>
                      <span className="text-emerald-300 font-bold">{p.total_calls_verified || 0}</span>
                    </div>
                  </div>

                  {/* Shield Status Bar */}
                  <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-800/30 text-cyan-300 mb-4">
                    <div className="flex items-center">
                      <ShieldCheck size={13} className="mr-1.5 text-cyan-400" />
                      <span>Live AI Clone Defense</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-cyan-400">Active</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1E293B] text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Enrolled {new Date(p.created_at).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => setProfileToDelete(p)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Voice Profile"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enrollment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0A101D] border border-[#1E293B] rounded-2xl max-w-lg w-full p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Enroll Trusted Voice Profile</h3>
                  <p className="text-xs text-slate-400">Extract high-dimensional acoustic voiceprint</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1E293B] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {enrollError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center">
                <AlertTriangle size={15} className="mr-2 flex-shrink-0" />
                <span>{enrollError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              {/* Caller Phone / User ID */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Phone Number or Caller ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210 or Shivvy"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="w-full bg-[#0E1526] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Contact Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mom, Dad, CFO, Shivvy"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[#0E1526] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Relationship Pills */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Relationship Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {RELATIONSHIP_OPTIONS.map(opt => (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => setRelationship(opt.label)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        relationship === opt.label
                          ? `${opt.color} ring-1 ring-cyan-400 font-semibold shadow-sm`
                          : 'bg-[#0E1526] border-[#1E293B] text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Source Tabs */}
              <div className="pt-2">
                <div className="flex border-b border-[#1E293B] mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('record')}
                    className={`flex items-center pb-2 px-3 text-xs font-medium border-b-2 transition-all ${
                      activeTab === 'record'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mic size={14} className="mr-1.5" />
                    Record Voice Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center pb-2 px-3 text-xs font-medium border-b-2 transition-all ${
                      activeTab === 'upload'
                        ? 'border-cyan-400 text-cyan-300'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload size={14} className="mr-1.5" />
                    Upload Audio File
                  </button>
                </div>

                {/* Record Tab */}
                {activeTab === 'record' && (
                  <div className="bg-[#0E1526] border border-[#1E293B] rounded-xl p-5 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-400 mb-4 max-w-sm">
                      Have the speaker talk clearly for 3–5 seconds:
                      <br />
                      <span className="text-cyan-300 font-medium">"Hello, this is my verified voice sample for VERA."</span>
                    </p>

                    <div className="flex flex-col items-center gap-3">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all"
                        >
                          <Mic size={28} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-16 h-16 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center text-white animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all"
                        >
                          <Square size={24} />
                        </button>
                      )}

                      <div className="text-xs font-mono">
                        {isRecording ? (
                          <span className="text-red-400 animate-pulse font-bold">
                            RECORDING: {recordingTime}s (Speak now...)
                          </span>
                        ) : audioBlob ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 size={14} /> Voice Sample Captured ({recordingTime}s)
                          </span>
                        ) : (
                          <span className="text-slate-500">Click microphone to record</span>
                        )}
                      </div>
                    </div>

                    {recorderError && (
                      <p className="text-red-400 text-xs mt-2">{recorderError}</p>
                    )}
                  </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                  <div className="bg-[#0E1526] border border-dashed border-[#1E293B] hover:border-cyan-500/50 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors">
                    <FileAudio size={32} className="text-cyan-400 mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-xs font-semibold text-cyan-300 hover:underline">
                        Choose Audio File
                      </span>
                      <input
                        type="file"
                        accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1">Supports WAV, MP3, M4A, OGG, WEBM</p>
                    {uploadFile && (
                      <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Preview Player */}
                {audioPreviewUrl && (
                  <div className="mt-3 p-3 rounded-xl bg-[#080D18] border border-[#1E293B] flex items-center justify-between">
                    <div className="flex items-center text-xs text-slate-400">
                      <Volume2 size={14} className="mr-2 text-cyan-400" />
                      <span>Audio Preview:</span>
                    </div>
                    <audio src={audioPreviewUrl} controls className="h-8 max-w-[220px]" />
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={enrolling}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling || (!audioBlob && !uploadFile)}
                  className="flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {enrolling ? (
                    <>
                      <RefreshCw size={14} className="mr-2 animate-spin" />
                      Extracting Biometric Imprint...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={14} className="mr-2" />
                      Save & Enroll Voiceprint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0A101D] border border-red-500/30 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Delete Voice Profile?</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove the enrolled voiceprint for{' '}
              <strong className="text-white">{profileToDelete.display_name}</strong> ({profileToDelete.user_id})? 
              VERA will no longer perform speaker match or clone comparison for this caller.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setProfileToDelete(null)}
                disabled={deleting}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceProfiles;


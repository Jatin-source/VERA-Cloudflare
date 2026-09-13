export interface HealthResponse {
  status: string;
  database: string;
}

export interface SessionCreateRequest {
  caller_id?: string;
}

export interface CallerReputation {
  id?: number;
  caller_id: string;
  display_name: string;
  category: 'VERIFIED_USER' | 'CLEAN_NEUTRAL' | 'SUSPICIOUS' | 'SCAM_SUSPECTED' | 'FRAUD_CONFIRMED' | string;
  trust_score: number;
  total_calls_analyzed: number;
  scam_incidents_count: number;
  ai_clone_detected_count: number;
  threat_tags: string[];
  last_verdict?: string | null;
  last_call_timestamp?: string | null;
}

export interface VoiceProfile {
  profile_id: string;
  user_id: string;
  display_name: string;
  relationship: string;
  model_name: string;
  sample_duration: number;
  total_calls_verified: number;
  last_verified_at: string | null;
  created_at: string;
  features?: {
    pitch_mean_hz?: number;
    pitch_std_hz?: number;
    spectral_centroid_hz?: number;
    spectral_rolloff_hz?: number;
    spectral_bandwidth_hz?: number;
    voiced_percentage?: number;
    duration_sec?: number;
  };
}

export interface SpeakerVerificationStatus {
  has_profile: boolean;
  profile_id?: string | null;
  display_name?: string | null;
  relationship?: string | null;
  similarity_score?: number | null;
  similarity_percentage?: number | null;
  status: 'AUTHENTIC_MATCH' | 'UNCERTAIN' | 'MISMATCH' | 'AI_CLONE_IMPERSONATION' | 'AWAITING_SPEECH' | 'NO_ENROLLED_PROFILE' | string;
  is_match?: boolean | null;
  is_clone_attack?: boolean;
}

export interface SessionResponse {
  id: number;
  session_id: string;
  caller_id: string | null;
  caller_name?: string | null;
  reputation_category?: 'VERIFIED_USER' | 'CLEAN_NEUTRAL' | 'SUSPICIOUS' | 'SCAM_SUSPECTED' | 'FRAUD_CONFIRMED' | string;
  trust_score?: number;
  threat_tags?: string[];
  scam_count?: number;
  created_at: string;
  status: string;
  risk_level?: string;
  decision?: string;
}

export interface RiskAnalysis {
  overall_risk_score: number;
  risk_level: string;
  contributing_signals: string[];
  confidence: number;
}

export interface RiskResponse {
  session_id: string;
  status: string;
  data: {
    filename: string;
    transcript: string;
    risk_analysis: RiskAnalysis;
  };
}

export interface DecisionResponse {
  session_id: string;
  status: string;
  data: {
    filename: string;
    policy: {
      decision: string;
      escalated: boolean;
    };
  };
}

export interface EvidenceResponse {
  session_id: string;
  status: string;
  data: {
    evidence_record: any;
    hash: string | null;
    algorithm: string;
  };
}

export const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://noon-paintings-api-understand.trycloudflare.com';

export function getBaseUrl(): string {
  // If accessing via PC browser on local development port 5173, connect directly to local backend first
  if (typeof window !== 'undefined' && window.location) {
    const port = window.location.port;
    const hostname = window.location.hostname;
    if (port === '5173' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return 'http://localhost:8010';
    }
  }

  try {
    const saved = localStorage.getItem('vera_server_url');
    if (saved && saved.trim()) {
      // Clear stale URLs (expired trycloudflare domains or legacy port 8000)
      if (
        (saved.includes('trycloudflare.com') && !saved.includes('noon-paintings-api-understand')) ||
        saved.includes(':8000')
      ) {
        localStorage.removeItem('vera_server_url');
      } else {
        return saved.trim().replace(/\/+$/, '');
      }
    }
  } catch {}

  return DEFAULT_BASE_URL.replace(/\/+$/, '');
}

export function setBaseUrl(url: string) {
  try {
    if (url && url.trim()) {
      localStorage.setItem('vera_server_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('vera_server_url');
    }
  } catch {}
}

class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchWithHandle(endpoint: string, options?: RequestInit, retries = 1): Promise<any> {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
    });

    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Retry transient network drop once with 400ms delay before failing
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 400));
      return fetchWithHandle(endpoint, options, retries - 1);
    }

    const rawMsg = error instanceof Error ? error.message : 'Unknown network error';
    if (rawMsg.toLowerCase().includes('failed to fetch') || rawMsg.toLowerCase().includes('networkerror')) {
      throw new Error(`Cannot reach VERA server at ${baseUrl}. Ensure backend is running and tunnel is active.`);
    }
    throw new Error(rawMsg);
  }
}

// Utility to generate a dummy WAV blob for testing endpoints that require an audio file
export function generateDummyWavBlob(): Blob {
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = sampleRate * 1 * blockAlign; // 1 second
  const chunkSize = 36 + dataSize;
  const buffer = new ArrayBuffer(8 + chunkSize);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  return new Blob([buffer], { type: 'audio/wav' });
}

export const api = {
  checkHealth: (): Promise<HealthResponse> => 
    fetchWithHandle('/api/v1/health', {
      headers: { 'Content-Type': 'application/json' }
    }),

  createSession: (data: SessionCreateRequest = {}): Promise<SessionResponse> => 
    fetchWithHandle('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getSession: (sessionId: string): Promise<SessionResponse> => 
    fetchWithHandle(`/api/v1/sessions/${sessionId}`, {
      headers: { 'Content-Type': 'application/json' }
    }),

  getSessions: (): Promise<SessionResponse[]> => 
    fetchWithHandle(`/api/v1/sessions`, {
      headers: { 'Content-Type': 'application/json' }
    }),

  analyzeRisk: (sessionId: string, audioBlob: Blob): Promise<RiskResponse> => {
    const formData = new FormData();
    // useAudioRecorder now always produces audio/wav blobs; use .wav filename.
    const filename = audioBlob.type.includes('webm') ? 'recording.webm' : 'recording.wav';
    formData.append('file', audioBlob, filename);
    return fetchWithHandle(`/api/v1/sessions/${sessionId}/risk`, {
      method: 'POST',
      body: formData,
    });
  },

  getDecision: (sessionId: string, audioBlob: Blob): Promise<DecisionResponse> => {
    const formData = new FormData();
    const filename = audioBlob.type.includes('webm') ? 'recording.webm' : 'recording.wav';
    formData.append('file', audioBlob, filename);
    return fetchWithHandle(`/api/v1/sessions/${sessionId}/decision`, {
      method: 'POST',
      body: formData,
    });
  },

  getEvidence: (sessionId: string): Promise<EvidenceResponse> =>
    fetchWithHandle(`/api/v1/sessions/${sessionId}/evidence`, {
      headers: { 'Content-Type': 'application/json' }
    }),

  generateEvidence: (sessionId: string, audioBlob: Blob): Promise<EvidenceResponse> => {
    const formData = new FormData();
    const filename = audioBlob.type.includes('webm') ? 'recording.webm' : 'recording.wav';
    formData.append('file', audioBlob, filename);
    return fetchWithHandle(`/api/v1/sessions/${sessionId}/evidence`, {
      method: 'POST',
      body: formData,
    });
  },

  getReputation: (callerId: string): Promise<CallerReputation> =>
    fetchWithHandle(`/api/v1/reputation/${encodeURIComponent(callerId)}`, {
      headers: { 'Content-Type': 'application/json' }
    }),

  getReputationList: (limit: number = 50): Promise<CallerReputation[]> =>
    fetchWithHandle(`/api/v1/reputation?limit=${limit}`, {
      headers: { 'Content-Type': 'application/json' }
    }),

  reportCaller: (callerId: string, isScam: boolean, tag?: string): Promise<CallerReputation> =>
    fetchWithHandle(`/api/v1/reputation/${encodeURIComponent(callerId)}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_scam: isScam, tag })
    }),

  getVoiceProfiles: (): Promise<VoiceProfile[]> =>
    fetchWithHandle('/api/v1/voice-profiles', {
      headers: { 'Content-Type': 'application/json' }
    }),

  lookupVoiceProfile: (userId: string): Promise<VoiceProfile> =>
    fetchWithHandle(`/api/v1/voice-profiles/lookup/${encodeURIComponent(userId)}`, {
      headers: { 'Content-Type': 'application/json' }
    }),

  enrollVoiceProfile: (data: { userId: string; displayName?: string; relationship?: string; audioBlob: Blob }): Promise<VoiceProfile> => {
    const formData = new FormData();
    formData.append('user_id', data.userId);
    if (data.displayName) formData.append('display_name', data.displayName);
    if (data.relationship) formData.append('relationship', data.relationship);
    const filename = data.audioBlob.type.includes('webm') ? 'voiceprint.webm' : 'voiceprint.wav';
    formData.append('file', data.audioBlob, filename);
    return fetchWithHandle('/api/v1/voice-profiles', {
      method: 'POST',
      body: formData,
    });
  },

  deleteVoiceProfile: (profileId: string): Promise<{ status: string; profile_id: string }> =>
    fetchWithHandle(`/api/v1/voice-profiles/${encodeURIComponent(profileId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
};


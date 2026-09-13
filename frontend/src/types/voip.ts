export type CallState = 
  | 'IDLE'
  | 'OUTGOING_RINGING'
  | 'INCOMING_RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ENDED';

export interface IceServerConfig {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface CallerReputationPayload {
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

export interface SignalingMessage {
  type: 
    | 'call:invite'
    | 'call:ringing'
    | 'call:accept'
    | 'call:reject'
    | 'call:end'
    | 'users:list'
    | 'webrtc:offer'
    | 'webrtc:answer'
    | 'webrtc:ice';
  call_id?: string;
  caller_id?: string;
  callee_id?: string;
  target_id?: string;
  sender_id?: string;
  reason?: string;
  sdp?: any;
  candidate?: any;
  users?: string[];
  timestamp?: string;
  reputation?: CallerReputationPayload;
}


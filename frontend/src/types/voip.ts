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
    | 'webrtc:ice'
    | 'identity:challenge'
    | 'identity:response'
    | 'guardian:alert';
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
  claimed_entity?: string;
  claimed_role?: string;
  challenge_id?: string;
  status?: 'APPROVED' | 'FAILED' | 'REJECTED';
  auth_code?: string;
  risk_level?: string;
}

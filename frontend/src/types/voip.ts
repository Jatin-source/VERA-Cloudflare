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
}

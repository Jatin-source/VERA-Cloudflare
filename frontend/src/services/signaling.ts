import { getBaseUrl } from './api';
import type { SignalingMessage, IceServerConfig } from '../types/voip';

type MessageHandler = (msg: SignalingMessage) => void;

class SignalingService {
  private ws: WebSocket | null = null;
  private currentUserId: string | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private isIntentionalClose: boolean = false;
  private reconnectTimer: any = null;

  public connect(userId: string) {
    if (this.ws && this.currentUserId === userId && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.disconnect();
    this.currentUserId = userId;
    this.isIntentionalClose = false;

    const baseUrl = getBaseUrl().replace(/^http/, 'ws');
    const wsUrl = `${baseUrl}/api/v1/ws/signaling/${userId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[Signaling] Connected as ${userId}`);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: SignalingMessage = JSON.parse(event.data);
          this.handlers.forEach((h) => h(data));
        } catch (e) {
          console.error('[Signaling] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log(`[Signaling] Disconnected (${userId})`);
        this.ws = null;
        if (!this.isIntentionalClose && this.currentUserId) {
          this.reconnectTimer = setTimeout(() => {
            if (this.currentUserId) this.connect(this.currentUserId);
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Signaling] WebSocket error:', err);
      };
    } catch (err) {
      console.error('[Signaling] Connection failed:', err);
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentUserId = null;
  }

  public onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public send(msg: SignalingMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[Signaling] Cannot send, socket not open:', msg);
    }
  }

  public sendInvite(calleeId: string, callId: string) {
    this.send({
      type: 'call:invite',
      call_id: callId,
      callee_id: calleeId
    });
  }

  public sendRinging(callerId: string, callId: string) {
    this.send({
      type: 'call:ringing',
      call_id: callId,
      caller_id: callerId
    });
  }

  public sendAccept(callerId: string, callId: string) {
    this.send({
      type: 'call:accept',
      call_id: callId,
      caller_id: callerId
    });
  }

  public sendReject(callerId: string, callId: string, reason: string = 'declined') {
    this.send({
      type: 'call:reject',
      call_id: callId,
      caller_id: callerId,
      reason
    });
  }

  public sendEnd(callId: string, reason: string = 'hangup') {
    this.send({
      type: 'call:end',
      call_id: callId,
      reason
    });
  }

  public sendWebRtcOffer(targetId: string, callId: string, sdp: any) {
    this.send({
      type: 'webrtc:offer',
      target_id: targetId,
      call_id: callId,
      sdp
    });
  }

  public sendWebRtcAnswer(targetId: string, callId: string, sdp: any) {
    this.send({
      type: 'webrtc:answer',
      target_id: targetId,
      call_id: callId,
      sdp
    });
  }

  public sendIceCandidate(targetId: string, callId: string, candidate: any) {
    this.send({
      type: 'webrtc:ice',
      target_id: targetId,
      call_id: callId,
      candidate
    });
  }

  public async getIceConfig(): Promise<{ iceServers: IceServerConfig[] }> {
    const baseUrl = getBaseUrl();
    try {
      const res = await fetch(`${baseUrl}/api/v1/signaling/ice-config`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[Signaling] Failed to fetch ice-config, using fallback:', e);
    }
    return {
      iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
    };
  }
}

export const signalingService = new SignalingService();

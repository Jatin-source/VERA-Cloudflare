import { signalingService } from './signaling';

type StreamListener = (stream: MediaStream | null) => void;
type ConnectionStateListener = (state: RTCPeerConnectionState) => void;

class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private peerId: string | null = null;
  private callId: string | null = null;
  private iceQueue: RTCIceCandidateInit[] = [];
  private pendingOffer: RTCSessionDescriptionInit | null = null;
  private isMuted: boolean = false;
  private remoteAudio: HTMLAudioElement | null = null;

  private streamListeners: Set<StreamListener> = new Set();
  private connListeners: Set<ConnectionStateListener> = new Set();

  constructor() {
    this.initAudioElement();
  }

  private initAudioElement() {
    if (typeof window !== 'undefined' && !this.remoteAudio) {
      this.remoteAudio = document.createElement('audio');
      this.remoteAudio.autoplay = true;
      this.remoteAudio.setAttribute('playsinline', 'true');
      this.remoteAudio.volume = 1.0;
      this.remoteAudio.id = 'vera-remote-audio-sink';
      this.remoteAudio.style.display = 'none';
      document.body.appendChild(this.remoteAudio);
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public onRemoteStream(listener: StreamListener): () => void {
    this.streamListeners.add(listener);
    if (this.remoteStream) {
      listener(this.remoteStream);
    }
    return () => this.streamListeners.delete(listener);
  }

  public onConnectionState(listener: ConnectionStateListener): () => void {
    this.connListeners.add(listener);
    if (this.pc) {
      listener(this.pc.connectionState);
    }
    return () => this.connListeners.delete(listener);
  }

  private notifyRemoteStream(stream: MediaStream | null) {
    this.remoteStream = stream;
    this.streamListeners.forEach((l) => l(stream));
  }

  private notifyConnState(state: RTCPeerConnectionState) {
    this.connListeners.forEach((l) => l(state));
  }

  private async acquireMicrophone(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    this.localStream = stream;
    return stream;
  }

  private async createPeerConnection(targetPeerId: string, activeCallId: string): Promise<RTCPeerConnection> {
    this.peerId = targetPeerId;
    this.callId = activeCallId;
    this.iceQueue = [];

    const iceConfig = await signalingService.getIceConfig();
    const pc = new RTCPeerConnection({
      iceServers: iceConfig.iceServers,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingService.sendIceCandidate(targetPeerId, activeCallId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.notifyRemoteStream(stream);

      if (this.remoteAudio) {
        this.remoteAudio.srcObject = stream;
        this.remoteAudio.play().catch((err) => {
          console.warn('[WebRTC] Autoplay was prevented by browser:', err);
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      this.notifyConnState(pc.connectionState);
    };

    this.pc = pc;
    return pc;
  }

  /**
   * Caller workflow: Acquire mic, create Offer, set Local Description, send to peer.
   */
  public async startAsCaller(targetPeerId: string, activeCallId: string) {
    try {
      console.log(`[WebRTC] Starting as caller -> ${targetPeerId} (call: ${activeCallId})`);
      const micStream = await this.acquireMicrophone();
      const pc = await this.createPeerConnection(targetPeerId, activeCallId);

      micStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, micStream);
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);

      signalingService.sendWebRtcOffer(targetPeerId, activeCallId, offer);
      console.log('[WebRTC] Offer sent to callee');
    } catch (err) {
      console.error('[WebRTC] Error starting as caller:', err);
      throw err;
    }
  }

  /**
   * Callee workflow: Acquire mic, prepare PC, and handle pending offer if already buffered.
   */
  public async startAsCallee(callerPeerId: string, activeCallId: string) {
    try {
      console.log(`[WebRTC] Starting as callee <- ${callerPeerId} (call: ${activeCallId})`);
      const micStream = await this.acquireMicrophone();
      const pc = await this.createPeerConnection(callerPeerId, activeCallId);

      micStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, micStream);
      });

      if (this.pendingOffer) {
        console.log('[WebRTC] Consuming pending offer for callee');
        const offer = this.pendingOffer;
        this.pendingOffer = null;
        await this.handleOffer(offer);
      }
    } catch (err) {
      console.error('[WebRTC] Error starting as callee:', err);
      throw err;
    }
  }

  public async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.pc) {
      console.log('[WebRTC] Buffering offer, peer connection not ready yet');
      this.pendingOffer = offer;
      return;
    }

    try {
      console.log('[WebRTC] Setting remote offer');
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      await this.flushIceCandidates();

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      if (this.peerId && this.callId) {
        signalingService.sendWebRtcAnswer(this.peerId, this.callId, answer);
        console.log('[WebRTC] Answer sent to caller');
      }
    } catch (err) {
      console.error('[WebRTC] Failed to handle offer:', err);
    }
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc) {
      console.warn('[WebRTC] Received answer but no peer connection exists');
      return;
    }

    try {
      console.log('[WebRTC] Setting remote answer');
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.flushIceCandidates();
    } catch (err) {
      console.error('[WebRTC] Failed to set remote answer:', err);
    }
  }

  public async handleIceCandidate(candidateInit: RTCIceCandidateInit) {
    if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (err) {
        console.warn('[WebRTC] Error adding ICE candidate:', err);
      }
    } else {
      this.iceQueue.push(candidateInit);
    }
  }

  private async flushIceCandidates() {
    if (!this.pc || !this.pc.remoteDescription) return;
    while (this.iceQueue.length > 0) {
      const candidate = this.iceQueue.shift();
      if (candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Error flushing queued ICE candidate:', err);
        }
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public cleanup() {
    console.log('[WebRTC] Cleaning up call media');
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
    }

    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }

    this.notifyRemoteStream(null);
    this.notifyConnState('closed');
    this.iceQueue = [];
    this.pendingOffer = null;
    this.peerId = null;
    this.callId = null;
    this.isMuted = false;
  }
}

export const webrtcManager = new WebRTCManager();

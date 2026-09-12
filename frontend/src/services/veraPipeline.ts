import { getBaseUrl } from './api';

export interface VeraTelemetry {
  session_id: string;
  chunk_id?: number;
  transcript?: string;
  voice_integrity_score?: number;
  overall_risk_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | string;
  decision?: 'ALLOW' | 'MONITOR' | 'CHALLENGE' | 'BLOCK' | string;
  signals?: Array<any>;
  error?: string;
}

type TelemetryListener = (telemetry: VeraTelemetry) => void;

class VeraPipelineService {
  private ws: WebSocket | null = null;
  private currentSessionId: string | null = null;
  private isConnecting: boolean = false;
  private listeners: Set<TelemetryListener> = new Set();
  private lastTelemetry: VeraTelemetry | null = null;
  private isConnected: boolean = false;

  /**
   * Creates a new session in the VERA backend and opens the real-time AI WebSocket.
   * Completely isolated: network failure here NEVER interrupts the active VoIP call.
   */
  public async startSession(callerId: string): Promise<string | null> {
    this.stopSession();

    try {
      this.isConnecting = true;
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_id: callerId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create VERA session: ${res.statusText}`);
      }

      const sessionData = await res.json();
      const sessionId = sessionData.session_id;
      this.currentSessionId = sessionId;

      this.connectWebSocket(sessionId);
      return sessionId;
    } catch (err) {
      console.warn('[VeraPipeline] Failed to initialize AI session (call continues normally):', err);
      this.isConnecting = false;
      return null;
    }
  }

  private connectWebSocket(sessionId: string) {
    const baseUrl = getBaseUrl().replace(/^http/, 'ws');
    const wsUrl = `${baseUrl}/api/v1/ws/sessions/${sessionId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[VeraPipeline] Connected to AI WebSocket for session: ${sessionId}`);
        this.isConnected = true;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const telemetry: VeraTelemetry = JSON.parse(event.data);
          this.lastTelemetry = telemetry;
          this.listeners.forEach((listener) => {
            try {
              listener(telemetry);
            } catch (e) {
              console.error('[VeraPipeline] Listener error:', e);
            }
          });
        } catch (err) {
          console.warn('[VeraPipeline] Error parsing AI telemetry:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[VeraPipeline] WebSocket error (call media unaffected):', err);
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        console.log('[VeraPipeline] AI WebSocket closed');
        this.isConnected = false;
        this.isConnecting = false;
        this.ws = null;
      };
    } catch (err) {
      console.warn('[VeraPipeline] Connection failed (call media unaffected):', err);
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  /**
   * Streams a 1.0s 16kHz PCM WAV chunk to the VERA pipeline as base64 payload.
   */
  public sendChunk(chunkId: number, wavBuffer: ArrayBuffer) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const bytes = new Uint8Array(wavBuffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Wav = btoa(binary);

      const payload = {
        chunk_id: chunkId,
        audio_data: base64Wav,
      };

      this.ws.send(JSON.stringify(payload));
    } catch (err) {
      console.warn('[VeraPipeline] Failed to send chunk:', err);
    }
  }

  public stopSession() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.currentSessionId = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.lastTelemetry = null;
  }

  public onTelemetry(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    if (this.lastTelemetry) {
      listener(this.lastTelemetry);
    }
    return () => this.listeners.delete(listener);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getIsConnecting(): boolean {
    return this.isConnecting;
  }

  public getSessionId(): string | null {
    return this.currentSessionId;
  }

  public getLastTelemetry(): VeraTelemetry | null {
    return this.lastTelemetry;
  }
}

export const veraPipeline = new VeraPipelineService();

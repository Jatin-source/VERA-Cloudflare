type AudioFrameListener = (audioData: Float32Array, sampleRate: number) => void;
type AudioLevelListener = (level: number) => void;

export class RemoteAudioTap {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private muteGainNode: GainNode | null = null;
  private frameListeners: Set<AudioFrameListener> = new Set();
  private levelListeners: Set<AudioLevelListener> = new Set();
  private isActive: boolean = false;
  private sampleRate: number = 48000;
  private framesCaptured: number = 0;
  private lastLevel: number = 0;

  /**
   * Start tapping the remote incoming WebRTC MediaStream passively.
   * Completely isolated: audio output to the speaker via <audio> is 100% unaffected.
   */
  public async start(remoteStream: MediaStream) {
    if (this.isActive) {
      this.stop();
    }

    if (!remoteStream || remoteStream.getAudioTracks().length === 0) {
      console.warn('[AudioTap] No audio tracks found in remote stream');
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        console.error('[AudioTap] Web Audio API is not supported in this environment');
        return;
      }

      this.audioCtx = new AudioCtxClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sampleRate = this.audioCtx.sampleRate;
      console.log(`[AudioTap] Initialized AudioContext at ${this.sampleRate}Hz`);

      this.sourceNode = this.audioCtx.createMediaStreamSource(remoteStream);

      // Buffer size 4096 gives ~85ms chunks at 48kHz, optimal for real-time streaming
      this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);

      // Connect to a zero-gain node before destination to keep audio processing alive
      // without creating feedback or double audio
      this.muteGainNode = this.audioCtx.createGain();
      this.muteGainNode.gain.value = 0.0;

      this.processorNode.onaudioprocess = (event) => {
        if (!this.isActive) return;

        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);

        // Copy audio buffer to ensure thread safety for listeners
        const frameCopy = new Float32Array(channelData.length);
        frameCopy.set(channelData);

        // Compute RMS level for visual meter
        let sum = 0;
        for (let i = 0; i < frameCopy.length; i++) {
          sum += frameCopy[i] * frameCopy[i];
        }
        const rms = Math.sqrt(sum / frameCopy.length);
        this.lastLevel = Math.min(1.0, rms * 4.0); // scaled for display
        this.framesCaptured++;

        // Notify level listeners
        this.levelListeners.forEach((l) => l(this.lastLevel));

        // Notify audio frame listeners (e.g. PCM downsampler in Milestone 4)
        this.frameListeners.forEach((l) => l(frameCopy, this.sampleRate));
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.muteGainNode);
      this.muteGainNode.connect(this.audioCtx.destination);

      this.isActive = true;
      console.log('[AudioTap] Remote audio tap successfully engaged');
    } catch (err) {
      console.error('[AudioTap] Failed to start remote audio tap:', err);
      this.stop();
    }
  }

  public stop() {
    this.isActive = false;
    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;
      try { this.processorNode.disconnect(); } catch (_) {}
      this.processorNode = null;
    }

    if (this.muteGainNode) {
      try { this.muteGainNode.disconnect(); } catch (_) {}
      this.muteGainNode = null;
    }

    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (_) {}
      this.sourceNode = null;
    }

    if (this.audioCtx) {
      try {
        if (this.audioCtx.state !== 'closed') {
          this.audioCtx.close();
        }
      } catch (_) {}
      this.audioCtx = null;
    }

    this.lastLevel = 0;
    this.levelListeners.forEach((l) => l(0));
    console.log(`[AudioTap] Remote audio tap stopped. Total frames captured: ${this.framesCaptured}`);
  }

  public onFrame(listener: AudioFrameListener): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  public onLevel(listener: AudioLevelListener): () => void {
    this.levelListeners.add(listener);
    return () => this.levelListeners.delete(listener);
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getSampleRate(): number {
    return this.sampleRate;
  }

  public getFramesCaptured(): number {
    return this.framesCaptured;
  }

  public getLastLevel(): number {
    return this.lastLevel;
  }
}

export const remoteAudioTap = new RemoteAudioTap();

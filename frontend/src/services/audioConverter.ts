/**
 * Audio Converter & Chunk Accumulator for VERA AI Pipeline
 * Resamples variable WebRTC audio (e.g. 48kHz/44.1kHz) down to 16kHz 16-bit mono PCM,
 * and packages standard 1.0s chunks (16,000 samples) with valid WAV headers.
 */

export interface AudioChunk {
  index: number;
  samples: Int16Array;
  wavBuffer: ArrayBuffer;
  durationSec: number;
  timestamp: number;
}

type ChunkListener = (chunk: AudioChunk) => void;

/**
 * High-quality linear interpolation downsampler from input sample rate to 16,000Hz.
 * Converts normalized float samples (-1.0 to 1.0) into 16-bit signed PCM integers (-32768 to 32767).
 */
export function downsampleTo16k(inputData: Float32Array, inputSampleRate: number): Int16Array {
  if (!inputData || inputData.length === 0) {
    return new Int16Array(0);
  }

  const TARGET_SAMPLE_RATE = 16000;

  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    const out = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1.0, Math.min(1.0, inputData[i]));
      out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7FFF);
    }
    return out;
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const newLength = Math.round(inputData.length / ratio);
  const output = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;

    const s0 = inputData[index] !== undefined ? inputData[index] : 0;
    const s1 = inputData[index + 1] !== undefined ? inputData[index + 1] : s0;

    // Linear interpolation
    const interpolated = s0 + (s1 - s0) * fraction;
    const clamped = Math.max(-1.0, Math.min(1.0, interpolated));

    output[i] = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7FFF);
  }

  return output;
}

/**
 * Encodes 16-bit mono PCM samples into a standard 44-byte RIFF WAV ArrayBuffer.
 */
export function encodeWAV(samples: Int16Array, sampleRate: number = 16000): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File length minus RIFF header
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');

  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate
  view.setUint32(28, byteRate, true);
  // Block align
  view.setUint16(32, blockAlign, true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);

  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Accumulates 16kHz PCM audio samples and emits discrete 1.0s chunks
 * (16,000 samples / 32,000 raw bytes) for real-time speech and deepfake analysis.
 */
export class AudioChunkAccumulator {
  private buffer: Int16Array[] = [];
  private totalBufferedSamples: number = 0;
  private chunkIndex: number = 0;
  private readonly chunkSize: number; // default: 16,000 samples (1.0 sec @ 16kHz)
  private listeners: Set<ChunkListener> = new Set();
  private totalChunksEmitted: number = 0;

  constructor(chunkDurationSec: number = 1.0, sampleRate: number = 16000) {
    this.chunkSize = Math.round(chunkDurationSec * sampleRate);
  }

  public feed(pcm16Samples: Int16Array) {
    if (!pcm16Samples || pcm16Samples.length === 0) return;

    this.buffer.push(pcm16Samples);
    this.totalBufferedSamples += pcm16Samples.length;

    while (this.totalBufferedSamples >= this.chunkSize) {
      this.emitNextChunk();
    }
  }

  private emitNextChunk() {
    const chunkSamples = new Int16Array(this.chunkSize);
    let samplesCopied = 0;

    while (samplesCopied < this.chunkSize && this.buffer.length > 0) {
      const head = this.buffer[0];
      const remainingNeeded = this.chunkSize - samplesCopied;

      if (head.length <= remainingNeeded) {
        chunkSamples.set(head, samplesCopied);
        samplesCopied += head.length;
        this.buffer.shift();
      } else {
        // Slice head partially
        const slice = head.subarray(0, remainingNeeded);
        chunkSamples.set(slice, samplesCopied);
        samplesCopied += remainingNeeded;
        this.buffer[0] = head.subarray(remainingNeeded);
      }
    }

    this.totalBufferedSamples -= this.chunkSize;
    const wavBuffer = encodeWAV(chunkSamples, 16000);

    const chunk: AudioChunk = {
      index: this.chunkIndex++,
      samples: chunkSamples,
      wavBuffer,
      durationSec: this.chunkSize / 16000,
      timestamp: Date.now(),
    };

    this.totalChunksEmitted++;
    this.listeners.forEach((listener) => {
      try {
        listener(chunk);
      } catch (err) {
        console.error('[AudioChunkAccumulator] Listener error:', err);
      }
    });
  }

  public flush() {
    // If there is meaningful remaining audio (e.g. at least 0.25s = 4000 samples), emit final chunk
    if (this.totalBufferedSamples >= 4000) {
      const remainingSamples = new Int16Array(this.totalBufferedSamples);
      let offset = 0;
      for (const b of this.buffer) {
        remainingSamples.set(b, offset);
        offset += b.length;
      }
      const wavBuffer = encodeWAV(remainingSamples, 16000);
      const chunk: AudioChunk = {
        index: this.chunkIndex++,
        samples: remainingSamples,
        wavBuffer,
        durationSec: remainingSamples.length / 16000,
        timestamp: Date.now(),
      };
      this.totalChunksEmitted++;
      this.listeners.forEach((listener) => listener(chunk));
    }
    this.reset();
  }

  public reset() {
    this.buffer = [];
    this.totalBufferedSamples = 0;
    this.chunkIndex = 0;
  }

  public onChunk(listener: ChunkListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getTotalChunksEmitted(): number {
    return this.totalChunksEmitted;
  }

  public getBufferedSamples(): number {
    return this.totalBufferedSamples;
  }
}

export const audioChunkAccumulator = new AudioChunkAccumulator(1.0, 16000);

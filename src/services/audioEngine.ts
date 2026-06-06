/**
 * Audio Engine
 * 
 * Central audio processing service that provides a unified interface
 * for all audio operations including pitch shifting, WAV encoding,
 * and URL management.
 * 
 * This service ensures consistency between preview and export processing.
 */

import { applyPitchShift, audioBufferToWav } from '../utils/pitchShift';

/**
 * Result of audio processing
 */
export interface ProcessedAudioResult {
  blob: Blob;
  blobUrl: string;
  duration: number;
  sampleCount: number;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Audio Engine - Central audio processing service
 */
class AudioEngine {
  private audioContext: AudioContext | null = null;

  /**
   * Get or create AudioContext (singleton pattern)
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    return this.audioContext;
  }

  /**
   * Decode an audio file to an AudioBuffer
   */
  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = this.getAudioContext();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Apply pitch shift to an AudioBuffer
   * Uses the same algorithm for both preview and export
   */
  async pitchShift(
    audioBuffer: AudioBuffer,
    semitones: number,
    onProgress?: ProgressCallback
  ): Promise<AudioBuffer> {
    onProgress?.(0, 'Applying pitch shift...');
    
    const result = await applyPitchShift(
      audioBuffer,
      semitones,
      1,
      (progress) => onProgress?.(progress * 100, `Processing: ${Math.round(progress * 100)}%`)
    );
    
    onProgress?.(100, 'Pitch shift complete');
    return result;
  }

  /**
   * Render preview audio with pitch shift
   * Creates a Blob URL for WaveSurfer playback
   */
  async renderPreview(
    audioBuffer: AudioBuffer,
    semitones: number,
    onProgress?: ProgressCallback
  ): Promise<ProcessedAudioResult> {
    onProgress?.(0, 'Starting preview processing...');

    // Apply pitch shift (or use original if semitones = 0)
    const processedBuffer = semitones === 0
      ? audioBuffer
      : await this.pitchShift(audioBuffer, semitones, (p, msg) => onProgress?.(p * 0.9, msg));

    onProgress?.(90, 'Encoding to WAV...');

    // Convert to WAV
    const blob = audioBufferToWav(processedBuffer);
    const blobUrl = URL.createObjectURL(blob);

    onProgress?.(100, 'Preview ready');

    return {
      blob,
      blobUrl,
      duration: processedBuffer.duration,
      sampleCount: processedBuffer.length
    };
  }

  /**
   * Render export audio with pitch and speed
   * Creates a Blob for download
   */
  async renderExport(
    audioBuffer: AudioBuffer,
    semitones: number,
    speed: number,
    onProgress?: ProgressCallback
  ): Promise<ProcessedAudioResult> {
    onProgress?.(0, 'Starting export processing...');

    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const originalDuration = audioBuffer.duration;

    // Calculate pitch ratio
    const pitchRatio = semitones === 0 ? 1 : Math.pow(2, semitones / 12);

    // Apply pitch shift first
    const pitchProcessedBuffer = semitones === 0
      ? audioBuffer
      : await this.pitchShift(audioBuffer, semitones, (p, msg) => onProgress?.(p * 0.5, msg));

    onProgress?.(50, 'Applying speed transformation...');

    // Calculate output duration considering both pitch and speed
    const outputDuration = originalDuration / (pitchRatio * speed);
    const outputLength = Math.ceil(outputDuration * sampleRate);

    // Create OfflineAudioContext for speed adjustment
    const offlineContext = new OfflineAudioContext(numChannels, outputLength, sampleRate);

    const source = offlineContext.createBufferSource();
    source.buffer = pitchProcessedBuffer;
    source.playbackRate.value = speed;
    source.connect(offlineContext.destination);
    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();

    onProgress?.(80, 'Encoding to WAV...');

    // Convert to WAV
    const blob = audioBufferToWav(renderedBuffer);
    const blobUrl = URL.createObjectURL(blob);

    onProgress?.(100, 'Export ready');

    return {
      blob,
      blobUrl,
      duration: renderedBuffer.duration,
      sampleCount: renderedBuffer.length
    };
  }

  /**
   * Revoke a Blob URL to free memory
   */
  revokeUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const audioEngine = new AudioEngine();
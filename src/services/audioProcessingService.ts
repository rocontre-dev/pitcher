import { SoundTouch } from 'soundtouchjs';

/**
 * Audio Processing Service
 * 
 * Responsible for:
 * - Loading audio files into AudioBuffers
 * - Applying pitch shift using SoundTouch.js
 * - Preserving duration when pitch changes
 * - Providing processed audio as Blob URLs
 */

export interface ProcessedAudioResult {
  blob: Blob;
  blobUrl: string;
  duration: number;
}

export interface ProcessingProgress {
  progress: number;
  message: string;
}

export class AudioProcessingService {
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
   * Convert File to AudioBuffer
   */
  private async fileToAudioBuffer(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = this.getAudioContext();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = buffer.length;
    const dataSize = samples * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Apply pitch shift using SoundTouch.js
   * 
   * @param audioBuffer - The source audio buffer
   * @param semitones - Pitch shift in semitones (-12 to +12)
   * @param onProgress - Optional progress callback
   * @returns Processed AudioBuffer
   */
  private async applyPitchShift(
    audioBuffer: AudioBuffer,
    semitones: number,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<AudioBuffer> {
    const audioContext = this.getAudioContext();
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Calculate pitch ratio: pitchRatio = 2^(semitones/12)
    const pitchRatio = Math.pow(2, semitones / 12);

    // SoundTouch processes one channel at a time
    // We'll process each channel and then combine them
    const processedChannels: Float32Array[] = [];

    for (let channel = 0; channel < numChannels; channel++) {
      onProgress?.({
        progress: (channel / numChannels) * 50,
        message: `Processing channel ${channel + 1} of ${numChannels}...`
      });

      const sourceData = audioBuffer.getChannelData(channel);
      const processedData = this.processChannelWithSoundTouch(
        sourceData,
        sampleRate,
        pitchRatio,
        onProgress ? (p) => onProgress({
          progress: (channel / numChannels) * 50 + p * (50 / numChannels),
          message: `Processing channel ${channel + 1}...`
        }) : undefined
      );

      processedChannels.push(processedData);
    }

    onProgress?.({
      progress: 100,
      message: 'Creating output buffer...'
    });

    // Create new AudioBuffer with processed data
    const outputBuffer = audioContext.createBuffer(
      numChannels,
      processedChannels[0].length,
      sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      // Cast to fix TypeScript strict typing issue with Float32Array subarray
      outputBuffer.copyToChannel(new Float32Array(processedChannels[channel]), channel);
    }

    return outputBuffer;
  }

  /**
   * Process a single audio channel using SoundTouch
   */
  private processChannelWithSoundTouch(
    sourceData: Float32Array,
    sampleRate: number,
    pitchRatio: number,
    onProgress?: (progress: number) => void
  ): Float32Array {
    const soundTouch = new SoundTouch(sampleRate);
    soundTouch.pitch = pitchRatio;
    soundTouch.rate = 1; // Keep rate at 1 to preserve duration
    soundTouch.tempo = 1; // Keep tempo at 1

    // Calculate output size estimate
    const estimatedOutputSize = Math.ceil(sourceData.length / pitchRatio) + 2048;
    const outputData = new Float32Array(estimatedOutputSize);

    const sampleBlockSize = 2048;
    let inputOffset = 0;
    let outputOffset = 0;

    while (inputOffset < sourceData.length) {
      const inputEnd = Math.min(inputOffset + sampleBlockSize, sourceData.length);
      const inputBlock = sourceData.slice(inputOffset, inputEnd);

      // Put samples into SoundTouch
      soundTouch.putSamples(inputBlock, 0, inputBlock.length);

      // Receive processed samples
      const remainingSlots = outputData.length - outputOffset;
      const outputView = outputData.subarray(outputOffset) as Float32Array;
      const received = soundTouch.receiveSamples(outputView, remainingSlots);

      outputOffset += received;
      inputOffset = inputEnd;

      onProgress?.(inputOffset / sourceData.length);
    }

    // Flush remaining samples
    soundTouch.flush();
    const finalRemainingSlots = outputData.length - outputOffset;
    const finalOutputView = outputData.subarray(outputOffset) as Float32Array;
    const finalReceived = soundTouch.receiveSamples(finalOutputView, finalRemainingSlots);
    outputOffset += finalReceived;

    // Trim to actual size
    return outputData.subarray(0, outputOffset);
  }

  /**
   * Main processing function
   * 
   * @param file - Audio file to process
   * @param semitones - Pitch shift in semitones
   * @param onProgress - Optional progress callback
   * @returns Processed audio as Blob URL
   */
  async processAudio(
    file: File,
    semitones: number,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessedAudioResult> {
    onProgress?.({ progress: 0, message: 'Loading audio file...' });

    // Decode audio file
    const audioBuffer = await this.fileToAudioBuffer(file);
    const originalDuration = audioBuffer.duration;

    if (semitones === 0) {
      // No pitch shift needed, return original as WAV
      onProgress?.({ progress: 100, message: 'No pitch shift needed' });
      const blob = this.audioBufferToWav(audioBuffer);
      const blobUrl = URL.createObjectURL(blob);
      return {
        blob,
        blobUrl,
        duration: originalDuration
      };
    }

    onProgress?.({ progress: 10, message: 'Applying pitch shift...' });

    // Apply pitch shift
    const processedBuffer = await this.applyPitchShift(audioBuffer, semitones, onProgress);

    onProgress?.({ progress: 95, message: 'Encoding to WAV...' });

    // Convert to WAV blob
    const blob = this.audioBufferToWav(processedBuffer);

    onProgress?.({ progress: 100, message: 'Processing complete' });

    const blobUrl = URL.createObjectURL(blob);
    return {
      blob,
      blobUrl,
      duration: processedBuffer.duration
    };
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
export const audioProcessingService = new AudioProcessingService();
/**
 * Audio Processing Service
 * 
 * Handles preview audio processing using the central AudioEngine.
 * This service is responsible for processing uploaded audio files
 * with pitch shifting and providing Blob URLs for WaveSurfer playback.
 */

import { audioEngine, type ProcessedAudioResult } from './audioEngine';

export interface ProcessingProgress {
  progress: number;
  message: string;
}

export class AudioProcessingService {
  /**
   * Process audio file for preview playback
   */
  async processAudio(
    file: File,
    semitones: number,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessedAudioResult> {
    // Decode the audio file
    const audioBuffer = await audioEngine.decodeAudioFile(file);

    // Render preview with pitch shift
    const result = await audioEngine.renderPreview(
      audioBuffer,
      semitones,
      (progress, message) => onProgress?.({ progress, message })
    );

    return result;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    audioEngine.cleanup();
  }
}

// Export singleton instance
export const audioProcessingService = new AudioProcessingService();
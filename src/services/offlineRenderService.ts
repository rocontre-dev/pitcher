/**
 * Offline Render Service
 * 
 * Handles export audio rendering using the central AudioEngine.
 * This service is responsible for rendering audio files with both
 * pitch and speed transformations for export/download.
 */

import { audioEngine } from './audioEngine';

export interface RenderProgress {
  stage: 'decoding' | 'pitch-processing' | 'rendering' | 'encoding' | 'complete';
  message: string;
  progress: number;
}

export interface RenderResult {
  blob: Blob;
  duration: number;
}

/**
 * Render audio for export with both pitch and speed applied
 */
export async function renderAudioForExport(
  file: File,
  pitch: number,
  speed: number,
  onProgress?: (progress: RenderProgress) => void
): Promise<RenderResult> {
  onProgress?.({ stage: 'decoding', message: 'Decoding audio file...', progress: 0 });

  // Decode the audio file
  const audioBuffer = await audioEngine.decodeAudioFile(file);

  onProgress?.({ 
    stage: 'pitch-processing', 
    message: 'Applying pitch shift...', 
    progress: 20 
  });

  // Render export with pitch and speed
  const result = await audioEngine.renderExport(
    audioBuffer,
    pitch,
    speed,
    (progress, message) => {
      // Map progress to stages
      let stage: RenderProgress['stage'] = 'pitch-processing';
      if (progress >= 80) stage = 'encoding';
      else if (progress >= 50) stage = 'rendering';

      onProgress?.({
        stage,
        message,
        progress: 20 + (progress * 0.8)
      });
    }
  );

  onProgress?.({ 
    stage: 'complete', 
    message: 'Export ready!', 
    progress: 100 
  });

  return {
    blob: result.blob,
    duration: result.duration
  };
}
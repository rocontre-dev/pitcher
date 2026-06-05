/**
 * Export Service
 * 
 * Responsible for:
 * - Generating export filenames based on pitch and speed
 * - Triggering browser downloads
 * - Using offline rendering for accurate export
 * - Providing a future-proof abstraction for audio export
 */

import { renderAudioForExport, type RenderProgress } from './offlineRenderService';

export interface ExportableAudio {
  blob: Blob;
  filename: string;
}

/**
 * Generate intelligent export filename based on audio modifications
 * 
 * @param originalFileName - Original audio file name (e.g., "my-song.mp3")
 * @param pitch - Pitch shift in semitones (-12 to +12)
 * @param speed - Playback speed (0.5 to 2.0)
 * @returns Generated filename with modifications indicated
 * 
 * Examples:
 * - pitch=0, speed=1 → "my-song_original.wav"
 * - pitch=+2, speed=1 → "my-song_pitch+2_speed1.00.wav"
 * - pitch=-5, speed=0.75 → "my-song_pitch-5_speed0.75.wav"
 */
export function generateExportFilename(
  originalFileName: string,
  pitch: number,
  speed: number
): string {
  // Extract base name without extension
  const lastDotIndex = originalFileName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 
    ? originalFileName.substring(0, lastDotIndex) 
    : originalFileName;

  // Build modifier string
  let modifier: string;
  
  if (pitch === 0 && speed === 1) {
    modifier = 'original';
  } else {
    const parts: string[] = [];
    
    // Add pitch modifier
    if (pitch > 0) {
      parts.push(`pitch+${pitch}`);
    } else if (pitch < 0) {
      parts.push(`pitch${pitch}`); // pitch is already negative
    }
    
    // Add speed modifier (always include for clarity)
    parts.push(`speed${speed.toFixed(2)}`);
    
    modifier = parts.join('_');
  }

  return `${baseName}_${modifier}.wav`;
}

/**
 * Trigger browser download of audio blob
 * 
 * @param blob - Audio blob to download
 * @param filename - Name for the downloaded file
 */
export function downloadAudioBlob(blob: Blob, filename: string): void {
  // Create object URL
  const url = URL.createObjectURL(blob);
  
  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Append to document, click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Revoke object URL after a short delay to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Export and download audio with offline rendering
 * 
 * This function always renders the audio with both pitch and speed
 * transformations applied, ensuring the exported file sounds exactly
 * like the playback.
 * 
 * @param originalFile - Original audio file
 * @param pitch - Pitch shift value
 * @param speed - Playback speed
 * @param onProgress - Progress callback for export status
 * @returns True if export was successful, false otherwise
 */
export async function exportAudio(
  originalFile: File,
  pitch: number,
  speed: number,
  onProgress?: (progress: RenderProgress) => void
): Promise<boolean> {
  if (!originalFile) {
    return false;
  }

  try {
    // Render audio with both pitch and speed applied
    const result = await renderAudioForExport(
      originalFile,
      pitch,
      speed,
      onProgress
    );

    // Generate filename
    const filename = generateExportFilename(originalFile.name, pitch, speed);

    // Download the rendered file
    downloadAudioBlob(result.blob, filename);

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}
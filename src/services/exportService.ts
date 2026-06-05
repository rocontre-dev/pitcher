/**
 * Export Service
 * 
 * Responsible for:
 * - Generating export filenames based on pitch and speed
 * - Triggering browser downloads
 * - Providing a future-proof abstraction for audio export
 */

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
 * Prepare audio for export
 * 
 * @param originalFile - Original audio file
 * @param processedBlob - Processed audio blob (if pitch != 0)
 * @param pitch - Pitch shift value
 * @param speed - Playback speed
 * @returns Exportable audio with blob and filename
 */
export function prepareExport(
  originalFile: File,
  processedBlob: Blob | null,
  pitch: number,
  speed: number
): ExportableAudio | null {
  // If no file, cannot export
  if (!originalFile) {
    return null;
  }

  // Determine which blob to use
  let blob: Blob;
  
  if (pitch !== 0 && processedBlob) {
    // Use processed audio
    blob = processedBlob;
  } else if (pitch === 0) {
    // Use original file converted to blob
    // Note: We convert to WAV for consistency
    blob = originalFile;
  } else {
    // Pitch != 0 but no processed blob available yet
    return null;
  }

  // Generate filename
  const filename = generateExportFilename(originalFile.name, pitch, speed);

  return { blob, filename };
}

/**
 * Export and download audio
 * 
 * @param originalFile - Original audio file
 * @param processedBlob - Processed audio blob (if pitch != 0)
 * @param pitch - Pitch shift value
 * @param speed - Playback speed
 * @returns True if export was successful, false otherwise
 */
export function exportAudio(
  originalFile: File,
  processedBlob: Blob | null,
  pitch: number,
  speed: number
): boolean {
  const exportable = prepareExport(originalFile, processedBlob, pitch, speed);
  
  if (!exportable) {
    return false;
  }

  downloadAudioBlob(exportable.blob, exportable.filename);
  return true;
}
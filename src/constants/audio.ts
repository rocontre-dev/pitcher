/**
 * Audio Constants
 * 
 * Centralized constants for audio processing to remove magic numbers
 * and ensure consistency across the application.
 */

/**
 * Pitch range in semitones
 */
export const PITCH_MIN = -12;
export const PITCH_MAX = 12;
export const PITCH_DEFAULT = 0;
export const PITCH_STEP = 1;

/**
 * Speed/playback rate range
 */
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2.0;
export const SPEED_DEFAULT = 1.0;
export const SPEED_STEP = 0.05;

/**
 * Audio format constants
 */
export const AUDIO_SAMPLE_RATE = 44100;
export const AUDIO_BIT_DEPTH = 16;
export const AUDIO_CHANNELS = 2; // Stereo

/**
 * Processing constants
 */
export const PROCESSING_DEBOUNCE_MS = 300;

/**
 * User messages
 */
export const MESSAGES = {
  PITCH_ACTIVE: 'Pitch Shift Active',
  PITCH_NOTE: 'Preview mode changes pitch and duration.',
  PROCESSING: 'Processing...',
  EXPORT_READY: 'Export ready!',
  ERROR_DECODE: 'Unable to decode audio file. Please try another file.',
  ERROR_PROCESS: 'Unable to process audio. Please try another file.',
  ERROR_EXPORT: 'Unable to export audio. Please try again.',
} as const;
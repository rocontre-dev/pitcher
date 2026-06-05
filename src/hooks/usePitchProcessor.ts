import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../store/audioStore';
import { audioProcessingService } from '../services/audioProcessingService';
import type { ProcessingProgress } from '../services/audioProcessingService';

/**
 * usePitchProcessor Hook
 * 
 * Handles audio processing when pitch changes:
 * - Reads audioFile, pitch from Zustand store
 * - Processes audio when pitch is non-zero
 * - Skips processing when pitch is 0 (uses original)
 * - Manages loading state and errors
 * - Cleans up resources on unmount
 */

const PROCESSING_DEBOUNCE_MS = 300;

export function usePitchProcessor() {
  const audioFile = useAudioStore((state) => state.audioFile);
  const pitch = useAudioStore((state) => state.pitch);
  const setProcessedAudioUrl = useAudioStore((state) => state.setProcessedAudioUrl);
  const setIsProcessing = useAudioStore((state) => state.setIsProcessing);
  const setProcessingError = useAudioStore((state) => state.setProcessingError);

  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  const handleProgress = useCallback((progress: ProcessingProgress) => {
    console.log(`Audio Processing: ${progress.message} (${Math.round(progress.progress)}%)`);
  }, []);

  // Process audio when pitch or file changes
  useEffect(() => {
    // Clear any pending processing
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    // If no file, clear processed audio
    if (!audioFile) {
      setProcessedAudioUrl(null);
      setIsProcessing(false);
      setProcessingError(null);
      return;
    }

    // If pitch is 0, use original audio (no processing needed)
    if (pitch === 0) {
      setProcessedAudioUrl(null);
      setIsProcessing(false);
      setProcessingError(null);
      return;
    }

    // Debounce processing to avoid multiple rapid processing calls
    processingTimeoutRef.current = setTimeout(async () => {
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);
      setProcessingError(null);

      try {
        console.log(`Processing audio with pitch: ${pitch} semitones`);
        
        const result = await audioProcessingService.processAudio(
          audioFile,
          pitch,
          handleProgress
        );

        setProcessedAudioUrl(result.blobUrl);
        setIsProcessing(false);
        console.log('Audio processing complete:', result);
      } catch (error) {
        console.error('Audio processing failed:', error);
        setProcessingError(
          error instanceof Error ? error.message : 'Failed to process audio'
        );
        setIsProcessing(false);
      } finally {
        isProcessingRef.current = false;
      }
    }, PROCESSING_DEBOUNCE_MS);

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [
    audioFile,
    pitch,
    setProcessedAudioUrl,
    setIsProcessing,
    setProcessingError,
    handleProgress
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      audioProcessingService.cleanup();
    };
  }, []);
}
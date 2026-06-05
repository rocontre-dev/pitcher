import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';
import { detectBpm } from '../services/bpmDetectionService';

/**
 * useBpmDetector Hook
 * 
 * Automatically detects BPM when a new audio file is loaded.
 * Manages detection state and errors.
 */

export function useBpmDetector() {
  const audioFile = useAudioStore((state) => state.audioFile);
  const setBpm = useAudioStore((state) => state.setBpm);
  const setIsDetectingBpm = useAudioStore((state) => state.setIsDetectingBpm);
  const setBpmError = useAudioStore((state) => state.setBpmError);

  const detectionRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // If no file, reset BPM state
    if (!audioFile) {
      setBpm(null);
      setIsDetectingBpm(false);
      setBpmError(null);
      return;
    }

    // Start BPM detection
    setIsDetectingBpm(true);
    setBpmError(null);

    const detect = async () => {
      try {
        const bpm = await detectBpm(audioFile);
        setBpm(bpm);
        setBpmError(null);
      } catch (error) {
        console.error('BPM detection failed:', error);
        setBpmError('Unable to detect BPM');
        setBpm(null);
      } finally {
        setIsDetectingBpm(false);
      }
    };

    detectionRef.current = detect();

    return () => {
      // Cleanup if component unmounts or file changes
      detectionRef.current = null;
    };
  }, [audioFile, setBpm, setIsDetectingBpm, setBpmError]);
}
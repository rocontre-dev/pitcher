import { useCallback } from 'react';
import { useAudioStore } from '../../store/audioStore';
import './AudioControls.css';

export function AudioControls() {
  const isProcessing = useAudioStore((state) => state.isProcessing);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const setCurrentTime = useAudioStore((state) => state.setCurrentTime);
  const audioFile = useAudioStore((state) => state.audioFile);

  const handlePlay = useCallback(() => {
    if (audioFile) {
      setIsPlaying(true);
    }
  }, [audioFile, setIsPlaying]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [setIsPlaying, setCurrentTime]);

  const isCurrentlyPlaying = isPlaying;
  const isStopped = !isPlaying;

  return (
    <div className="audio-controls">
      <div className="controls-label">
        <span>Playback Controls</span>
      </div>
      
      <div className="controls-buttons">
        <button
          className="btn btn-icon control-btn"
          onClick={handlePlay}
          disabled={!audioFile || isCurrentlyPlaying || isProcessing}
          aria-label="Play"
          title={isProcessing ? 'Processing audio...' : 'Play'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>

        <button
          className="btn btn-icon control-btn"
          onClick={handlePause}
          disabled={!audioFile || !isCurrentlyPlaying}
          aria-label="Pause"
          title="Pause"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </button>

        <button
          className="btn btn-icon control-btn"
          onClick={handleStop}
          disabled={!audioFile || isStopped}
          aria-label="Stop"
          title="Stop"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
import { useCallback, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import './AudioControls.css';

interface AudioControlsProps {
  wavesurfer: WaveSurfer | null;
}

type PlaybackState = 'stopped' | 'playing' | 'paused';

export function AudioControls({ wavesurfer }: AudioControlsProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');

  const handlePlay = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.play();
    }
  }, [wavesurfer]);

  const handlePause = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.pause();
    }
  }, [wavesurfer]);

  const handleStop = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.stop();
    }
  }, [wavesurfer]);

  // Listen to wavesurfer events
  useEffect(() => {
    if (!wavesurfer) return;

    const handlePlay = () => setPlaybackState('playing');
    const handlePause = () => setPlaybackState('paused');
    const handleFinish = () => setPlaybackState('stopped');

    wavesurfer.on('play', handlePlay);
    wavesurfer.on('pause', handlePause);
    wavesurfer.on('finish', handleFinish);

    return () => {
      wavesurfer.un('play', handlePlay);
      wavesurfer.un('pause', handlePause);
      wavesurfer.un('finish', handleFinish);
    };
  }, [wavesurfer]);

  // Reset state when wavesurfer changes
  useEffect(() => {
    setPlaybackState('stopped');
  }, [wavesurfer]);

  const isPlaying = playbackState === 'playing';
  const isStopped = playbackState === 'stopped';

  return (
    <div className="audio-controls">
      <div className="controls-label">
        <span>Playback Controls</span>
      </div>
      
      <div className="controls-buttons">
        <button
          className="btn btn-icon control-btn"
          onClick={handlePlay}
          disabled={!wavesurfer || isPlaying}
          aria-label="Play"
          title="Play"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>

        <button
          className="btn btn-icon control-btn"
          onClick={handlePause}
          disabled={!wavesurfer || !isPlaying}
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
          disabled={!wavesurfer || isStopped}
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
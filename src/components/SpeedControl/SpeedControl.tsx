import { useCallback, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useAudioStore } from '../../store/audioStore';
import './SpeedControl.css';

interface SpeedControlProps {
  wavesurfer: WaveSurfer | null;
}

export function SpeedControl({ wavesurfer }: SpeedControlProps) {
  const speed = useAudioStore((state) => state.speed);
  const setSpeed = useAudioStore((state) => state.setSpeed);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSpeed(value);
  }, [setSpeed]);

  // Update WaveSurfer playback rate when speed changes
  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(speed);
    }
  }, [speed, wavesurfer]);

  const formatSpeed = (value: number): string => {
    return value.toFixed(2) + 'x';
  };

  // Calculate percentage for background gradient
  const percentage = ((speed - 0.5) / 1.5) * 100;

  // Preset speed buttons
  const presets = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const handlePresetClick = useCallback((presetSpeed: number) => {
    setSpeed(presetSpeed);
  }, [setSpeed]);

  return (
    <div className="speed-control">
      <div className="speed-header">
        <div className="speed-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Speed</span>
        </div>
        <div className="speed-value">
          <span className="speed-display">{formatSpeed(speed)}</span>
        </div>
      </div>

      <div className="speed-slider-container">
        <span className="slider-min">0.5x</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={speed}
          onChange={handleSpeedChange}
          className="speed-slider"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--border-color) ${percentage}%, var(--border-color) 100%)`
          }}
          aria-label="Playback speed"
        />
        <span className="slider-max">2.0x</span>
      </div>

      <div className="speed-presets">
        {presets.map((preset) => (
          <button
            key={preset}
            className={`preset-btn ${speed === preset ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset)}
            aria-label={`Set speed to ${preset}x`}
            title={`${preset}x`}
          >
            {preset}x
          </button>
        ))}
      </div>
    </div>
  );
}
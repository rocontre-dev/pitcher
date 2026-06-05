import { useCallback } from 'react';
import { useAudioStore } from '../../store/audioStore';
import './PitchControl.css';

export function PitchControl() {
  const pitch = useAudioStore((state) => state.pitch);
  const setPitch = useAudioStore((state) => state.setPitch);

  const handlePitchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPitch(value);
  }, [setPitch]);

  const formatPitch = (value: number): string => {
    if (value > 0) {
      return `+${value}`;
    }
    return `${value}`;
  };

  // Calculate percentage for background gradient
  const percentage = ((pitch + 12) / 24) * 100;

  return (
    <div className="pitch-control">
      <div className="pitch-header">
        <div className="pitch-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>Pitch</span>
        </div>
        <div className="pitch-value">
          <span className={`pitch-semitones ${pitch !== 0 ? 'active' : ''}`}>
            {formatPitch(pitch)} semitones
          </span>
        </div>
      </div>

      <div className="pitch-slider-container">
        <span className="slider-min">-12</span>
        <input
          type="range"
          min="-12"
          max="12"
          step="1"
          value={pitch}
          onChange={handlePitchChange}
          className="pitch-slider"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percentage}%, var(--border-color) ${percentage}%, var(--border-color) 100%)`
          }}
          aria-label="Pitch adjustment in semitones"
        />
        <span className="slider-max">+12</span>
      </div>

      <div className="pitch-markers">
        <span className="marker center">0</span>
      </div>

      <p className="pitch-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Pitch shifting coming in Phase 2</span>
      </p>
    </div>
  );
}
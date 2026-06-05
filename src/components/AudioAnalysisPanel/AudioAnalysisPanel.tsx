import { useAudioStore } from '../../store/audioStore';
import './AudioAnalysisPanel.css';

export function AudioAnalysisPanel() {
  const bpm = useAudioStore((state) => state.bpm);
  const isDetectingBpm = useAudioStore((state) => state.isDetectingBpm);
  const bpmError = useAudioStore((state) => state.bpmError);
  const key = useAudioStore((state) => state.key);
  const audioFile = useAudioStore((state) => state.audioFile);

  // Determine BPM display
  const getBpmDisplay = () => {
    if (!audioFile) {
      return { value: '--', status: 'none' as const };
    }

    if (isDetectingBpm) {
      return { value: 'Detecting...', status: 'detecting' as const };
    }

    if (bpmError) {
      return { value: 'Unable to detect', status: 'error' as const };
    }

    if (bpm !== null) {
      return { value: `${bpm} BPM`, status: 'detected' as const };
    }

    return { value: '--', status: 'none' as const };
  };

  // Determine Key display
  const getKeyDisplay = () => {
    if (!audioFile) {
      return { value: '--', status: 'none' as const };
    }

    if (key) {
      return { value: key, status: 'detected' as const };
    }

    return { value: 'Not detected yet', status: 'none' as const };
  };

  const bpmDisplay = getBpmDisplay();
  const keyDisplay = getKeyDisplay();

  return (
    <div className="audio-analysis-panel">
      <div className="analysis-header">
        <div className="analysis-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1Z" />
            <path d="M19 12h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" />
            <path d="M15 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
            <path d="M11 13h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
            <path d="M7 16h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          </svg>
          <span>Audio Analysis</span>
        </div>
      </div>

      <div className="analysis-content">
        <div className="analysis-item">
          <div className="analysis-metric">
            <span className="metric-label">BPM</span>
            <span className={`metric-value ${bpmDisplay.status}`}>
              {isDetectingBpm && (
                <span className="metric-spinner" />
              )}
              {bpmDisplay.value}
            </span>
          </div>
        </div>

        <div className="analysis-item">
          <div className="analysis-metric">
            <span className="metric-label">KEY</span>
            <span className={`metric-value ${keyDisplay.status}`}>
              {keyDisplay.value}
            </span>
          </div>
        </div>
      </div>

      <div className="analysis-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>BPM detection is an estimate</span>
      </div>
    </div>
  );
}
import { usePitchProcessor } from './hooks/usePitchProcessor';
import { useBpmDetector } from './hooks/useBpmDetector';
import { useAudioStore } from './store/audioStore';
import { AudioUploader } from './components/AudioUploader/AudioUploader';
import { TimelinePlayer } from './components/TimelinePlayer/TimelinePlayer';
import { AudioAnalysisPanel } from './components/AudioAnalysisPanel/AudioAnalysisPanel';
import { AudioControls } from './components/AudioControls/AudioControls';
import { PitchControl } from './components/PitchControl/PitchControl';
import { SpeedControl } from './components/SpeedControl/SpeedControl';
import { ExportPanel } from './components/ExportPanel/ExportPanel';
import './App.css';

// Import dev test tool (exposes window.testPitchShift)
import './dev/audioEngineTest';

function App() {
  const processingError = useAudioStore((state) => state.processingError);

  // Initialize pitch processor hook
  usePitchProcessor();
  
  // Initialize BPM detector hook
  useBpmDetector();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <h1>Pitcher</h1>
          </div>
          <p className="tagline">Audio Practice Tool</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Processing Error */}
          {processingError && (
            <div className="error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{processingError}</span>
            </div>
          )}

          {/* Audio Uploader */}
          <section className="section uploader-section">
            <AudioUploader />
          </section>

          {/* Timeline Player */}
          <section className="section timeline-section">
            <TimelinePlayer />
          </section>

          {/* Audio Analysis Panel */}
          <section className="section analysis-section">
            <AudioAnalysisPanel />
          </section>

          {/* Controls Grid */}
          <div className="controls-grid">
            {/* Pitch Control */}
            <section className="section pitch-section">
              <PitchControl />
            </section>

            {/* Speed Control */}
            <section className="section speed-section">
              <SpeedControl />
            </section>
          </div>

          {/* Audio Controls */}
          <section className="section controls-section">
            <AudioControls />
          </section>

          {/* Export Panel */}
          <section className="section export-section">
            <ExportPanel />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Pitcher &middot; Audio Practice Tool &middot; Phase 5 - BPM Detection</p>
      </footer>
    </div>
  );
}

export default App;
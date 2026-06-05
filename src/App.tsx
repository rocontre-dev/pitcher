import { useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePitchProcessor } from './hooks/usePitchProcessor';
import { useAudioStore } from './store/audioStore';
import { AudioUploader } from './components/AudioUploader/AudioUploader';
import { WaveformViewer } from './components/WaveformViewer/WaveformViewer';
import { AudioControls } from './components/AudioControls/AudioControls';
import { PitchControl } from './components/PitchControl/PitchControl';
import { SpeedControl } from './components/SpeedControl/SpeedControl';
import './App.css';

function App() {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const processingError = useAudioStore((state) => state.processingError);

  // Initialize pitch processor hook
  usePitchProcessor();

  const handleWaveSurferReady = useCallback((ws: WaveSurfer) => {
    setWavesurfer(ws);
  }, []);

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

          {/* Waveform Viewer */}
          <section className="section waveform-section">
            <WaveformViewer onWaveSurferReady={handleWaveSurferReady} />
          </section>

          {/* Controls Grid */}
          <div className="controls-grid">
            {/* Pitch Control */}
            <section className="section pitch-section">
              <PitchControl />
            </section>

            {/* Speed Control */}
            <section className="section speed-section">
              <SpeedControl wavesurfer={wavesurfer} />
            </section>
          </div>

          {/* Audio Controls */}
          <section className="section controls-section">
            <AudioControls wavesurfer={wavesurfer} />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Pitcher &middot; Audio Practice Tool &middot; Phase 2 - Real Pitch Shifting</p>
      </footer>
    </div>
  );
}

export default App;
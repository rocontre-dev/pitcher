import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useAudioStore } from '../../store/audioStore';
import './WaveformViewer.css';

interface WaveformViewerProps {
  onWaveSurferReady?: (wavesurfer: WaveSurfer) => void;
}

export function WaveformViewer({ onWaveSurferReady }: WaveformViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const audioFile = useAudioStore((state) => state.audioFile);
  const speed = useAudioStore((state) => state.speed);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#444466',
      progressColor: '#6C63FF',
      cursorColor: '#FFFFFF',
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      cursorWidth: 2,
      height: 180,
      barHeight: 0.8,
      normalize: true,
      interact: true,
      autoCenter: true,
      autoScroll: true,
      minPxPerSec: 50,
      fillParent: true,
    });

    const ws = wavesurferRef.current;

    // Event listeners
    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setIsReady(true);
      onWaveSurferReady?.(ws);
    });

    ws.on('play', () => {});
    ws.on('pause', () => {});
    ws.on('audioprocess', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('timeupdate', () => setCurrentTime(ws.getCurrentTime()));
    ws.on('finish', () => {
      setCurrentTime(0);
    });

    ws.on('interaction', () => {
      ws.play();
    });

    return () => {
      ws.destroy();
    };
  }, [onWaveSurferReady]);

  // Load new audio file
  useEffect(() => {
    if (!audioFile || !wavesurferRef.current) return;

    const objectUrl = URL.createObjectURL(audioFile);
    wavesurferRef.current.load(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [audioFile]);

  // Update playback speed
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setPlaybackRate(speed);
    }
  }, [speed, isReady]);

  // Expose WaveSurfer instance for controls
  useEffect(() => {
    if (wavesurferRef.current) {
      (window as Window & { __wavesurfer?: WaveSurfer }).__wavesurfer = wavesurferRef.current;
    }
    return () => {
      delete (window as Window & { __wavesurfer?: WaveSurfer }).__wavesurfer;
    };
  }, []);

  return (
    <div className="waveform-viewer">
      <div className="waveform-header">
        <span className="time-current">{formatTime(currentTime)}</span>
        <div className="waveform-title">Waveform</div>
        <span className="time-total">{formatTime(duration)}</span>
      </div>

      <div className="waveform-container">
        {!audioFile && (
          <div className="waveform-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            <p>Load an audio file to see the waveform</p>
          </div>
        )}
        <div ref={containerRef} className="waveform-wave" />
      </div>

      {audioFile && isReady && (
        <div className="waveform-progress-bar">
          <div 
            className="waveform-progress-fill" 
            style={{ width: duration > 0 ? (currentTime / duration) * 100 + '%' : '0%' }}
          />
        </div>
      )}
    </div>
  );
}
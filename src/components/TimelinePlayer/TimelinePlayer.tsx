import { useRef, useEffect, useCallback, useState } from 'react';
import { useAudioStore } from '../../store/audioStore';
import './TimelinePlayer.css';

/**
 * TimelinePlayer
 * 
 * A simple, musician-focused audio player that replaces the waveform visualization.
 * Provides current time, duration, seek functionality, and playback control.
 * 
 * Future-ready for A-B loop functionality.
 */

export function TimelinePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const audioFile = useAudioStore((state) => state.audioFile);
  const processedAudioUrl = useAudioStore((state) => state.processedAudioUrl);
  const speed = useAudioStore((state) => state.speed);
  const isProcessing = useAudioStore((state) => state.isProcessing);
  
  const currentTime = useAudioStore((state) => state.currentTime);
  const duration = useAudioStore((state) => state.duration);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  
  const setCurrentTime = useAudioStore((state) => state.setCurrentTime);
  const setDuration = useAudioStore((state) => state.setDuration);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isDragging, setCurrentTime, setDuration, setIsPlaying]);

  // Update playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Handle audio source changes (when pitch changes)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Stop playback when source changes
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);

    // Set new source
    const audioSource = processedAudioUrl || (audioFile ? URL.createObjectURL(audioFile) : null);
    if (audioSource) {
      audio.src = audioSource;
      audio.load();
    } else {
      audio.src = '';
    }
  }, [audioFile, processedAudioUrl, setIsPlaying, setCurrentTime]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Playback failed:', err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Handle timeline click/drag for seeking
  const handleTimelineInteraction = useCallback((clientX: number) => {
    const timeline = timelineRef.current;
    const audio = audioRef.current;
    if (!timeline || !audio || !duration) return;

    const rect = timeline.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration, setCurrentTime]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    handleTimelineInteraction(e.clientX);
  }, [handleTimelineInteraction]);

  const handleTimelineMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleTimelineInteraction(e.clientX);
  }, [handleTimelineInteraction]);

  // Handle global mouse move/up for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleTimelineInteraction(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleTimelineInteraction]);

  // Get filename for display
  const fileName = audioFile ? audioFile.name : '';

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="timeline-player">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      {/* File name display */}
      {fileName && (
        <div className="timeline-filename">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>{fileName}</span>
        </div>
      )}

      {/* Time display and timeline */}
      <div className="timeline-content">
        <span className="timeline-current">{formatTime(currentTime)}</span>
        
        <div 
          ref={timelineRef}
          className={`timeline-bar ${isDragging ? 'dragging' : ''}`}
          onClick={handleTimelineClick}
          onMouseDown={handleTimelineMouseDown}
          role="slider"
          aria-label="Audio timeline"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration}
          tabIndex={0}
        >
          {/* Progress fill */}
          <div 
            className="timeline-progress" 
            style={{ width: `${progress}%` }}
          />
          
          {/* Thumb */}
          <div 
            className="timeline-thumb" 
            style={{ left: `${progress}%` }}
          />

          {/* Future A-B loop markers (placeholder) */}
          <div className="timeline-markers">
            {/* <div className="marker-a" style={{ left: '20%' }} /> */}
            {/* <div className="marker-b" style={{ left: '80%' }} /> */}
          </div>
        </div>

        <span className="timeline-total">{formatTime(duration)}</span>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="timeline-processing">
          <div className="processing-spinner" />
          <span>Processing...</span>
        </div>
      )}

      {/* No audio placeholder */}
      {!audioFile && !isProcessing && (
        <div className="timeline-placeholder">
          <span>Upload an audio file to begin</span>
        </div>
      )}
    </div>
  );
}
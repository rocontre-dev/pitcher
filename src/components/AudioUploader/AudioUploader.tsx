import { useCallback, useState } from 'react';
import { useAudioStore } from '../../store/audioStore';
import './AudioUploader.css';

const ACCEPTED_FILE_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/aac'];
const ACCEPTED_EXTENSIONS = '.mp3,.wav,.m4a,.ogg';

interface AudioUploaderProps {
  onFileLoaded?: () => void;
}

export function AudioUploader({ onFileLoaded }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAudioFile = useAudioStore((state) => state.setAudioFile);
  const audioFile = useAudioStore((state) => state.audioFile);

  const validateFile = useCallback((file: File): boolean => {
    const isValidType = ACCEPTED_FILE_TYPES.includes(file.type) ||
      /\.(mp3|wav|m4a|ogg)$/i.test(file.name);
    
    if (!isValidType) {
      setError('Invalid file type. Please upload MP3, WAV, M4A, or OGG files.');
      return false;
    }

    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      setError('File is too large. Please upload a file under 100MB.');
      return false;
    }

    setError(null);
    return true;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setAudioFile(file);
      onFileLoaded?.();
    }
  }, [validateFile, setAudioFile, onFileLoaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleButtonClick = useCallback(() => {
    const input = document.getElementById('audio-file-input');
    if (input) {
      input.click();
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="audio-uploader">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${audioFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        role="button"
        tabIndex={0}
        aria-label="Upload audio file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleButtonClick();
          }
        }}
      >
        <input
          id="audio-file-input"
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {audioFile ? (
          <div className="file-info">
            <div className="file-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div className="file-details">
              <span className="file-name">{audioFile.name}</span>
              <span className="file-size">{formatFileSize(audioFile.size)}</span>
            </div>
            <div className="file-status">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Ready</span>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="upload-text">Drag and drop your audio file here</p>
            <p className="upload-subtext">or click to browse</p>
            <p className="upload-formats">MP3, WAV, M4A, OGG</p>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
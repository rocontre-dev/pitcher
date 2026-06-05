import { useCallback } from 'react';
import { useAudioStore } from '../../store/audioStore';
import { exportAudio, generateExportFilename } from '../../services/exportService';
import './ExportPanel.css';

export function ExportPanel() {
  const audioFile = useAudioStore((state) => state.audioFile);
  const pitch = useAudioStore((state) => state.pitch);
  const speed = useAudioStore((state) => state.speed);
  const processedAudioBlob = useAudioStore((state) => state.processedAudioBlob);
  const isProcessing = useAudioStore((state) => state.isProcessing);

  // Determine export status
  const getExportStatus = useCallback((): { status: 'none' | 'ready' | 'processing' | 'needs-processing'; message: string } => {
    if (!audioFile) {
      return { status: 'none', message: 'No audio loaded' };
    }

    if (isProcessing) {
      return { status: 'processing', message: 'Processing audio...' };
    }

    if (pitch !== 0 && !processedAudioBlob) {
      return { status: 'needs-processing', message: 'Adjust pitch to enable export' };
    }

    return { status: 'ready', message: 'Export Ready' };
  }, [audioFile, pitch, processedAudioBlob, isProcessing]);

  // Generate preview filename
  const getPreviewFilename = useCallback((): string => {
    if (!audioFile) return '';
    return generateExportFilename(audioFile.name, pitch, speed);
  }, [audioFile, pitch, speed]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!audioFile) return;

    const success = exportAudio(audioFile, processedAudioBlob, pitch, speed);
    
    if (!success) {
      console.error('Export failed: No audio available for export');
    }
  }, [audioFile, processedAudioBlob, pitch, speed]);

  const exportStatus = getExportStatus();
  const previewFilename = getPreviewFilename();
  const isDownloadDisabled = exportStatus.status !== 'ready';

  return (
    <div className="export-panel">
      <div className="export-header">
        <div className="export-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export Audio</span>
        </div>
        <div className={`export-status ${exportStatus.status}`}>
          {exportStatus.message}
        </div>
      </div>

      <div className="export-content">
        <div className="filename-preview">
          <span className="filename-label">Filename:</span>
          <span className="filename-value">
            {previewFilename || '—'}
          </span>
        </div>

        <button
          className="btn btn-primary download-btn"
          onClick={handleDownload}
          disabled={isDownloadDisabled}
          aria-label="Download WAV file"
        >
          {isProcessing ? (
            <>
              <span className="btn-spinner" />
              Processing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download WAV
            </>
          )}
        </button>
      </div>

      <div className="export-info">
        <p>
          {exportStatus.status === 'ready' && 'Click to download your modified audio file.'}
          {exportStatus.status === 'none' && 'Upload an audio file to get started.'}
          {exportStatus.status === 'processing' && 'Please wait for processing to complete.'}
          {exportStatus.status === 'needs-processing' && 'Pitch-shifted audio will be available after processing.'}
        </p>
      </div>
    </div>
  );
}
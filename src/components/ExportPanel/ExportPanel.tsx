import { useCallback, useState } from 'react';
import { useAudioStore } from '../../store/audioStore';
import { exportAudio, generateExportFilename } from '../../services/exportService';
import type { RenderProgress } from '../../services/offlineRenderService';
import './ExportPanel.css';

export function ExportPanel() {
  const audioFile = useAudioStore((state) => state.audioFile);
  const pitch = useAudioStore((state) => state.pitch);
  const speed = useAudioStore((state) => state.speed);
  const isProcessing = useAudioStore((state) => state.isProcessing);
  const isExporting = useAudioStore((state) => state.isExporting);
  const exportProgress = useAudioStore((state) => state.exportProgress);
  const setIsExporting = useAudioStore((state) => state.setIsExporting);
  const setExportProgress = useAudioStore((state) => state.setExportProgress);

  // Local state for render progress
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);

  // Determine export status
  const getExportStatus = useCallback((): { status: 'none' | 'ready' | 'processing' | 'exporting'; message: string } => {
    if (!audioFile) {
      return { status: 'none', message: 'No audio loaded' };
    }

    if (isExporting) {
      return { status: 'exporting', message: exportProgress || 'Exporting...' };
    }

    if (isProcessing) {
      return { status: 'processing', message: 'Processing audio...' };
    }

    return { status: 'ready', message: 'Export Ready' };
  }, [audioFile, isProcessing, isExporting, exportProgress]);

  // Generate preview filename
  const getPreviewFilename = useCallback((): string => {
    if (!audioFile) return '';
    return generateExportFilename(audioFile.name, pitch, speed);
  }, [audioFile, pitch, speed]);

  // Handle download with offline rendering
  const handleDownload = useCallback(async () => {
    if (!audioFile) return;

    setIsExporting(true);
    setRenderProgress(null);

    const onProgress = (progress: RenderProgress) => {
      setRenderProgress(progress);
      setExportProgress(progress.message);
    };

    try {
      onProgress({ stage: 'decoding', message: 'Preparing export...', progress: 0 });

      const success = await exportAudio(audioFile, pitch, speed, onProgress);
      
      if (!success) {
        console.error('Export failed: No audio available for export');
        setExportProgress('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportProgress('Export failed');
    } finally {
      setIsExporting(false);
      setRenderProgress(null);
    }
  }, [audioFile, pitch, speed, setIsExporting, setExportProgress]);

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

        {renderProgress && (
          <div className="export-progress-bar">
            <div 
              className="export-progress-fill" 
              style={{ width: `${renderProgress.progress}%` }}
            />
          </div>
        )}

        <button
          className="btn btn-primary download-btn"
          onClick={handleDownload}
          disabled={isDownloadDisabled}
          aria-label="Download WAV file"
        >
          {isExporting ? (
            <>
              <span className="btn-spinner" />
              {renderProgress?.message || 'Rendering...'}
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
          {exportStatus.status === 'ready' && 'Click to render and download your modified audio file.'}
          {exportStatus.status === 'none' && 'Upload an audio file to get started.'}
          {exportStatus.status === 'processing' && 'Please wait for pitch processing to complete.'}
          {exportStatus.status === 'exporting' && 'Rendering audio with pitch and speed applied...'}
        </p>
      </div>
    </div>
  );
}
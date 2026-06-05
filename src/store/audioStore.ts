import { create } from 'zustand';

interface AudioState {
  audioFile: File | null;
  pitch: number;
  speed: number;
  processedAudioUrl: string | null;
  processedAudioBlob: Blob | null;
  isProcessing: boolean;
  processingError: string | null;
  isExporting: boolean;
  exportProgress: string;

  setAudioFile: (file: File) => void;
  setPitch: (value: number) => void;
  setSpeed: (value: number) => void;
  setProcessedAudioUrl: (url: string | null) => void;
  setProcessedAudioBlob: (blob: Blob | null) => void;
  setIsProcessing: (value: boolean) => void;
  setProcessingError: (message: string | null) => void;
  setIsExporting: (value: boolean) => void;
  setExportProgress: (message: string) => void;
  reset: () => void;
}

const initialState = {
  audioFile: null,
  pitch: 0,
  speed: 1,
  processedAudioUrl: null,
  processedAudioBlob: null,
  isProcessing: false,
  processingError: null,
  isExporting: false,
  exportProgress: '',
};

export const useAudioStore = create<AudioState>((set) => ({
  // State
  audioFile: null,
  pitch: 0,
  speed: 1,
  processedAudioUrl: null,
  processedAudioBlob: null,
  isProcessing: false,
  processingError: null,
  isExporting: false,
  exportProgress: '',

  // Actions
  setAudioFile: (file: File) => {
    // Clear previous processed audio and reset state
    const state = useAudioStore.getState();
    if (state.processedAudioUrl) {
      URL.revokeObjectURL(state.processedAudioUrl);
    }
    set({
      audioFile: file,
      processedAudioUrl: null,
      processedAudioBlob: null,
      pitch: 0,
      speed: 1,
      processingError: null,
    });
  },

  setPitch: (value: number) => {
    // Clamp value between -12 and +12
    const clampedValue = Math.max(-12, Math.min(12, value));
    set({ pitch: clampedValue });
  },

  setSpeed: (value: number) => {
    // Clamp value between 0.5 and 2.0
    const clampedValue = Math.max(0.5, Math.min(2.0, value));
    set({ speed: clampedValue });
  },

  setProcessedAudioUrl: (url: string | null) => {
    // Revoke old URL if exists
    const state = useAudioStore.getState();
    if (state.processedAudioUrl) {
      URL.revokeObjectURL(state.processedAudioUrl);
    }
    set({ processedAudioUrl: url });
  },

  setProcessedAudioBlob: (blob: Blob | null) => {
    set({ processedAudioBlob: blob });
  },

  setIsProcessing: (value: boolean) => {
    set({ isProcessing: value });
  },

  setProcessingError: (message: string | null) => {
    set({ processingError: message });
  },

  setIsExporting: (value: boolean) => {
    set({ isExporting: value });
  },

  setExportProgress: (message: string) => {
    set({ exportProgress: message });
  },

  reset: () => {
    const state = useAudioStore.getState();
    if (state.processedAudioUrl) {
      URL.revokeObjectURL(state.processedAudioUrl);
    }
    set(initialState);
  },
}));
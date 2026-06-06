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
  bpm: number | null;
  isDetectingBpm: boolean;
  bpmError: string | null;
  key: string | null;
  // Timeline player state
  currentTime: number;
  duration: number;
  isPlaying: boolean;

  setAudioFile: (file: File) => void;
  setPitch: (value: number) => void;
  setSpeed: (value: number) => void;
  setProcessedAudioUrl: (url: string | null) => void;
  setProcessedAudioBlob: (blob: Blob | null) => void;
  setIsProcessing: (value: boolean) => void;
  setProcessingError: (message: string | null) => void;
  setIsExporting: (value: boolean) => void;
  setExportProgress: (message: string) => void;
  setBpm: (value: number | null) => void;
  setIsDetectingBpm: (value: boolean) => void;
  setBpmError: (message: string | null) => void;
  setKey: (value: string | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;
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
  bpm: null,
  isDetectingBpm: false,
  bpmError: null,
  key: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
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
  bpm: null,
  isDetectingBpm: false,
  bpmError: null,
  key: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,

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
      bpm: null,
      isDetectingBpm: false,
      bpmError: null,
      key: null,
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

  setBpm: (value: number | null) => {
    set({ bpm: value });
  },

  setIsDetectingBpm: (value: boolean) => {
    set({ isDetectingBpm: value });
  },

  setBpmError: (message: string | null) => {
    set({ bpmError: message });
  },

  setKey: (value: string | null) => {
    set({ key: value });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  setDuration: (duration: number) => {
    set({ duration });
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  reset: () => {
    const state = useAudioStore.getState();
    if (state.processedAudioUrl) {
      URL.revokeObjectURL(state.processedAudioUrl);
    }
    set(initialState);
  },
}));
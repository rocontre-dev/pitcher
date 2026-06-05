import { create } from 'zustand';

interface AudioState {
  audioFile: File | null;
  pitch: number;
  speed: number;

  setAudioFile: (file: File) => void;
  setPitch: (value: number) => void;
  setSpeed: (value: number) => void;
  reset: () => void;
}

const initialState = {
  audioFile: null,
  pitch: 0,
  speed: 1,
};

export const useAudioStore = create<AudioState>((set) => ({
  // State
  audioFile: null,
  pitch: 0,
  speed: 1,

  // Actions
  setAudioFile: (file: File) => {
    set({ audioFile: file });
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

  reset: () => {
    set(initialState);
  },
}));
/**
 * Type definitions for soundtouchjs
 * 
 * Based on the actual implementation in node_modules/soundtouchjs/dist/soundtouch.js
 * 
 * The SoundTouch library provides time-stretching and pitch-shifting algorithms.
 * Key insight: SoundTouch uses a buffer-based processing model:
 * 1. Samples go into inputBuffer
 * 2. process() is called to transform them
 * 3. Processed samples come out of outputBuffer
 */

declare module 'soundtouchjs' {
  /**
   * FIFO sample buffer for audio processing
   * SoundTouch works with stereo frames (2 samples per frame)
   */
  export class FifoSampleBuffer {
    vector: Float32Array;
    position: number;
    frameCount: number;
    startIndex: number;
    endIndex: number;
    
    clear(): void;
    put(numFrames: number): void;
    putSamples(samples: Float32Array, position: number, numFrames?: number): void;
    putBuffer(buffer: FifoSampleBuffer, position: number, numFrames?: number): void;
    receive(numFrames: number): void;
    receiveSamples(output: Float32Array, numFrames: number): void;
    extract(output: Float32Array, position: number, numFrames: number): void;
    ensureCapacity(numFrames: number): void;
    ensureAdditionalCapacity(numFrames: number): void;
    rewind(): void;
  }

  /**
   * Base class for sample processing pipes
   */
  export class AbstractFifoSamplePipe {
    inputBuffer: FifoSampleBuffer;
    outputBuffer: FifoSampleBuffer;
    
    clear(): void;
  }

  /**
   * Rate transposer - changes playback rate (affects pitch)
   */
  export class RateTransposer extends AbstractFifoSamplePipe {
    constructor();
    rate: number;
    reset(): void;
    clear(): void;
    clone(): RateTransposer;
    process(): void;
  }

  /**
   * Stretch processor - changes tempo without affecting pitch
   * Uses phase vocoder / WSOLA algorithm
   */
  export class Stretch extends AbstractFifoSamplePipe {
    constructor(createBuffers?: boolean);
    tempo: number;
    quickSeek: boolean;
    inputChunkSize: number;
    outputChunkSize: number;
    
    setParameters(sampleRate: number, sequenceMs: number, seekWindowMs: number, overlapMs: number): void;
    clear(): void;
    clearMidBuffer(): void;
    clone(): Stretch;
    process(): void;
    seekBestOverlapPosition(): number;
  }

  /**
   * Main SoundTouch processor for pitch and tempo manipulation
   * 
   * The correct usage pattern is:
   * 1. Set pitch, tempo, rate properties
   * 2. Put samples into inputBuffer
   * 3. Call process()
   * 4. Receive processed samples from outputBuffer
   * 
   * For pitch shifting with time preservation:
   * - Set pitch to desired ratio
   * - Set tempo to 1 (preserve original tempo)
   * - Set rate to 1 (preserve original rate)
   */
  export class SoundTouch {
    transposer: RateTransposer;
    stretch: Stretch;
    inputBuffer: FifoSampleBuffer;
    outputBuffer: FifoSampleBuffer;
    
    // Virtual settings (used to calculate effective rate/tempo)
    virtualPitch: number;
    virtualRate: number;
    virtualTempo: number;
    
    // Effective settings
    rate: number;
    tempo: number;
    
    // Pitch settings
    pitch: number;
    pitchOctaves: number;
    pitchSemitones: number;
    
    constructor();
    clear(): void;
    clone(): SoundTouch;
    process(): void;
    calculateEffectiveRateAndTempo(): void;
  }

  /**
   * Simple real-time filter for web audio
   */
  export class SimpleFilter {
    pipe: AbstractFifoSamplePipe;
    inputBuffer: FifoSampleBuffer;
    outputBuffer: FifoSampleBuffer;
    position: number;
    sourcePosition: number;
    
    constructor(sourceSound: any, pipe: AbstractFifoSamplePipe, callback?: () => void);
    onEnd(): void;
    fillInputBuffer(numFrames?: number): void;
    fillOutputBuffer(numFrames?: number): void;
    extract(target: Float32Array, numFrames: number): number;
    handleSampleData(event: any): void;
    clear(): void;
  }

  /**
   * Web Audio buffer source for use with SoundTouch
   */
  export class WebAudioBufferSource {
    buffer: AudioBuffer;
    position: number;
    dualChannel: boolean;
    
    constructor(buffer: AudioBuffer);
    extract(target: Float32Array, numFrames: number, position: number): number;
  }

  /**
   * High-level pitch shifter for real-time web audio processing
   */
  export class PitchShifter {
    node: ScriptProcessorNode;
    tempo: number;
    rate: number;
    pitch: number;
    pitchSemitones: number;
    duration: number;
    sampleRate: number;
    timePlayed: number;
    sourcePosition: number;
    formattedDuration: string;
    formattedTimePlayed: string;
    percentagePlayed: number;
    
    constructor(context: AudioContext, buffer: AudioBuffer, bufferSize?: number, onEnd?: () => void);
    connect(destination: AudioNode): void;
    disconnect(): void;
    on(eventName: string, callback: (detail: any) => void): void;
    off(eventName?: string): void;
  }

  /**
   * Get a Web Audio node for real-time processing
   */
  export function getWebAudioNode(
    context: AudioContext,
    filter: SimpleFilter,
    sourcePositionCallback?: (position: number) => void,
    bufferSize?: number
  ): ScriptProcessorNode;
}
declare module 'soundtouchjs' {
  export class SoundTouch {
    constructor(sampleRate: number);
    pitch: number;
    rate: number;
    tempo: number;
    putSamples(samples: Float32Array, offset: number, numSamples: number): void;
    receiveSamples(output: Float32Array, maxSamples: number): number;
    flush(): void;
    clear(): void;
  }

  export class AbstractFifoSamplePipe {
    constructor(sampleRate: number);
  }

  export class PitchShifter extends AbstractFifoSamplePipe {
    constructor(sampleRate: number);
    setPitch(pitch: number): void;
    setPitchSemitones(semitones: number): void;
    setRate(rate: number): void;
    setTempo(tempo: number): void;
  }

  export class RateTransposer extends AbstractFifoSamplePipe {
    constructor(sampleRate: number);
    setRate(rate: number): void;
  }

  export class Stretch extends AbstractFifoSamplePipe {
    constructor(sampleRate: number);
    setTempo(tempo: number): void;
  }

  export class SimpleFilter {
    constructor(soundTouch: SoundTouch, webAudioContext: AudioContext);
    connect(destination: AudioNode): void;
    disconnect(): void;
  }

  export class WebAudioBufferSource {
    // WebAudio buffer source implementation
  }

  export function getWebAudioNode(audioContext: AudioContext): AudioWorkletNode;
}
/**
 * Offline Render Service
 * 
 * Uses OfflineAudioContext to render audio with both pitch and speed
 * transformations applied. This ensures the exported file sounds exactly
 * the same as what the user hears during playback.
 */

import { SoundTouch } from 'soundtouchjs';

export interface RenderProgress {
  stage: 'decoding' | 'pitch-processing' | 'rendering' | 'encoding' | 'complete';
  message: string;
  progress: number;
}

export interface RenderResult {
  blob: Blob;
  duration: number;
}

/**
 * Render audio for export with both pitch and speed applied
 * 
 * @param file - Original audio file
 * @param pitch - Pitch shift in semitones (-12 to +12)
 * @param speed - Playback speed (0.5 to 2.0)
 * @param onProgress - Progress callback
 * @returns Rendered audio as WAV blob
 */
export async function renderAudioForExport(
  file: File,
  pitch: number,
  speed: number,
  onProgress?: (progress: RenderProgress) => void
): Promise<RenderResult> {
  onProgress?.({ stage: 'decoding', message: 'Decoding audio file...', progress: 0 });

  // Decode the original audio file
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const originalSampleRate = audioBuffer.sampleRate;
  const originalDuration = audioBuffer.duration;
  const numChannels = audioBuffer.numberOfChannels;

  // Calculate the output duration based on speed
  // Speed < 1 means slower (longer), speed > 1 means faster (shorter)
  const outputDuration = originalDuration / speed;
  const outputSampleRate = originalSampleRate;
  const outputLength = Math.ceil(outputDuration * outputSampleRate);

  onProgress?.({ 
    stage: 'pitch-processing', 
    message: 'Applying pitch shift...', 
    progress: 20 
  });

  // Process audio with pitch shift using SoundTouch
  const pitchProcessedBuffer = await applyPitchShift(
    audioBuffer,
    pitch,
    audioContext,
    (p) => onProgress?.({
      stage: 'pitch-processing',
      message: `Processing channel ${Math.floor(p * 100)}%...`,
      progress: 20 + p * 40
    })
  );

  onProgress?.({ 
    stage: 'rendering', 
    message: 'Applying speed transformation...', 
    progress: 60 
  });

  // Apply speed transformation using OfflineAudioContext
  const offlineContext = new OfflineAudioContext(
    numChannels,
    outputLength,
    outputSampleRate
  );

  // Create a buffer source with the pitch-processed audio
  const source = offlineContext.createBufferSource();
  source.buffer = pitchProcessedBuffer;

  // Apply speed by adjusting playback rate
  source.playbackRate.value = speed;

  // Connect to destination
  source.connect(offlineContext.destination);

  // Start playback at time 0
  source.start(0);

  onProgress?.({ 
    stage: 'rendering', 
    message: 'Rendering offline audio...', 
    progress: 70 
  });

  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();

  onProgress?.({ 
    stage: 'encoding', 
    message: 'Encoding to WAV...', 
    progress: 90 
  });

  // Convert to WAV
  const wavBlob = audioBufferToWav(renderedBuffer);

  onProgress?.({ 
    stage: 'complete', 
    message: 'Export ready!', 
    progress: 100 
  });

  // Cleanup
  audioContext.close();

  return {
    blob: wavBlob,
    duration: renderedBuffer.duration
  };
}

/**
 * Apply pitch shift to an AudioBuffer using SoundTouch
 */
async function applyPitchShift(
  audioBuffer: AudioBuffer,
  semitones: number,
  audioContext: AudioContext,
  onProgress?: (progress: number) => void
): Promise<AudioBuffer> {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;

  // Calculate pitch ratio
  const pitchRatio = semitones === 0 ? 1 : Math.pow(2, semitones / 12);

  // If no pitch shift, return a copy of the original
  if (semitones === 0) {
    return audioBuffer;
  }

  const processedChannels: Float32Array[] = [];

  for (let channel = 0; channel < numChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const processedData = processChannelWithSoundTouch(
      sourceData,
      sampleRate,
      pitchRatio,
      onProgress ? (p) => onProgress(p) : undefined
    );
    processedChannels.push(processedData);
  }

  // Create output buffer
  const outputBuffer = audioContext.createBuffer(
    numChannels,
    processedChannels[0].length,
    sampleRate
  );

  for (let channel = 0; channel < numChannels; channel++) {
    outputBuffer.copyToChannel(new Float32Array(processedChannels[channel]), channel);
  }

  return outputBuffer;
}

/**
 * Process a single channel using SoundTouch
 */
function processChannelWithSoundTouch(
  sourceData: Float32Array,
  sampleRate: number,
  pitchRatio: number,
  onProgress?: (progress: number) => void
): Float32Array {
  const soundTouch = new SoundTouch(sampleRate);
  soundTouch.pitch = pitchRatio;
  soundTouch.rate = 1;
  soundTouch.tempo = 1;

  const estimatedOutputSize = Math.ceil(sourceData.length / pitchRatio) + 2048;
  const outputData = new Float32Array(estimatedOutputSize);

  const sampleBlockSize = 2048;
  let inputOffset = 0;
  let outputOffset = 0;

  while (inputOffset < sourceData.length) {
    const inputEnd = Math.min(inputOffset + sampleBlockSize, sourceData.length);
    const inputBlock = sourceData.slice(inputOffset, inputEnd);

    soundTouch.putSamples(inputBlock, 0, inputBlock.length);

    const remainingSlots = outputData.length - outputOffset;
    const outputView = outputData.subarray(outputOffset) as Float32Array;
    const received = soundTouch.receiveSamples(outputView, remainingSlots);

    outputOffset += received;
    inputOffset = inputEnd;

    onProgress?.(inputOffset / sourceData.length);
  }

  soundTouch.flush();
  const finalRemainingSlots = outputData.length - outputOffset;
  const finalOutputView = outputData.subarray(outputOffset) as Float32Array;
  const finalReceived = soundTouch.receiveSamples(finalOutputView, finalRemainingSlots);
  outputOffset += finalReceived;

  return outputData.subarray(0, outputOffset);
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
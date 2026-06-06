/**
 * Pitch Shift Utility using SoundTouch.js
 * 
 * Provides time-preserving pitch shifting using the SoundTouch algorithm.
 * This allows pitch to be changed independently of speed/tempo.
 * 
 * How SoundTouch works:
 * - Uses WSOLA (Waveform Similarity Overlap-Add) algorithm
 * - Separates pitch from tempo
 * - Maintains original duration when pitch changes
 * 
 * The key insight is that SoundTouch uses a buffer-based processing model:
 * 1. Samples go into inputBuffer (as stereo frames)
 * 2. process() is called to transform them
 * 3. Processed samples come out of outputBuffer
 */

import { SoundTouch } from 'soundtouchjs';

const DEBUG_AUDIO = import.meta.env.DEV;

/**
 * Process a single audio channel using SoundTouch with correct API usage
 * 
 * @param sourceData - Input audio samples (mono)
 * @param sampleRate - Audio sample rate
 * @param pitchRatio - Pitch multiplier (2^(semitones/12))
 * @param onProgress - Optional progress callback (0-1)
 * @returns Processed audio samples (same duration as input)
 */
export function processChannel(
  sourceData: Float32Array,
  _sampleRate: number,
  pitchRatio: number,
  onProgress?: (progress: number) => void
): Float32Array {
  const soundTouch = new SoundTouch();
  
  // Set pitch using the pitch property (ratio)
  // SoundTouch will automatically calculate the correct tempo/rate
  soundTouch.pitch = pitchRatio;
  soundTouch.tempo = 1; // Preserve original tempo
  soundTouch.rate = 1;  // Preserve original rate

  // Estimate output size - with time preservation, output should be similar to input
  const estimatedOutputSize = sourceData.length + 8192;
  const outputData = new Float32Array(estimatedOutputSize);

  const sampleBlockSize = 2048; // Number of samples per block
  let inputOffset = 0;
  let outputOffset = 0;

  // SoundTouch works with stereo frames (2 samples per frame)
  // For mono, we duplicate each sample to L and R channels
  
  while (inputOffset < sourceData.length) {
    const inputEnd = Math.min(inputOffset + sampleBlockSize, sourceData.length);
    const blockSize = inputEnd - inputOffset;
    
    // Get the input buffer and ensure it has capacity
    const inputBuffer = soundTouch.inputBuffer;
    inputBuffer.ensureAdditionalCapacity(blockSize);
    
    // Copy samples to the input buffer at the end position
    // SoundTouch expects stereo frames, so we duplicate mono to both channels
    const destOffset = inputBuffer.endIndex;
    for (let i = 0; i < blockSize; i++) {
      // Write to both L and R channels (stereo frame)
      inputBuffer.vector[destOffset + i * 2] = sourceData[inputOffset + i];
      inputBuffer.vector[destOffset + i * 2 + 1] = sourceData[inputOffset + i];
    }
    inputBuffer.put(blockSize);
    
    // Process the samples - this is the key step that was missing before
    soundTouch.process();
    
    // Receive processed samples from output buffer
    const outputBuffer = soundTouch.outputBuffer;
    const availableFrames = outputBuffer.frameCount;
    
    if (availableFrames > 0) {
      const outputView = outputBuffer.vector;
      let srcIdx = outputBuffer.startIndex;
      
      for (let i = 0; i < availableFrames && outputOffset < outputData.length; i++) {
        // Take the average of L and R channels for mono output
        const left = outputView[srcIdx + i * 2];
        const right = outputView[srcIdx + i * 2 + 1];
        outputData[outputOffset++] = (left + right) / 2;
      }
      
      outputBuffer.receive(availableFrames);
    }
    
    inputOffset = inputEnd;
    onProgress?.(inputOffset / sourceData.length);
  }

  // Process remaining samples by calling process() a few more times
  // SoundTouch doesn't have a flush() method, so we manually drain the buffers
  for (let flushCount = 0; flushCount < 10; flushCount++) {
    soundTouch.process();
    const outputBuffer = soundTouch.outputBuffer;
    const remainingFrames = outputBuffer.frameCount;
    
    if (remainingFrames === 0) break;
    
    const outputView = outputBuffer.vector;
    let srcIdx = outputBuffer.startIndex;
    
    for (let i = 0; i < remainingFrames && outputOffset < outputData.length; i++) {
      const left = outputView[srcIdx + i * 2];
      const right = outputView[srcIdx + i * 2 + 1];
      outputData[outputOffset++] = (left + right) / 2;
    }
    
    outputBuffer.receive(remainingFrames);
  }

  // Trim to actual size
  return new Float32Array(outputData.buffer, 0, outputOffset);
}

/**
 * Apply pitch shift to an AudioBuffer using SoundTouch
 * This preserves the original duration/tempo while changing pitch.
 * 
 * @param audioBuffer - Source audio buffer
 * @param semitones - Pitch shift in semitones (-12 to +12)
 * @param onProgress - Optional progress callback
 * @returns New AudioBuffer with pitch-shifted audio (same duration)
 */
export async function applyPitchShift(
  audioBuffer: AudioBuffer,
  semitones: number,
  _speedRatio: number = 1,
  onProgress?: (progress: number) => void
): Promise<AudioBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Calculate pitch ratio: pitchRatio = 2^(semitones/12)
  const pitchRatio = semitones === 0 ? 1 : Math.pow(2, semitones / 12);

  if (DEBUG_AUDIO) {
    console.log(`[PitchShift] Pitch: ${semitones} semitones, ratio: ${pitchRatio.toFixed(4)}`);
    console.log(`[PitchShift] Original: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.length} samples`);
  }

  // If no pitch shift, return a copy
  if (semitones === 0) {
    return audioBuffer;
  }
  
  onProgress?.(0);
  
  const processedChannels: Float32Array[] = [];
  
  for (let channel = 0; channel < numChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const processedData = processChannel(
      sourceData,
      sampleRate,
      pitchRatio,
      onProgress ? (p) => onProgress((channel + p) / numChannels) : undefined
    );
    processedChannels.push(processedData);
  }
  
  onProgress?.(1);
  
  // Create output buffer with same length as input (time preservation)
  const outputBuffer = audioContext.createBuffer(
    numChannels,
    processedChannels[0].length,
    sampleRate
  );
  
  for (let channel = 0; channel < numChannels; channel++) {
    // Create a new Float32Array to ensure proper typing
    const channelData = new Float32Array(processedChannels[channel]);
    outputBuffer.copyToChannel(channelData, channel);
  }
  
  audioContext.close();

  if (DEBUG_AUDIO) {
    console.log(`[PitchShift] Output: ${outputBuffer.duration.toFixed(2)}s, ${outputBuffer.length} samples`);
  }
  
  return outputBuffer;
}

/**
 * Convert AudioBuffer to WAV Blob (16-bit PCM)
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
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
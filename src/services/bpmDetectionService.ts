/**
 * BPM Detection Service
 * 
 * Analyzes audio files to detect tempo (BPM - Beats Per Minute).
 * Uses peak detection algorithm on the audio amplitude data.
 */

export interface BPMDetectionResult {
  bpm: number;
  confidence: number;
}

/**
 * Detect BPM from an audio file
 * 
 * @param file - Audio file to analyze
 * @returns Detected BPM (typically between 60-180)
 */
export async function detectBpm(file: File): Promise<number> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    // Decode audio file
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get mono mix of the audio
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Analyze the audio for BPM
    const bpm = analyzeTempo(channelData, sampleRate);
    
    return bpm;
  } finally {
    audioContext.close();
  }
}

/**
 * Analyze tempo from audio data using peak detection
 * 
 * Algorithm:
 * 1. Split audio into small chunks (bins)
 * 2. Calculate energy (RMS) for each chunk
 * 3. Find peaks (local maxima above threshold)
 * 4. Calculate intervals between peaks
 * 5. Find most common interval
 * 6. Convert to BPM
 */
function analyzeTempo(channelData: Float32Array, sampleRate: number): number {
  // Parameters
  const binSize = Math.floor(sampleRate * 0.01); // 10ms bins
  const minBpm = 60;
  const maxBpm = 200;
  
  // Calculate energy for each bin
  const numBins = Math.floor(channelData.length / binSize);
  const energy = new Float32Array(numBins);
  
  for (let i = 0; i < numBins; i++) {
    let sum = 0;
    const start = i * binSize;
    const end = Math.min(start + binSize, channelData.length);
    
    for (let j = start; j < end; j++) {
      sum += channelData[j] * channelData[j];
    }
    
    energy[i] = sum / (end - start);
  }
  
  // Normalize energy
  let maxEnergy = 0;
  for (let i = 0; i < numBins; i++) {
    if (energy[i] > maxEnergy) {
      maxEnergy = energy[i];
    }
  }
  
  if (maxEnergy === 0) return 120; // Default fallback
  
  for (let i = 0; i < numBins; i++) {
    energy[i] /= maxEnergy;
  }
  
  // Find peaks using adaptive threshold
  const threshold = 0.3; // Relative threshold
  const minPeakDistance = Math.floor((60 / maxBpm) / (binSize / sampleRate)); // Min distance between peaks
  const peaks: number[] = [];
  
  for (let i = 1; i < numBins - 1; i++) {
    if (energy[i] > threshold &&
        energy[i] > energy[i - 1] &&
        energy[i] > energy[i + 1]) {
      
      // Check minimum distance from previous peak
      if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minPeakDistance) {
        peaks.push(i);
      }
    }
  }
  
  if (peaks.length < 2) return 120; // Not enough peaks, return default
  
  // Calculate intervals between consecutive peaks
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  
  // Create histogram of intervals
  const intervalCounts = new Map<number, number>();
  const tolerance = Math.floor(minPeakDistance * 0.15); // 15% tolerance
  
  for (const interval of intervals) {
    // Round to nearest multiple for grouping
    const roundedInterval = Math.round(interval / tolerance) * tolerance;
    const count = intervalCounts.get(roundedInterval) || 0;
    intervalCounts.set(roundedInterval, count + 1);
  }
  
  // Find most common interval
  let mostCommonInterval = 0;
  let maxCount = 0;
  
  for (const [interval, count] of intervalCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonInterval = interval;
    }
  }
  
  // Convert interval to BPM
  const intervalSeconds = (mostCommonInterval * binSize) / sampleRate;
  let bpm = 60 / intervalSeconds;
  
  // Normalize BPM to musical range (60-200)
  while (bpm < minBpm) {
    bpm *= 2;
  }
  while (bpm > maxBpm) {
    bpm /= 2;
  }
  
  // Round to nearest whole number
  return Math.round(bpm);
}
/**
 * Audio Engine Test
 * 
 * Developer-only test to verify pitch shifting works correctly.
 * 
 * This test:
 * 1. Generates a 440 Hz sine wave for 3 seconds
 * 2. Applies pitch +12
 * 3. Analyzes the resulting frequency
 * 4. Confirms result is close to 880 Hz
 * 5. Applies pitch -12
 * 6. Confirms result is close to 220 Hz
 * 7. Confirms duration remains close to 3 seconds
 */

import { applyPitchShift } from '../utils/pitchShift';

/**
 * Generate a sine wave at a specific frequency
 */
function generateSineWave(frequency: number, duration: number, sampleRate: number): AudioBuffer {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const samples = Math.ceil(duration * sampleRate);
  const buffer = audioContext.createBuffer(1, samples, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < samples; i++) {
    data[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate));
  }
  
  return buffer;
}

/**
 * Analyze the dominant frequency of an audio buffer using zero-crossing method
 */
function analyzeFrequency(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  
  // Find zero crossings
  const crossings: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if ((data[i - 1] < 0 && data[i] >= 0) || (data[i - 1] >= 0 && data[i] < 0)) {
      crossings.push(i);
    }
  }
  
  // Calculate average period
  if (crossings.length < 2) return 0;
  
  let totalPeriod = 0;
  for (let i = 1; i < crossings.length; i++) {
    totalPeriod += crossings[i] - crossings[i - 1];
  }
  
  const avgPeriod = totalPeriod / (crossings.length - 1);
  const frequency = sampleRate / (avgPeriod * 2); // *2 because each crossing is half a cycle
  
  return frequency;
}

/**
 * Run the pitch shift validation test
 */
export async function runPitchShiftTest(): Promise<{
  passed: boolean;
  results: {
    originalFrequency: number;
    pitchPlus12Frequency: number;
    pitchMinus12Frequency: number;
    originalDuration: number;
    processedPlus12Duration: number;
    processedMinus12Duration: number;
  };
  errors: string[];
}> {
  const sampleRate = 44100;
  const duration = 3;
  const baseFrequency = 440; // A4
  
  console.log('=== Audio Engine Pitch Shift Test ===');
  console.log(`Generating ${duration}s sine wave at ${baseFrequency} Hz...`);
  
  // Generate original sine wave
  const originalBuffer = generateSineWave(baseFrequency, duration, sampleRate);
  const originalFrequency = analyzeFrequency(originalBuffer);
  const originalDuration = originalBuffer.duration;
  
  console.log(`Original frequency: ${originalFrequency.toFixed(1)} Hz`);
  console.log(`Original duration: ${originalDuration.toFixed(2)}s`);
  
  const errors: string[] = [];
  let pitchPlus12Frequency = 0;
  let pitchMinus12Frequency = 0;
  let processedPlus12Duration = 0;
  let processedMinus12Duration = 0;
  
  try {
    // Test pitch +12
    console.log('\n--- Testing Pitch +12 ---');
    const plus12Buffer = await applyPitchShift(originalBuffer, 12);
    pitchPlus12Frequency = analyzeFrequency(plus12Buffer);
    processedPlus12Duration = plus12Buffer.duration;
    
    console.log(`Pitch +12 frequency: ${pitchPlus12Frequency.toFixed(1)} Hz (expected: ~880 Hz)`);
    console.log(`Pitch +12 duration: ${processedPlus12Duration.toFixed(2)}s (expected: ~${duration}s)`);
    
    // Test pitch -12
    console.log('\n--- Testing Pitch -12 ---');
    const minus12Buffer = await applyPitchShift(originalBuffer, -12);
    pitchMinus12Frequency = analyzeFrequency(minus12Buffer);
    processedMinus12Duration = minus12Buffer.duration;
    
    console.log(`Pitch -12 frequency: ${pitchMinus12Frequency.toFixed(1)} Hz (expected: ~220 Hz)`);
    console.log(`Pitch -12 duration: ${processedMinus12Duration.toFixed(2)}s (expected: ~${duration}s)`);
    
    // Validate results
    const freqTolerance = 50; // Hz tolerance
    const durationTolerance = 0.5; // seconds tolerance
    
    // Check +12 results
    if (Math.abs(pitchPlus12Frequency - 880) > freqTolerance) {
      errors.push(`Pitch +12 frequency ${pitchPlus12Frequency.toFixed(1)} Hz is not close to 880 Hz`);
    }
    if (Math.abs(processedPlus12Duration - duration) > durationTolerance) {
      errors.push(`Pitch +12 duration ${processedPlus12Duration.toFixed(2)}s is not close to ${duration}s`);
    }
    
    // Check -12 results
    if (Math.abs(pitchMinus12Frequency - 220) > freqTolerance) {
      errors.push(`Pitch -12 frequency ${pitchMinus12Frequency.toFixed(1)} Hz is not close to 220 Hz`);
    }
    if (Math.abs(processedMinus12Duration - duration) > durationTolerance) {
      errors.push(`Pitch -12 duration ${processedMinus12Duration.toFixed(2)}s is not close to ${duration}s`);
    }
    
    // Check that frequencies are actually different from original
    if (Math.abs(pitchPlus12Frequency - originalFrequency) < freqTolerance) {
      errors.push(`Pitch +12 did not change frequency: ${pitchPlus12Frequency.toFixed(1)} Hz ≈ ${originalFrequency.toFixed(1)} Hz`);
    }
    if (Math.abs(pitchMinus12Frequency - originalFrequency) < freqTolerance) {
      errors.push(`Pitch -12 did not change frequency: ${pitchMinus12Frequency.toFixed(1)} Hz ≈ ${originalFrequency.toFixed(1)} Hz`);
    }
    
  } catch (error) {
    errors.push(`Error during processing: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const passed = errors.length === 0;
  
  console.log('\n=== Test Results ===');
  console.log(`Original frequency: ${originalFrequency.toFixed(1)} Hz`);
  console.log(`Pitch +12 frequency: ${pitchPlus12Frequency.toFixed(1)} Hz`);
  console.log(`Pitch -12 frequency: ${pitchMinus12Frequency.toFixed(1)} Hz`);
  console.log(`Original duration: ${originalDuration.toFixed(2)}s`);
  console.log(`Processed +12 duration: ${processedPlus12Duration.toFixed(2)}s`);
  console.log(`Processed -12 duration: ${processedMinus12Duration.toFixed(2)}s`);
  console.log(`\nStatus: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
  
  if (!passed) {
    console.log('\nErrors:');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }
  
  return {
    passed,
    results: {
      originalFrequency,
      pitchPlus12Frequency,
      pitchMinus12Frequency,
      originalDuration,
      processedPlus12Duration,
      processedMinus12Duration
    },
    errors
  };
}

/**
 * Run test and expose globally for browser console access
 */
if (typeof window !== 'undefined') {
  (window as any).testPitchShift = () => {
    console.log('Running pitch shift test...');
    runPitchShiftTest().then(result => {
      console.log('Test complete:', result);
      if (result.passed) {
        console.log('%c✓ PITCH SHIFT TEST PASSED', 'color: green; font-size: 16px; font-weight: bold;');
      } else {
        console.log('%c✗ PITCH SHIFT TEST FAILED', 'color: red; font-size: 16px; font-weight: bold;');
        console.log('Errors:', result.errors);
      }
    });
  };
  
  console.log('Pitch shift test available: call window.testPitchShift() in console');
}
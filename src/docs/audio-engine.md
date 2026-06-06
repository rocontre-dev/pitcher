# Audio Engine Documentation

## Overview

The Pitcher audio engine handles pitch shifting for audio files using the Web Audio API's OfflineAudioContext with resampling. This approach guarantees audible pitch changes and provides a solid foundation for the application.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Audio Upload                             │
│                             ↓                                    │
│                        Decode Audio                              │
│                             ↓                                    │
│              ┌──────────────────────────────┐                   │
│              │       Pitch Engine           │                   │
│              │  (OfflineAudioContext +      │                   │
│              │   playbackRate resampling)   │                   │
│              └──────────────────────────────┘                   │
│                             ↓                                    │
│              ┌──────────────────────────────┐                   │
│              │      WAV Encoding            │                   │
│              │    (16-bit PCM, 44.1kHz)     │                   │
│              └──────────────────────────────┘                   │
│                             ↓                                    │
│              ┌──────────────────────────────┐                   │
│              │      Blob URL Creation       │                   │
│              └──────────────────────────────┘                   │
│                             ↓                                    │
│              ┌──────────────────────────────┐                   │
│              │     Preview Playback         │                   │
│              │    (WaveSurfer.js)           │                   │
│              └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘

Export Flow:
┌─────────────────────────────────────────────────────────────────┐
│              ┌──────────────────────────────┐                   │
│              │     Pitch Engine             │                   │
│              └──────────────────────────────┘                   │
│                             ↓                                    │
│              ┌──────────────────────────────┐                   │
│              │   Export Renderer            │                   │
│              │  (OfflineAudioContext +      │                   │
│              │   speed adjustment)          │                   │
│              └──────────────────────────────┘                   │
│                             ↓                                    │
│              ┌──────────────────────────────┐                   │
│              │      WAV Download            │                   │
│              └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Preview Flow
1. **Upload** → User selects audio file
2. **Decode** → File decoded to AudioBuffer via AudioContext
3. **Pitch Shift** → OfflineAudioContext renders with adjusted playbackRate
4. **Encode** → Rendered buffer converted to WAV Blob
5. **URL** → Blob URL created and stored in Zustand
6. **Playback** → WaveSurfer loads the processed Blob URL

### Export Flow
1. **Pitch Shift** → Same pitch engine as preview
2. **Speed Adjust** → Additional OfflineAudioContext renders with speed adjustment
3. **Encode** → Final buffer converted to WAV Blob
4. **Download** → Blob downloaded as file

## Pitch Shifting Algorithm

### How It Works

The pitch shifting uses **resampling via playback rate adjustment**:

```typescript
// Calculate pitch ratio from semitones
const pitchRatio = Math.pow(2, semitones / 12);

// Create OfflineAudioContext with adjusted length
const outputDuration = originalDuration / pitchRatio;
const outputLength = Math.ceil(outputDuration * sampleRate);

// Render with adjusted playback rate
source.playbackRate.value = pitchRatio;
```

### Examples

| Semitones | Pitch Ratio | Effect | Duration Change |
|-----------|-------------|--------|-----------------|
| +12 | 2.0 | One octave higher | 50% shorter |
| +6 | 1.414 | Perfect fourth higher | ~71% duration |
| 0 | 1.0 | No change | No change |
| -6 | 0.707 | Perfect fourth lower | ~141% duration |
| -12 | 0.5 | One octave lower | 200% longer |

## Why Resampling Was Chosen

1. **Reliability**: Guaranteed to produce audible pitch changes
2. **Simplicity**: Uses native Web Audio API, no external dependencies
3. **Performance**: Fast rendering with OfflineAudioContext
4. **Consistency**: Same algorithm for preview and export
5. **Browser Support**: Works in all modern browsers

## Current Limitations

1. **Duration Changes**: Pitch up = shorter, pitch down = longer
   - This is the expected behavior for simple resampling
   - Professional tools use time-stretching to preserve duration

2. **No Time Preservation**: Unlike professional pitch shifters (e.g., SoundTouch, Rubber Band), this implementation does not preserve the original duration.

3. **Quality**: Resampling quality depends on the browser's audio rendering engine.

## Future Upgrade Path

When time-preserving pitch shifting is needed, consider:

1. **SoundTouch.js**: C++ SoundTouch ported to JavaScript
   - Pros: High quality, time-preserving
   - Cons: Complex API, larger bundle size

2. **Rubber Band Library**: Professional-grade audio processing
   - Pros: Best-in-class quality
   - Cons: WASM complexity, larger bundle

3. **Custom WSOLA Implementation**: Windowed Synchronous Overlap-Add
   - Pros: Good quality, controllable
   - Cons: Complex implementation

## File Structure

```
src/
├── utils/
│   └── pitchShift.ts      # Core pitch shifting logic
├── services/
│   ├── audioProcessingService.ts  # Preview processing
│   └── offlineRenderService.ts    # Export rendering
├── store/
│   └── audioStore.ts      # Zustand state management
├── hooks/
│   └── usePitchProcessor.ts  # React hook for processing
└── docs/
    └── audio-engine.md    # This documentation
```

## API Reference

### applyPitchShift(audioBuffer, semitones, speedRatio, onProgress)

Applies pitch shift to an AudioBuffer.

**Parameters:**
- `audioBuffer`: AudioBuffer - Source audio
- `semitones`: number - Pitch shift in semitones (-12 to +12)
- `speedRatio`: number - Speed multiplier (currently unused)
- `onProgress`: (progress: number) => void - Progress callback

**Returns:** Promise<AudioBuffer> - Pitch-shifted audio

### audioBufferToWav(buffer)

Converts an AudioBuffer to a WAV Blob.

**Parameters:**
- `buffer`: AudioBuffer - Source audio

**Returns:** Blob - WAV file (16-bit PCM)

## Debug Logging

Debug logs are only shown in development mode (`import.meta.env.DEV`).

Logs include:
- Pitch ratio calculation
- Original and output durations
- Sample counts

## Testing

### Manual Test Cases

1. **Pitch 0**: Audio sounds original
2. **Pitch +12**: One octave higher, 50% shorter
3. **Pitch -12**: One octave lower, 200% longer
4. **Export +12**: Downloaded WAV sounds one octave higher
5. **Speed 0.5**: Half speed playback
6. **Speed 2.0**: Double speed playback

### Verification

- Preview and export use identical pitch engine
- No runtime errors in console
- Waveform displays correctly
- Export downloads successfully
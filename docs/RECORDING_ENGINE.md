# Capture Studio - Recording Engine Architecture

## Overview

The recording engine provides studio-quality recording on both Web and Android through platform-specific services.

---

## 1. Web Recording Engine (`src/services/web/`)

### Architecture Pipeline

```
[Screen Stream: getDisplayMedia] ──┐
                                   ├──> [Canvas 2D Compositor] ──> [canvas.captureStream()] ──┐
[Camera Stream: getUserMedia]    ──┘           (Picture-in-picture bubble)                    │
                                                                                              ├──> [MediaRecorder] ──> [Blob] ──> [IndexedDB]
[Mic Stream: getUserMedia]       ──┐                                                          │
                                   ├──> [Web Audio API: DestinationStream] ───────────────────┘
[System Audio Stream]            ──┘           (Audio Mixing Pipeline)
```

### Key Modules:
- **`webScreenCapture.ts`**: Handles display capture with automatic detection of user cancellation (native browser "Stop Sharing" button).
- **`webCameraCapture.ts`**: Acquires webcam video, handles device mirroring and resolution constraints.
- **`webAudioCapture.ts`**: Connects to the Web Audio API to mix multiple audio sources (microphone + system tab audio) into a unified audio destination. Also powers the real-time volume level meter.
- **`webRecordingEngine.ts`**: Runs the 60fps canvas compositor loop, clips the camera into circular/rounded shapes, draws the green `#00E632` stroke border, and manages MediaRecorder chunks.
- **`webVideoExport.ts`**: Client-side video editor engine using canvas rendering to execute trims, crops, text overlays, and rotation without server processing.

---

## 2. Android Native Recording Engine (`android/`)

### Architecture Pipeline

```
[MediaProjection] ──> [VirtualDisplay] ──┐
                                         ├──> [Surface / MediaRecorder / MediaCodec] ──> [.mp4 file]
[CameraX / Camera2] ─────────────────────┘
[AudioRecord / PlaybackCapture] ─────────┘
```

### MediaProjection Guidelines (Android 14+):
1. **Consent Per Session**: System prompt is launched each time recording begins; projection tokens are never cached or reused.
2. **Foreground Service Types**: `mediaProjection|microphone|camera` must be passed when `startForeground()` is invoked.
3. **Floating Overlay**: Uses `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` for cross-application floating controls with zero WebView dependency.


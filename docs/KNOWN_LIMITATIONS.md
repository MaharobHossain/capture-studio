# Capture Studio - Known Platform Limitations

## 1. Mobile Web Browsers (Chrome / Safari on Mobile)
- **Screen Recording**: Mobile operating systems (iOS and Android) deliberately disallow `navigator.mediaDevices.getDisplayMedia()` in mobile web browsers for security and sandboxing reasons.
- **Solution / Fallback**: Capture Studio provides native camera recording on mobile web and prompts users to run the native Android app for full-device screen recording.

---

## 2. Browser Audio Capture
- **System Audio**: Capturing desktop system/computer audio through the browser is subject to OS and browser permissions. In Chrome on Windows/macOS, the user must explicitly check "Share audio" in the screen-sharing prompt.
- **Safari**: Safari on macOS currently has limited support for capturing system audio via `getDisplayMedia`.

---

## 3. Direct Browser MP4 Encoding
- While some browsers support native `video/mp4` recording in `MediaRecorder`, many Chromium-based browsers only support `video/webm` out of the box.
- Capture Studio detects codec compatibility automatically: if direct MP4 recording is unsupported, WebM is selected, and videos can be rendered or converted to MP4 via the built-in Video Editor.

---

## 4. Android Internal Audio Playback Capture
- On Android 10+ (API 29+), `AudioPlaybackCaptureConfiguration` allows recording internal audio from apps that explicitly permit it (`android:allowAudioPlaybackCapture="true"`). Apps that disable audio playback capture (e.g. DRM-protected media or specific banking apps) cannot have their internal sound captured by third-party recording services.

# Capture Studio - Android Native Setup Guide

## Requirements
- Android Studio Hedgehog (2023.1.1) or newer
- Android SDK 34 (Android 14)
- JDK 17 (recommended for Gradle 8.2+)

## Project Structure & Plugin Configuration

The Android platform is located under the `android/` directory and managed via Capacitor.
The custom recording engine plugin is registered as `CaptureStudio` under package `com.capturestudio.app`.

### Key Native Classes

| Class | Responsibility |
|---|---|
| `CaptureStudioPlugin.kt` | Capacitor plugin interface exposing methods and events to React |
| `ScreenRecordingService.kt` | Android Foreground Service for screen, audio, and camera recording |
| `MediaProjectionManagerHelper.kt` | Manages `MediaProjection` token consent and Android 14+ callbacks |
| `AudioCaptureManager.kt` | Manages microphone and system playback capture |
| `CameraCaptureManager.kt` | CameraX integration for front/rear camera feeds |
| `FloatingControllerService.kt` | `SYSTEM_ALERT_WINDOW` draggable floating pill overlay |
| `VideoExportManager.kt` | Android Jetpack Media3 Transformer for video editing and export |
| `RecordingNotificationManager.kt` | Manages low-priority ongoing recording notification |

---

## Required Permissions (AndroidManifest.xml)

On Android 14 (API 34), foreground services that record screens, cameras, or audio must declare specific types:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

And the service tag:
```xml
<service
    android:name=".ScreenRecordingService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="mediaProjection|microphone|camera" />
```

---

## Building and Running in Android Studio

1. **Build web assets & sync:**
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

3. **Build APK / AAB:**
   - In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**
   - Alternatively via terminal:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```

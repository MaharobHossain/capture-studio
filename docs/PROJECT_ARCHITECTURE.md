# Capture Studio - Project Architecture

## High-Level Architecture Overview

Capture Studio utilizes a dual-engine architecture:
1. **Web Engine**: Built using modern browser standards (WebRTC `getDisplayMedia`, `getUserMedia`, Canvas 2D API for compositing, Web Audio API for mixing, and `MediaRecorder` API).
2. **Native Android Engine**: Built with a custom Capacitor Kotlin plugin executing within an Android 14+ Foreground Service using `MediaProjection`, `CameraX`, and `Media3 Transformer`.

A unified recording adapter (`src/services/recordingService.ts`) detects the execution environment and transparently delegates calls to the appropriate engine.

---

## Directory Structure

```
CAPTURE STUDIO/
├── android/                         # Native Android Studio Project
│   └── app/src/main/
│       ├── AndroidManifest.xml      # Foreground service & projection permissions
│       └── java/com/capturestudio/app/
│           ├── CaptureStudioPlugin.kt            # Capacitor plugin bridge
│           ├── ScreenRecordingService.kt         # Foreground recording service
│           ├── MediaProjectionManagerHelper.kt   # System screen-capture token helper
│           ├── CameraCaptureManager.kt           # CameraX lifecycle manager
│           ├── AudioCaptureManager.kt            # Playback/mic capture
│           ├── FloatingControllerService.kt      # Draggable overlay pill
│           ├── VideoCompositionEngine.kt         # Compositing layout engine
│           ├── VideoExportManager.kt             # Jetpack Media3 Transformer
│           ├── RecordingNotificationManager.kt   # Notification channel & intents
│           └── MainActivity.java                 # Plugin registration
├── docs/                            # In-depth technical guides
├── public/                          # Static branding & PWA assets
├── src/
│   ├── components/
│   │   ├── common/                  # Reusable UI (Button, Card, Modal, Badge)
│   │   ├── layout/                  # Navbar, BottomNav, Footer
│   │   ├── studio/                  # SourceSelector, AudioControls, CameraControls, QualityControls, FloatingRecorder
│   │   └── videos/                  # VideoCard
│   ├── pages/
│   │   ├── StudioPage.tsx           # Main recording dashboard (/)
│   │   ├── VideosPage.tsx           # Offline video library (/videos)
│   │   ├── EditorPage.tsx           # Timeline video editor (/editor/:videoId)
│   │   ├── SettingsPage.tsx         # User preferences & storage (/settings)
│   │   ├── HowItWorksPage.tsx       # User guide (/how-it-works)
│   │   ├── auth/                    # Login, Register, Forgot Password
│   │   ├── PrivacyPage.tsx          # Privacy policy
│   │   └── TermsPage.tsx            # Terms of service
│   ├── services/
│   │   ├── native/                  # Capacitor plugin TS definitions
│   │   ├── storage/                 # Dexie IndexedDB manager & thumbnail generator
│   │   ├── supabase/                # Supabase client & storage uploader
│   │   ├── web/                     # Web recording & export engine
│   │   └── recordingService.ts      # Unified Web/Native platform adapter
│   ├── store/                       # Zustand stores (useRecordingStore, useAuthStore, useSettingsStore)
│   ├── types/                       # TypeScript interfaces & types
│   ├── App.tsx                      # Routes & layout shell
│   ├── index.css                    # Tailwind directives & dark theme styles
│   └── main.tsx                     # React application entry point
├── supabase/migrations/             # SQL database schema & RLS policies
├── capacitor.config.ts              # Capacitor runtime configuration
├── tailwind.config.js               # Brand color system & theme tokens
├── vite.config.ts                   # Vite bundler, PWA, Vitest config
└── vercel.json                      # Vercel deployment configuration
```

---

## State Management Flow

1. **Recording Configuration**: Stored in `useRecordingStore` with reactive updates across `SourceSelector`, `AudioControls`, `CameraControls`, and `QualityControls`.
2. **Platform Delegation**: When the user presses "Start Recording", `recordingService` delegates to either `WebRecordingEngine` or `CaptureStudio` native plugin.
3. **Storage Pipeline**: Finished recordings generate a blob/file reference, pass through `generateThumbnailFromBlob()`, and persist into IndexedDB via Dexie.
4. **Editor Pipeline**: Modifying trims, crops, rotations, speed, or text invokes `WebVideoExport` (on web) or `VideoExportManager` (on Android), producing an edited video file while preserving the original.

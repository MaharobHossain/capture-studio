# Capture Studio

> **Record. Edit. Create.**
> Professional Screen Recording, Video Editing & Capture Platform.

Capture Studio is a production-oriented recording platform built for high-performance desktop web, responsive mobile browsers, progressive web apps (PWA), and native Android.

---

## 🌟 Key Features

- **Guest Mode First**: Record, edit, export, and download videos immediately without creating an account or logging in.
- **Recording Sources**:
  - **Screen Only**: Capture whole desktop monitors, application windows, or browser tabs.
  - **Screen + Camera**: Real-time canvas compositing with draggable, resizable, circular or rounded webcam picture-in-picture bubbles with customizable green accents (`#00E632`).
  - **Camera Only**: Clean webcam and front/back mobile camera recording.
- **Studio Audio Mixer**:
  - Voice narration with real-time volume level meter and test tool.
  - Internal system and tab audio capture where supported.
- **Native Android Recording Engine**:
  - Kotlin Capacitor Plugin (`com.capturestudio.app`)
  - Android 14+ `MediaProjection` Foreground Service (`mediaProjection|microphone|camera`)
  - Draggable `SYSTEM_ALERT_WINDOW` floating recording controller with timer, pause, resume, and stop buttons.
  - CameraX integration and Android Jetpack Media3 Transformer.
- **Client-Side Video Editor**:
  - Real-time video preview and scrubber.
  - Trim start and trim end points.
  - Aspect ratio cropping (16:9 widescreen, 9:16 vertical short/TikTok, 1:1 square, 4:3).
  - Rotation (90°, 180°, 270°).
  - Volume scaling and mute toggle.
  - Custom text overlays with color picking.
  - Real progress reporting and cancellation.
- **Video Management**:
  - Stored offline in IndexedDB.
  - Search, sort by date/size/duration/title, inline rename, play preview, download, share, and delete.
- **Optional Supabase Cloud Sync**:
  - Upgrade guest accounts anytime.
  - Row Level Security (RLS) policies protecting user data and private storage buckets.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation

```bash
# Clone or navigate to the project directory
cd "CAPTURE STUDIO"

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Testing & Production Build

```bash
# Run Vitest test suite
npm test

# Build production web assets and PWA
npm run build

# Synchronize with Android platform
npx cap sync android
```

---

## 📱 Android Development

```bash
# Open native Android Studio project
npx cap open android
```

For detailed Android setup, permissions, and MediaProjection configuration, refer to [docs/ANDROID_SETUP.md](docs/ANDROID_SETUP.md).

---

## 📚 Complete Documentation

1. [Project Architecture](docs/PROJECT_ARCHITECTURE.md)
2. [Setup Guide](docs/SETUP_GUIDE.md)
3. [Android Native Setup](docs/ANDROID_SETUP.md)
4. [Recording Engine Architecture](docs/RECORDING_ENGINE.md)
5. [Supabase Setup & RLS](docs/SUPABASE_SETUP.md)
6. [Database Schema](docs/DATABASE_SCHEMA.md)
7. [Deployment Guide (Vercel & Android)](docs/DEPLOYMENT.md)
8. [Testing Guide](docs/TESTING.md)
9. [Known Platform Limitations](docs/KNOWN_LIMITATIONS.md)

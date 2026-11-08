# Capture Studio - Testing & Verification Guide

## Automated Testing Suite

The project includes unit and integration tests powered by Vitest, `@testing-library/react`, and `fake-indexeddb`.

### Running Tests

```bash
# Run all automated tests
npm test

# Run tests with watch mode
npm run test:watch
```

---

## Test Suites Overview

1. **`src/test/storage.test.ts`**:
   - Saving guest recordings without login.
   - Retrieving videos sorted by timestamp.
   - Renaming video records.
   - Deleting videos permanently.
   - Storage usage quota calculations.

2. **`src/test/recordingEngine.test.ts`**:
   - Format detection and WebM fallback.
   - Screen recording browser capability detection.
   - Audio mixing and track lifecycle cleanup.
   - Camera device enumeration.

3. **`src/test/authGuestMode.test.ts`**:
   - Verifying guest mode is active by default.
   - Testing fallback when Supabase is not configured.
   - Explicit "continue as guest" actions.

4. **`src/test/uiRoutes.test.tsx`**:
   - Navigation rendering and brand elements.
   - How It Works guide page.
   - Privacy Policy and Terms of Service pages.

---

## Manual Testing Checklist for Physical Android Devices

- [ ] Grant microphone and camera runtime permissions when prompted.
- [ ] Confirm Android MediaProjection system consent popup displays properly.
- [ ] Verify ongoing notification appears in the notification drawer with "Pause" and "Stop" actions.
- [ ] Confirm the floating controller widget (`FloatingControllerService`) appears over other apps when overlay permission is granted.
- [ ] Drag floating controller across the screen to confirm touch coordinates update smoothly.
- [ ] Stop recording and verify video appears in Saved Videos with valid duration and thumbnail.
- [ ] Test video playback and download.
- [ ] Test video trimming and rotation in the Video Editor.

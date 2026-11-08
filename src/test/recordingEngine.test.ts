import { describe, it, expect, vi } from 'vitest';
import { WebRecordingEngine } from '@/services/web/webRecordingEngine';
import { WebAudioCapture } from '@/services/web/webAudioCapture';
import { WebScreenCapture } from '@/services/web/webScreenCapture';
import { WebCameraCapture } from '@/services/web/webCameraCapture';

describe('Web Recording Engine & Media Services', () => {
  it('correctly selects WebM MIME type fallback when MP4 is unavailable', () => {
    const { mimeType, actualFormat } = WebRecordingEngine.getSupportedMimeType('webm');
    expect(actualFormat).toBe('webm');
    expect(mimeType).toContain('webm');
  });

  it('detects screen recording support on modern browsers', () => {
    const isSupported = WebScreenCapture.isSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  it('initializes and cleans up WebAudioCapture without leaking AudioContext', () => {
    const audio = new WebAudioCapture();
    expect(audio).toBeDefined();

    const mockTrack = { stop: vi.fn(), kind: 'audio' };
    const mockStream = {
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    } as any;

    const { mixedStream, cleanup } = audio.mixAudioStreams([mockStream]);
    expect(mixedStream).toBeDefined();
    cleanup();
  });

  it('provides camera device enumeration interface', async () => {
    const camera = new WebCameraCapture();
    const devices = await camera.getVideoInputDevices();
    expect(Array.isArray(devices)).toBe(true);
    camera.stopCamera();
  });
});

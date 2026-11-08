import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Polyfills and mocks for Web Media APIs in JSDOM environment
if (typeof window !== 'undefined') {
  // Mock HTMLMediaElement play/pause
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};

  // Mock URL.createObjectURL / revokeObjectURL
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'blob:mock-url-' + Math.random().toString(36).substring(7);
    window.URL.revokeObjectURL = () => {};
  }

  // Mock MediaRecorder if undefined
  if (typeof (window as any).MediaRecorder === 'undefined') {
    class MockMediaRecorder {
      state: 'inactive' | 'recording' | 'paused' = 'inactive';
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      static isTypeSupported(type: string) {
        return type.includes('webm');
      }
      start() {
        this.state = 'recording';
      }
      pause() {
        this.state = 'paused';
      }
      resume() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'stopped';
        if (this.onstop) this.onstop();
      }
    }
    (window as any).MediaRecorder = MockMediaRecorder;
  }

  // Mock MediaDevices
  if (!navigator.mediaDevices) {
    (navigator as any).mediaDevices = {
      getUserMedia: () => Promise.resolve({
        getTracks: () => [{ stop: () => {}, kind: 'video' }, { stop: () => {}, kind: 'audio' }],
      }),
      getDisplayMedia: () => Promise.resolve({
        getTracks: () => [{ stop: () => {}, kind: 'video' }],
      }),
      enumerateDevices: () => Promise.resolve([
        { deviceId: 'default', kind: 'audioinput', label: 'Default Microphone' },
        { deviceId: 'default', kind: 'videoinput', label: 'Default Camera' },
      ]),
    };
  }
}

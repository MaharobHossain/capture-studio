/**
 * Screen Capture Service for Web
 * Manages getDisplayMedia, system audio extraction, and screen track lifecycle
 */
import { ResolutionPreset, RESOLUTION_MAP } from '@/types';

export class WebScreenCapture {
  private screenStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onUserStoppedCallback: (() => void) | null = null;

  /**
   * Check if screen capture is supported on current browser
   */
  static isSupported(): boolean {
    return Boolean(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === 'function'
    );
  }

  /**
   * Acquire screen capture stream with optional system audio and resolution preset
   */
  async getScreenStream(
    includeSystemAudio: boolean = true,
    resolution: ResolutionPreset = '1080p',
    frameRate: number = 30,
    onUserStopped?: () => void
  ): Promise<MediaStream> {
    this.stopScreen();
    this.onUserStoppedCallback = onUserStopped || null;

    if (!WebScreenCapture.isSupported()) {
      throw new Error(
        'Screen recording is not supported in this browser. Please use a modern desktop browser (Chrome, Edge, Firefox, Safari 13+) or the Capture Studio Android native app.'
      );
    }

    const targetRes = RESOLUTION_MAP[resolution] || RESOLUTION_MAP['1080p'];

    const displayMediaOptions: DisplayMediaStreamOptions = {
      video: {
        width: { ideal: targetRes.width, max: targetRes.width },
        height: { ideal: targetRes.height, max: targetRes.height },
        frameRate: { ideal: frameRate },
        // @ts-ignore - cursor is a valid displayMedia constraint
        cursor: 'always',
      },
      audio: includeSystemAudio
        ? {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        : false,
    };

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia(
        displayMediaOptions
      );

      // Listen for the native "Stop Sharing" button in Chrome / browser UI
      const videoTrack = this.screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (this.onUserStoppedCallback) {
            this.onUserStoppedCallback();
          }
        };
      }

      return this.screenStream;
    } catch (err: any) {
      console.error('Failed to get screen stream:', err);
      if (err.name === 'NotAllowedError') {
        throw new Error('Screen capture was cancelled or permission was denied.');
      }
      throw new Error(`Screen capture failed: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Creates or attaches an invisible HTMLVideoElement to read frames for canvas compositing
   */
  attachToVideoElement(stream: MediaStream): HTMLVideoElement {
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      this.videoElement.setAttribute('autoplay', '');
      this.videoElement.style.position = 'fixed';
      this.videoElement.style.top = '-9999px';
      this.videoElement.style.left = '-9999px';
      this.videoElement.style.width = '1px';
      this.videoElement.style.height = '1px';
      document.body.appendChild(this.videoElement);
    }

    this.videoElement.srcObject = stream;
    this.videoElement.play().catch(() => {});
    return this.videoElement;
  }

  /**
   * Stop all screen tracks and cleanup
   */
  stopScreen(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }
    this.onUserStoppedCallback = null;
  }
}

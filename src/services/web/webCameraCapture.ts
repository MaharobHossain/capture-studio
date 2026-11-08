/**
 * Camera Capture Service for Web
 * Manages webcam streams, device enumeration, mirroring, and lifecycle
 */
import { ResolutionPreset, RESOLUTION_MAP } from '@/types';

export class WebCameraCapture {
  private cameraStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * Acquire webcam stream with specified deviceId and resolution preset
   */
  async getCameraStream(
    deviceId?: string,
    resolution: ResolutionPreset = '720p',
    frameRate: number = 30
  ): Promise<MediaStream> {
    this.stopCamera();

    const targetRes = RESOLUTION_MAP[resolution] || RESOLUTION_MAP['720p'];

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: targetRes.width },
        height: { ideal: targetRes.height },
        frameRate: { ideal: frameRate },
      },
      audio: false,
    };

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.cameraStream;
    } catch (err: any) {
      console.error('Failed to acquire camera stream:', err);
      throw new Error(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : `Camera error: ${err.message || 'Camera device not accessible'}`
      );
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
   * Enumerate available video input devices
   */
  async getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  /**
   * Stop all camera tracks and remove video element
   */
  stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }
  }
}


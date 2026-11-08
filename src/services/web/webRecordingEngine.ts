/**
 * Web Recording Engine
 * Real-time screen + camera compositing, multi-track audio mixing, and MediaRecorder controller
 */
import {
  RecordingConfig,
  RecordingStatus,
  RESOLUTION_MAP,
  VideoFormat,
  VideoRecord,
} from '@/types';
import { WebScreenCapture } from './webScreenCapture';
import { WebCameraCapture } from './webCameraCapture';
import { WebAudioCapture } from './webAudioCapture';
import { saveRecordingToDB } from '../storage/db';

export interface RecordingEngineCallbacks {
  onStatusChange: (status: RecordingStatus) => void;
  onTimeUpdate: (seconds: number) => void;
  onVolumeUpdate?: (volume: number) => void;
  onError: (error: string) => void;
}

export class WebRecordingEngine {
  private screenCapture = new WebScreenCapture();
  private cameraCapture = new WebCameraCapture();
  private audioCapture = new WebAudioCapture();

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private status: RecordingStatus = 'idle';

  // Streams & Elements
  private activeScreenStream: MediaStream | null = null;
  private activeCameraStream: MediaStream | null = null;
  private activeMicStream: MediaStream | null = null;
  private canvasStream: MediaStream | null = null;

  private screenVideoElem: HTMLVideoElement | null = null;
  private cameraVideoElem: HTMLVideoElement | null = null;
  private compositorCanvas: HTMLCanvasElement | null = null;
  private compositorCtx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private audioCleanup: (() => void) | null = null;

  // Timing
  private timerInterval: any = null;
  private secondsElapsed: number = 0;
  private isPaused: boolean = false;
  private startTime: number = 0;

  // Configuration
  private currentConfig: RecordingConfig | null = null;
  private callbacks: RecordingEngineCallbacks;

  constructor(callbacks: RecordingEngineCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Determine best supported MIME type for the requested format
   */
  static getSupportedMimeType(requestedFormat: VideoFormat): {
    mimeType: string;
    actualFormat: VideoFormat;
  } {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return { mimeType: 'video/webm', actualFormat: 'webm' };
    }

    if (requestedFormat === 'mp4') {
      const mp4Types = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1,opus',
        'video/mp4',
      ];
      for (const t of mp4Types) {
        if (MediaRecorder.isTypeSupported(t)) {
          return { mimeType: t, actualFormat: 'mp4' };
        }
      }
    }

    // Default or fallback to WebM
    const webmTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
    ];

    for (const t of webmTypes) {
      if (MediaRecorder.isTypeSupported(t)) {
        return { mimeType: t, actualFormat: 'webm' };
      }
    }

    return { mimeType: '', actualFormat: 'webm' };
  }

  /**
   * Check if MP4 recording is directly supported by this browser
   */
  static isMp4Supported(): boolean {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
    return (
      MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2') ||
      MediaRecorder.isTypeSupported('video/mp4')
    );
  }

  /**
   * Start recording session based on configuration
   */
  async startRecording(config: RecordingConfig): Promise<void> {
    if (this.status === 'recording' || this.status === 'preparing') return;

    this.setStatus('preparing');
    this.currentConfig = config;
    this.recordedChunks = [];
    this.secondsElapsed = 0;
    this.callbacks.onTimeUpdate(0);

    try {
      const streamsToMixAudio: MediaStream[] = [];
      let finalVideoStream: MediaStream;

      const targetRes = RESOLUTION_MAP[config.resolution] || RESOLUTION_MAP['1080p'];

      // 1. Acquire Screen Stream if needed
      if (config.sourceMode === 'screen' || config.sourceMode === 'screen-camera') {
        this.activeScreenStream = await this.screenCapture.getScreenStream(
          config.audio.systemAudioEnabled,
          config.resolution,
          config.frameRate,
          () => {
            // Screen sharing was stopped by browser native banner
            this.stopRecording();
          }
        );

        // Extract system audio if present
        if (
          config.audio.systemAudioEnabled &&
          this.activeScreenStream.getAudioTracks().length > 0
        ) {
          const sysAudioStream = new MediaStream(
            this.activeScreenStream.getAudioTracks()
          );
          streamsToMixAudio.push(sysAudioStream);
        }
      }

      // 2. Acquire Camera Stream if needed
      if (
        config.sourceMode === 'camera' ||
        (config.sourceMode === 'screen-camera' && config.camera.enabled)
      ) {
        this.activeCameraStream = await this.cameraCapture.getCameraStream(
          config.camera.deviceId || undefined,
          config.camera.resolution,
          config.frameRate
        );
      }

      // 3. Acquire Microphone Stream if enabled
      if (config.audio.micEnabled) {
        this.activeMicStream = await this.audioCapture.getMicrophoneStream(
          config.audio.micDeviceId || undefined
        );
        streamsToMixAudio.push(this.activeMicStream);

        // Setup audio meter callback
        if (this.callbacks.onVolumeUpdate) {
          this.audioCapture.startAudioMeter(
            this.activeMicStream,
            this.callbacks.onVolumeUpdate
          );
        }
      }

      // 4. Construct Video Track based on Source Mode
      if (config.sourceMode === 'screen-camera' && this.activeScreenStream && this.activeCameraStream) {
        // Compositing Screen + Webcam via Canvas
        finalVideoStream = this.setupCanvasCompositor(
          this.activeScreenStream,
          this.activeCameraStream,
          targetRes.width,
          targetRes.height,
          config
        );
      } else if (config.sourceMode === 'camera' && this.activeCameraStream) {
        // Camera only
        finalVideoStream = this.activeCameraStream;
      } else if (this.activeScreenStream) {
        // Screen only
        finalVideoStream = new MediaStream(this.activeScreenStream.getVideoTracks());
      } else {
        throw new Error('No valid video stream was initialized.');
      }

      // 5. Mix all audio streams
      const { mixedStream, cleanup } = this.audioCapture.mixAudioStreams(streamsToMixAudio);
      this.audioCleanup = cleanup;

      // 6. Combine video and mixed audio into a unified recording stream
      const finalRecordingStream = new MediaStream();
      finalVideoStream.getVideoTracks().forEach((track) => finalRecordingStream.addTrack(track));
      mixedStream.getAudioTracks().forEach((track) => finalRecordingStream.addTrack(track));

      // 7. Initialize MediaRecorder
      const { mimeType } = WebRecordingEngine.getSupportedMimeType(config.format);
      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: this.getVideoBitrate(config.resolution),
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      this.mediaRecorder = new MediaRecorder(finalRecordingStream, recorderOptions);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        this.callbacks.onError('Recording encountered an error: ' + (event.error?.message || 'MediaRecorder failed'));
      };

      // Request data in 1-second chunks for safety against memory spikes
      this.mediaRecorder.start(1000);
      this.startTime = Date.now();
      this.startTimer();
      this.setStatus('recording');
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      this.cleanup();
      this.setStatus('idle');
      this.callbacks.onError(err.message || 'Could not start recording session.');
    }
  }

  /**
   * Pause current recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.status === 'recording') {
      try {
        this.mediaRecorder.pause();
        this.isPaused = true;
        this.setStatus('paused');
      } catch (err: any) {
        console.error('Pause failed:', err);
      }
    }
  }

  /**
   * Resume paused recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.status === 'paused') {
      try {
        this.mediaRecorder.resume();
        this.isPaused = false;
        this.setStatus('recording');
      } catch (err: any) {
        console.error('Resume failed:', err);
      }
    }
  }

  /**
   * Stop recording and save to IndexedDB
   */
  async stopRecording(): Promise<VideoRecord | null> {
    if (!this.mediaRecorder || this.status === 'idle') return null;

    this.setStatus('stopped');
    this.stopTimer();

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        this.cleanup();
        this.setStatus('idle');
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const format = this.currentConfig?.format || 'webm';
          const { actualFormat } = WebRecordingEngine.getSupportedMimeType(format);
          const mimeType = actualFormat === 'mp4' ? 'video/mp4' : 'video/webm';

          const finalBlob = new Blob(this.recordedChunks, { type: mimeType });
          const duration = this.secondsElapsed;
          const targetRes = this.currentConfig
            ? RESOLUTION_MAP[this.currentConfig.resolution].label
            : '1080p Full HD';

          const timestamp = new Date();
          const title = `Recording ${timestamp.getFullYear()}-${String(
            timestamp.getMonth() + 1
          ).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(
            timestamp.getHours()
          ).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;

          const record = await saveRecordingToDB({
            title,
            blob: finalBlob,
            duration,
            fileSize: finalBlob.size,
            resolution: targetRes,
            frameRate: this.currentConfig?.frameRate || 30,
            format: actualFormat,
            sourceType: this.currentConfig?.sourceMode || 'screen',
          });

          this.cleanup();
          this.setStatus('idle');
          resolve(record);
        } catch (err: any) {
          console.error('Error finalizing recording:', err);
          this.callbacks.onError('Failed to save recording: ' + err.message);
          this.cleanup();
          this.setStatus('idle');
          resolve(null);
        }
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch (e) {
        console.error('Error stopping MediaRecorder:', e);
        this.cleanup();
        this.setStatus('idle');
        resolve(null);
      }
    });
  }

  /**
   * Setup Real-Time Canvas Compositor for Screen + Camera
   */
  private setupCanvasCompositor(
    screenStream: MediaStream,
    cameraStream: MediaStream,
    width: number,
    height: number,
    config: RecordingConfig
  ): MediaStream {
    this.compositorCanvas = document.createElement('canvas');
    this.compositorCanvas.width = width;
    this.compositorCanvas.height = height;
    this.compositorCtx = this.compositorCanvas.getContext('2d', { alpha: false });

    this.screenVideoElem = this.screenCapture.attachToVideoElement(screenStream);
    this.cameraVideoElem = this.cameraCapture.attachToVideoElement(cameraStream);

    const drawFrame = () => {
      if (
        !this.compositorCtx ||
        !this.compositorCanvas ||
        !this.screenVideoElem ||
        !this.cameraVideoElem
      ) {
        return;
      }

      const ctx = this.compositorCtx;
      const cw = this.compositorCanvas.width;
      const ch = this.compositorCanvas.height;

      // 1. Draw Screen (Background)
      if (this.screenVideoElem.readyState >= 2) {
        ctx.drawImage(this.screenVideoElem, 0, 0, cw, ch);
      } else {
        ctx.fillStyle = '#090B09';
        ctx.fillRect(0, 0, cw, ch);
      }

      // 2. Draw Camera Bubble (Overlay)
      if (config.camera.enabled && this.cameraVideoElem.readyState >= 2) {
        const { size, position, shape, mirror } = config.camera;

        // Size calculations
        const sizeMultiplier = size === 'sm' ? 0.18 : size === 'lg' ? 0.32 : 0.24;
        const bubbleDim = Math.round(ch * sizeMultiplier);
        const margin = Math.round(ch * 0.04);

        let bx = cw - bubbleDim - margin;
        let by = ch - bubbleDim - margin;

        if (position === 'bottom-left') {
          bx = margin;
          by = ch - bubbleDim - margin;
        } else if (position === 'top-right') {
          bx = cw - bubbleDim - margin;
          by = margin;
        } else if (position === 'top-left') {
          bx = margin;
          by = margin;
        }

        ctx.save();

        // Clip shape
        ctx.beginPath();
        if (shape === 'circle') {
          const radius = bubbleDim / 2;
          ctx.arc(bx + radius, by + radius, radius, 0, Math.PI * 2);
        } else if (shape === 'rounded') {
          const corner = 24;
          ctx.roundRect(bx, by, bubbleDim, bubbleDim, corner);
        } else {
          ctx.rect(bx, by, bubbleDim, bubbleDim);
        }
        ctx.closePath();
        ctx.clip();

        // Draw webcam frame inside clipped region
        if (mirror) {
          ctx.save();
          ctx.translate(bx + bubbleDim, by);
          ctx.scale(-1, 1);
          ctx.drawImage(this.cameraVideoElem, 0, 0, bubbleDim, bubbleDim);
          ctx.restore();
        } else {
          ctx.drawImage(this.cameraVideoElem, bx, by, bubbleDim, bubbleDim);
        }

        ctx.restore();

        // Draw sleek green border (#00E632) around webcam bubble
        ctx.save();
        ctx.strokeStyle = '#00E632';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (shape === 'circle') {
          const radius = bubbleDim / 2;
          ctx.arc(bx + radius, by + radius, radius, 0, Math.PI * 2);
        } else if (shape === 'rounded') {
          ctx.roundRect(bx, by, bubbleDim, bubbleDim, 24);
        } else {
          ctx.rect(bx, by, bubbleDim, bubbleDim);
        }
        ctx.stroke();
        ctx.restore();
      }

      this.animationFrameId = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    this.canvasStream = this.compositorCanvas.captureStream(config.frameRate);
    return this.canvasStream;
  }

  /**
   * Helper to set approximate target video bitrate based on preset
   */
  private getVideoBitrate(resolution: string): number {
    switch (resolution) {
      case '4k':
        return 12000000; // 12 Mbps
      case '1440p':
        return 8000000; // 8 Mbps
      case '1080p':
        return 5000000; // 5 Mbps
      case '720p':
        return 2500000; // 2.5 Mbps
      default:
        return 1500000; // 1.5 Mbps
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.isPaused) {
        this.secondsElapsed += 1;
        this.callbacks.onTimeUpdate(this.secondsElapsed);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private setStatus(status: RecordingStatus): void {
    this.status = status;
    this.callbacks.onStatusChange(status);
  }

  /**
   * Cleanup all hardware devices, streams, canvas, and timers
   */
  cleanup(): void {
    this.stopTimer();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.audioCleanup) {
      this.audioCleanup();
      this.audioCleanup = null;
    }

    this.screenCapture.stopScreen();
    this.cameraCapture.stopCamera();
    this.audioCapture.stopMicrophone();

    if (this.canvasStream) {
      this.canvasStream.getTracks().forEach((track) => track.stop());
      this.canvasStream = null;
    }

    this.activeScreenStream = null;
    this.activeCameraStream = null;
    this.activeMicStream = null;
    this.screenVideoElem = null;
    this.cameraVideoElem = null;
    this.compositorCanvas = null;
    this.compositorCtx = null;
    this.mediaRecorder = null;
    this.isPaused = false;
  }
}


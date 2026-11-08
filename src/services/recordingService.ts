import { Capacitor } from '@capacitor/core';
import {
  RecordingConfig,
  RecordingStatus,
  VideoRecord,
} from '@/types';
import { WebRecordingEngine } from './web/webRecordingEngine';
import { CaptureStudio, NativeRecordingOptions } from './native/captureStudioPlugin';
import { saveRecordingToDB } from './storage/db';

export type StatusListener = (status: RecordingStatus) => void;
export type TimeListener = (seconds: number) => void;
export type VolumeListener = (volume: number) => void;
export type ErrorListener = (error: string) => void;

class RecordingServiceAdapter {
  private webEngine: WebRecordingEngine | null = null;
  private currentStatus: RecordingStatus = 'idle';
  private currentDuration: number = 0;

  private statusListeners = new Set<StatusListener>();
  private timeListeners = new Set<TimeListener>();
  private volumeListeners = new Set<VolumeListener>();
  private errorListeners = new Set<ErrorListener>();

  constructor() {
    if (this.isNative()) {
      this.initNativeListeners();
    }
  }

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatformName(): 'android' | 'web' {
    return this.isNative() ? 'android' : 'web';
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => this.statusListeners.delete(listener);
  }

  onTimeUpdate(listener: TimeListener): () => void {
    this.timeListeners.add(listener);
    listener(this.currentDuration);
    return () => this.timeListeners.delete(listener);
  }

  onVolumeUpdate(listener: VolumeListener): () => void {
    this.volumeListeners.add(listener);
    return () => this.volumeListeners.delete(listener);
  }

  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private notifyStatus(status: RecordingStatus): void {
    this.currentStatus = status;
    this.statusListeners.forEach((l) => l(status));
  }

  private notifyTime(seconds: number): void {
    this.currentDuration = seconds;
    this.timeListeners.forEach((l) => l(seconds));
  }

  private notifyVolume(volume: number): void {
    this.volumeListeners.forEach((l) => l(volume));
  }

  private notifyError(error: string): void {
    this.errorListeners.forEach((l) => l(error));
  }

  private initNativeListeners(): void {
    try {
      CaptureStudio.addListener('recordingStatusChange', (data) => {
        this.notifyStatus(data.status);
      });
      CaptureStudio.addListener('timeUpdate', (data) => {
        this.notifyTime(data.duration);
      });
    } catch (e) {
      console.warn('Native listener attachment skipped in non-native context', e);
    }
  }

  /**
   * Start recording session on current platform
   */
  async startRecording(config: RecordingConfig): Promise<void> {
    if (this.isNative()) {
      const options: NativeRecordingOptions = {
        sourceMode: config.sourceMode,
        resolution: config.resolution,
        frameRate: config.frameRate,
        format: config.format,
        micEnabled: config.audio.micEnabled,
        systemAudioEnabled: config.audio.systemAudioEnabled,
        cameraEnabled: config.camera.enabled,
        cameraPosition: config.camera.position,
        cameraSize: config.camera.size,
        cameraShape: config.camera.shape,
        cameraMirror: config.camera.mirror,
        floatingControllerEnabled: config.floatingControllerEnabled,
      };

      try {
        const res = await CaptureStudio.startRecording(options);
        if (!res.success) {
          throw new Error(res.message || 'Android recording initialization failed.');
        }
      } catch (err: any) {
        this.notifyError(err.message || 'Failed to start native Android recording');
      }
    } else {
      // Web browser engine
      if (!this.webEngine) {
        this.webEngine = new WebRecordingEngine({
          onStatusChange: (status) => this.notifyStatus(status),
          onTimeUpdate: (seconds) => this.notifyTime(seconds),
          onVolumeUpdate: (volume) => this.notifyVolume(volume),
          onError: (err) => this.notifyError(err),
        });
      }

      await this.webEngine.startRecording(config);
    }
  }

  /**
   * Pause recording session
   */
  pauseRecording(): void {
    if (this.isNative()) {
      CaptureStudio.pauseRecording().catch((e) => this.notifyError(e.message));
    } else if (this.webEngine) {
      this.webEngine.pauseRecording();
    }
  }

  /**
   * Resume recording session
   */
  resumeRecording(): void {
    if (this.isNative()) {
      CaptureStudio.resumeRecording().catch((e) => this.notifyError(e.message));
    } else if (this.webEngine) {
      this.webEngine.resumeRecording();
    }
  }

  /**
   * Stop recording session and return saved record
   */
  async stopRecording(): Promise<VideoRecord | null> {
    if (this.isNative()) {
      try {
        const res = await CaptureStudio.stopRecording();
        if (res && res.success) {
          const timestamp = new Date();
          const title = `Recording ${timestamp.getFullYear()}-${String(
            timestamp.getMonth() + 1
          ).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(
            timestamp.getHours()
          ).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;

          const savedRecord = await saveRecordingToDB({
            title,
            storagePath: res.filePath,
            duration: res.duration,
            fileSize: res.fileSize,
            resolution: res.resolution || '1080p Full HD',
            frameRate: 30,
            format: (res.format as any) || 'mp4',
            sourceType: 'screen',
            thumbnailUrl: res.thumbnailBase64 || '',
          });

          this.notifyStatus('idle');
          this.notifyTime(0);
          return savedRecord;
        }
        return null;
      } catch (err: any) {
        this.notifyError(err.message || 'Failed to stop Android native recording');
        return null;
      }
    } else if (this.webEngine) {
      const record = await this.webEngine.stopRecording();
      return record;
    }
    return null;
  }

  getStatus(): RecordingStatus {
    return this.currentStatus;
  }

  getDuration(): number {
    return this.currentDuration;
  }
}

export const recordingService = new RecordingServiceAdapter();

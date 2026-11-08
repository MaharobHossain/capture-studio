import { registerPlugin, PluginListenerHandle } from '@capacitor/core';
import { RecordingConfig, RecordingStatus } from '@/types';

export interface NativeRecordingOptions {
  sourceMode: string;
  resolution: string;
  frameRate: number;
  format: string;
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  cameraEnabled: boolean;
  cameraPosition: string;
  cameraSize: string;
  cameraShape: string;
  cameraMirror: boolean;
  floatingControllerEnabled: boolean;
}

export interface NativeRecordingResult {
  success: boolean;
  filePath: string;
  duration: number;
  fileSize: number;
  resolution: string;
  format: string;
  thumbnailBase64?: string;
}

export interface CaptureStudioPlugin {
  startRecording(options: NativeRecordingOptions): Promise<{ success: boolean; message?: string }>;
  pauseRecording(): Promise<{ success: boolean }>;
  resumeRecording(): Promise<{ success: boolean }>;
  stopRecording(): Promise<NativeRecordingResult>;
  getRecordingState(): Promise<{ status: RecordingStatus; duration: number; isFloatingActive: boolean }>;
  requestOverlayPermission(): Promise<{ granted: boolean }>;
  hasOverlayPermission(): Promise<{ granted: boolean }>;
  toggleFloatingController(options: { enabled: boolean }): Promise<{ success: boolean }>;
  exportVideo(options: {
    sourcePath: string;
    outputPath: string;
    trimStart: number;
    trimEnd: number;
    rotation: number;
  }): Promise<{ success: boolean; outputPath: string }>;

  addListener(
    eventName: 'recordingStatusChange',
    listenerFunc: (data: { status: RecordingStatus }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'timeUpdate',
    listenerFunc: (data: { duration: number }) => void
  ): Promise<PluginListenerHandle>;
}

export const CaptureStudio = registerPlugin<CaptureStudioPlugin>('CaptureStudio');


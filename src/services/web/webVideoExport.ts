/**
 * Web Video Export & Processing Service
 * Provides client-side video trimming, aspect ratio cropping, rotation,
 * audio volume/mute, text overlays, and format rendering.
 */
import { EditorSettings, RESOLUTION_MAP, VideoFormat } from '@/types';
import { WebRecordingEngine } from './webRecordingEngine';

export interface ExportProgressCallback {
  (progress: number, statusText: string): void;
}

export class WebVideoExport {
  private isCancelled: boolean = false;
  private activeRecorder: MediaRecorder | null = null;
  private activeVideoElem: HTMLVideoElement | null = null;

  cancel(): void {
    this.isCancelled = true;
    if (this.activeRecorder && this.activeRecorder.state !== 'inactive') {
      try {
        this.activeRecorder.stop();
      } catch {}
    }
    if (this.activeVideoElem) {
      this.activeVideoElem.pause();
      this.activeVideoElem.src = '';
    }
  }

  /**
   * Process and export video blob based on editor settings
   */
  async exportVideo(
    sourceBlob: Blob,
    settings: EditorSettings,
    onProgress: ExportProgressCallback
  ): Promise<Blob> {
    this.isCancelled = false;

    // Fast-path: If user didn't modify anything (no trim, no crop, no text, original speed/volume), return original blob
    const isUnmodified =
      settings.trimStart === 0 &&
      settings.trimEnd === 0 &&
      settings.aspectRatio === 'original' &&
      settings.rotation === 0 &&
      settings.volume === 1 &&
      !settings.isMuted &&
      settings.playbackSpeed === 1 &&
      settings.textOverlays.length === 0;

    if (isUnmodified) {
      onProgress(100, 'Export complete!');
      return sourceBlob;
    }

    onProgress(5, 'Preparing video processing engine...');

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      this.activeVideoElem = video;
      video.muted = settings.isMuted;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const blobUrl = URL.createObjectURL(sourceBlob);
      video.src = blobUrl;

      const cleanup = () => {
        URL.revokeObjectURL(blobUrl);
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        this.activeVideoElem = null;
        this.activeRecorder = null;
      };

      video.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video for processing'));
      };

      video.onloadedmetadata = async () => {
        try {
          const totalDuration = video.duration || 10;
          const startTime = Math.max(0, settings.trimStart);
          const endTime = settings.trimEnd > 0 ? Math.min(totalDuration, settings.trimEnd) : totalDuration;
          const exportDuration = Math.max(0.5, endTime - startTime);

          onProgress(10, 'Configuring canvas rendering pipeline...');

          // Calculate target width & height based on aspect ratio preset
          let targetWidth = video.videoWidth || 1920;
          let targetHeight = video.videoHeight || 1080;

          const resPreset = RESOLUTION_MAP[settings.exportResolution] || RESOLUTION_MAP['1080p'];
          const maxDim = resPreset.height;

          if (settings.aspectRatio === '16:9') {
            targetWidth = Math.round((maxDim * 16) / 9);
            targetHeight = maxDim;
          } else if (settings.aspectRatio === '9:16') {
            targetWidth = maxDim;
            targetHeight = Math.round((maxDim * 16) / 9);
          } else if (settings.aspectRatio === '1:1') {
            targetWidth = maxDim;
            targetHeight = maxDim;
          } else if (settings.aspectRatio === '4:3') {
            targetWidth = Math.round((maxDim * 4) / 3);
            targetHeight = maxDim;
          }

          // Swap dimensions if rotation is 90 or 270 deg
          if (settings.rotation === 90 || settings.rotation === 270) {
            const temp = targetWidth;
            targetWidth = targetHeight;
            targetHeight = temp;
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            cleanup();
            reject(new Error('Canvas 2D context unavailable'));
            return;
          }

          // Setup AudioContext for volume adjustment and capture
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          const sourceNode = audioCtx.createMediaElementSource(video);
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = settings.isMuted ? 0 : settings.volume;

          const destNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(gainNode);
          gainNode.connect(destNode);

          // Setup Canvas capture stream and add audio track
          const canvasStream = canvas.captureStream(30);
          if (!settings.isMuted && destNode.stream.getAudioTracks().length > 0) {
            canvasStream.addTrack(destNode.stream.getAudioTracks()[0]);
          }

          const { mimeType } = WebRecordingEngine.getSupportedMimeType(settings.exportFormat);
          const recorderOptions: MediaRecorderOptions = {
            videoBitsPerSecond: 6000000,
          };
          if (mimeType) {
            recorderOptions.mimeType = mimeType;
          }

          const recorder = new MediaRecorder(canvasStream, recorderOptions);
          this.activeRecorder = recorder;
          const outputChunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              outputChunks.push(e.data);
            }
          };

          recorder.onstop = () => {
            audioCtx.close().catch(() => {});
            cleanup();

            if (this.isCancelled) {
              reject(new Error('Export cancelled by user'));
              return;
            }

            const finalMime = recorderOptions.mimeType || 'video/webm';
            const exportedBlob = new Blob(outputChunks, { type: finalMime });
            onProgress(100, 'Export complete!');
            resolve(exportedBlob);
          };

          // Frame render loop
          let animId: number;
          const renderLoop = () => {
            if (this.isCancelled) {
              cancelAnimationFrame(animId);
              return;
            }

            const currentPos = video.currentTime;
            const progress = Math.min(
              95,
              Math.max(10, Math.round(10 + ((currentPos - startTime) / exportDuration) * 85))
            );
            onProgress(progress, `Rendering frame: ${currentPos.toFixed(1)}s / ${endTime.toFixed(1)}s`);

            // Check if finished
            if (currentPos >= endTime || video.ended) {
              cancelAnimationFrame(animId);
              recorder.stop();
              video.pause();
              return;
            }

            // Draw to Canvas with transformation
            ctx.fillStyle = '#090B09';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((settings.rotation * Math.PI) / 180);

            // Calculate scaled dimensions to preserve aspect ratio
            let drawW = canvas.width;
            let drawH = canvas.height;
            if (settings.rotation === 90 || settings.rotation === 270) {
              drawW = canvas.height;
              drawH = canvas.width;
            }

            ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();

            // Draw Text Overlays
            const relTime = currentPos - startTime;
            for (const overlay of settings.textOverlays) {
              if (relTime >= overlay.startTime && relTime <= overlay.endTime) {
                ctx.save();
                ctx.font = `bold ${overlay.fontSize || 32}px Inter, sans-serif`;
                const textX = (canvas.width * overlay.x) / 100;
                const textY = (canvas.height * overlay.y) / 100;

                if (overlay.backgroundColor) {
                  const metrics = ctx.measureText(overlay.text);
                  ctx.fillStyle = overlay.backgroundColor;
                  ctx.fillRect(
                    textX - 10,
                    textY - overlay.fontSize,
                    metrics.width + 20,
                    overlay.fontSize + 12
                  );
                }

                ctx.fillStyle = overlay.color || '#FFFFFF';
                ctx.fillText(overlay.text, textX, textY);
                ctx.restore();
              }
            }

            animId = requestAnimationFrame(renderLoop);
          };

          // Seek to trim start and begin playback recording
          video.currentTime = startTime;
          video.playbackRate = settings.playbackSpeed || 1.0;

          video.onseeked = () => {
            video.onseeked = null;
            recorder.start(500);
            video.play().then(() => {
              renderLoop();
            }).catch((err) => {
              cleanup();
              reject(err);
            });
          };
        } catch (err) {
          cleanup();
          reject(err);
        }
      };
    });
  }

  /**
   * Triggers a browser download for a video blob with specified filename
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}


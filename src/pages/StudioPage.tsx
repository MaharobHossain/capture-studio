import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Square,
  Pause,
  Video,
  AlertTriangle,
  Film,
  Download,
  Library,
  CheckCircle,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { useRecordingStore } from '@/store/useRecordingStore';
import { recordingService } from '@/services/recordingService';
import { SourceSelector } from '@/components/studio/SourceSelector';
import { AudioControls } from '@/components/studio/AudioControls';
import { CameraControls } from '@/components/studio/CameraControls';
import { QualityControls } from '@/components/studio/QualityControls';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { VideoRecord } from '@/types';
import { WebVideoExport } from '@/services/web/webVideoExport';
import confetti from 'canvas-confetti';

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const hours = Math.floor(mins / 60);

  if (hours > 0) {
    const remMins = mins % 60;
    return `${hours}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const StudioPage: React.FC = () => {
  const { config, status, duration, volume, setStatus, setDuration, setVolume } =
    useRecordingStore();
  const [completedVideo, setCompletedVideo] = useState<VideoRecord | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const navigate = useNavigate();

  // Detect mobile browser
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobileBrowser(isMobile && !recordingService.isNative());
  }, []);

  // Subscribe to recording adapter events
  useEffect(() => {
    const unbindStatus = recordingService.onStatusChange((s) => setStatus(s));
    const unbindTime = recordingService.onTimeUpdate((d) => setDuration(d));
    const unbindVolume = recordingService.onVolumeUpdate((v) => setVolume(v));
    const unbindError = recordingService.onError((err) => setErrorBanner(err));

    return () => {
      unbindStatus();
      unbindTime();
      unbindVolume();
      unbindError();
    };
  }, [setDuration, setStatus, setVolume]);

  const handleStart = async () => {
    setErrorBanner(null);
    try {
      await recordingService.startRecording(config);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to start recording');
    }
  };

  const handlePauseResume = () => {
    if (status === 'paused') {
      recordingService.resumeRecording();
    } else {
      recordingService.pauseRecording();
    }
  };

  const handleStop = async () => {
    try {
      const saved = await recordingService.stopRecording();
      if (saved) {
        setCompletedVideo(saved);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#00E632', '#00C92C', '#FFFFFF'],
          });
        } catch {}
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to stop recording');
    }
  };

  const isRecording = status === 'recording' || status === 'paused';
  const isPreparing = status === 'preparing';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse-slow" />
            <span className="text-xs font-semibold text-brand tracking-wider uppercase font-mono">
              Recording Console
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Capture Studio
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Studio-grade screen, webcam, and system audio capture. 100% guest friendly.
          </p>
        </div>

        {/* Live Timer Status Display */}
        {isRecording && (
          <div className="flex items-center gap-3 bg-surface-card border border-brand/40 px-5 py-3 rounded-2xl shadow-brand-glow animate-pulse-slow">
            <div className="w-3 h-3 rounded-full bg-brand animate-ping" />
            <div className="flex flex-col">
              <span className="text-[10px] text-brand font-bold uppercase tracking-wider font-mono">
                {status === 'paused' ? 'PAUSED' : 'RECORDING LIVE'}
              </span>
              <span className="text-xl font-mono font-black text-white">
                {formatDuration(duration)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Browser Warning */}
      {isMobileBrowser && (
        <div className="p-4 rounded-2xl bg-surface-card border border-status-warning/40 text-xs text-text-secondary flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white block mb-0.5">
              Mobile Browser Notice
            </span>
            Mobile web browsers restrict full-device screen recording. You can record using your Camera or open Capture Studio in our native Android App for unrestricted background screen recording!
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-status-error/10 border border-status-error/30 text-xs text-status-error flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Recording Notice</span>
              {errorBanner}
            </div>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-status-error/80 hover:text-status-error text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Section 1: Source Selector */}
      <SourceSelector />

      {/* Section 2: Audio Controls */}
      <AudioControls />

      {/* Camera Controls if Camera or Screen+Camera */}
      <CameraControls />

      {/* Section 3: Quality Controls */}
      <QualityControls />

      {/* Recording Master Action Bar */}
      <div className="sticky bottom-4 z-30 pt-4">
        <div className="p-4 rounded-2xl bg-surface-card/95 border border-border/80 shadow-brand-glow backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-brand">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                Ready to Record
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  {config.resolution} • {config.frameRate} FPS
                </span>
              </div>
              <div className="text-xs text-text-muted">
                {config.sourceMode === 'screen-camera'
                  ? 'Screen with Camera Bubble'
                  : config.sourceMode === 'camera'
                  ? 'Camera Only'
                  : 'Screen Only'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isRecording ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleStart}
                isLoading={isPreparing}
                className="w-full sm:w-auto text-base px-8 py-3.5"
                icon={<Play className="w-5 h-5 fill-surface-bg" />}
              >
                {isPreparing ? 'Requesting Permissions...' : 'Start Recording'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handlePauseResume}
                  className="flex-1 sm:flex-initial"
                  icon={
                    status === 'paused' ? (
                      <Play className="w-4 h-4 fill-white" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )
                  }
                >
                  {status === 'paused' ? 'Resume' : 'Pause'}
                </Button>

                <Button
                  variant="danger"
                  size="md"
                  onClick={handleStop}
                  className="flex-1 sm:flex-initial"
                  icon={<Square className="w-4 h-4 fill-white" />}
                >
                  Stop & Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recording Complete Modal */}
      <Modal
        isOpen={Boolean(completedVideo)}
        onClose={() => setCompletedVideo(null)}
        title="Recording Saved Successfully!"
        maxWidth="lg"
      >
        {completedVideo && (
          <div className="space-y-5">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border">
              <img
                src={completedVideo.thumbnailUrl}
                alt={completedVideo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div>
                  <h4 className="font-bold text-white text-base">
                    {completedVideo.title}
                  </h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Duration: {formatDuration(completedVideo.duration)} •{' '}
                    {(completedVideo.fileSize / (1024 * 1024)).toFixed(2)} MB •{' '}
                    {completedVideo.resolution}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Your video is securely stored locally in your browser IndexedDB storage without requiring an account. You can edit it now, download the raw video, or view all your recordings.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  const id = completedVideo.id;
                  setCompletedVideo(null);
                  navigate(`/editor/${id}`);
                }}
                icon={<Film className="w-4 h-4" />}
              >
                Edit Video
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (completedVideo.blob) {
                    WebVideoExport.downloadBlob(
                      completedVideo.blob,
                      `${completedVideo.title}.${completedVideo.format}`
                    );
                  }
                }}
                icon={<Download className="w-4 h-4" />}
              >
                Download
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setCompletedVideo(null);
                  navigate('/videos');
                }}
                icon={<Library className="w-4 h-4" />}
              >
                View Library
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

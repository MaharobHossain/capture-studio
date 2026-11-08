import React, { useMemo } from 'react';
import { Sliders, Sparkles, AlertCircle } from 'lucide-react';
import { useRecordingStore } from '@/store/useRecordingStore';
import { ResolutionPreset, FrameRate, VideoFormat, RESOLUTION_MAP } from '@/types';
import { WebRecordingEngine } from '@/services/web/webRecordingEngine';

export const QualityControls: React.FC = () => {
  const { config, setResolution, setFrameRate, setFormat, status } = useRecordingStore();
  const disabled = status === 'recording' || status === 'preparing';

  const isMp4Supported = useMemo(() => {
    return WebRecordingEngine.isMp4Supported();
  }, []);

  const resolutions: { id: ResolutionPreset; label: string; sub: string }[] = [
    { id: '720p', label: '720p', sub: 'HD' },
    { id: '1080p', label: '1080p', sub: 'Full HD' },
    { id: '1440p', label: '1440p', sub: '2K QHD' },
    { id: '4k', label: '4K', sub: 'Ultra HD' },
  ];

  const frameRates: { id: FrameRate; label: string }[] = [
    { id: 24, label: '24 FPS' },
    { id: 30, label: '30 FPS' },
    { id: 60, label: '60 FPS' },
  ];

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-surface-secondary text-brand">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">3. Recording Quality</h3>
            <p className="text-xs text-text-muted">Target resolution, frame rate and container format</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resolution selector */}
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">
            Target Resolution
          </label>
          <div className="grid grid-cols-2 gap-2">
            {resolutions.map((res) => (
              <button
                key={res.id}
                type="button"
                disabled={disabled}
                onClick={() => setResolution(res.id)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  config.resolution === res.id
                    ? 'bg-brand/10 border-brand text-white font-semibold shadow-sm'
                    : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
                }`}
              >
                <div className="text-sm font-bold leading-tight">{res.label}</div>
                <div className="text-[10px] text-text-muted">{res.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Frame Rate selector */}
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">
            Frame Rate
          </label>
          <div className="grid grid-cols-3 gap-2">
            {frameRates.map((fps) => (
              <button
                key={fps.id}
                type="button"
                disabled={disabled}
                onClick={() => setFrameRate(fps.id)}
                className={`py-3 px-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                  config.frameRate === fps.id
                    ? 'bg-brand/10 border-brand text-brand shadow-sm'
                    : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
                }`}
              >
                {fps.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selector */}
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-2">
            Container Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setFormat('webm')}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                config.format === 'webm'
                  ? 'bg-brand/10 border-brand text-white font-semibold shadow-sm'
                  : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
              }`}
            >
              <div className="text-sm font-bold flex items-center justify-between">
                WebM
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand/20 text-brand">Universal</span>
              </div>
              <div className="text-[10px] text-text-muted">High compression VP9/VP8</div>
            </button>

            <button
              type="button"
              disabled={disabled || !isMp4Supported}
              onClick={() => setFormat('mp4')}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                config.format === 'mp4'
                  ? 'bg-brand/10 border-brand text-white font-semibold shadow-sm'
                  : !isMp4Supported
                  ? 'bg-surface-secondary/40 border-border/40 opacity-40 cursor-not-allowed text-text-muted'
                  : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
              }`}
            >
              <div className="text-sm font-bold flex items-center justify-between">
                MP4
                {isMp4Supported ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand/20 text-brand">H.264</span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted">N/A</span>
                )}
              </div>
              <div className="text-[10px] text-text-muted">
                {isMp4Supported ? 'Native browser MP4' : 'Browser unsupported'}
              </div>
            </button>
          </div>
          {!isMp4Supported && (
            <p className="text-[10px] text-text-muted mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-status-warning" />
              Direct browser MP4 encoding requires hardware H.264 support. WebM recordings can be exported anytime via the built-in Editor!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


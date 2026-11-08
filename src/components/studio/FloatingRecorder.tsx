import React from 'react';
import { Pause, Play, Square, Circle } from 'lucide-react';
import { useRecordingStore } from '@/store/useRecordingStore';
import { recordingService } from '@/services/recordingService';

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

export const FloatingRecorder: React.FC = () => {
  const { status, duration } = useRecordingStore();

  if (status !== 'recording' && status !== 'paused') {
    return null;
  }

  const isPaused = status === 'paused';

  const handlePauseResume = () => {
    if (isPaused) {
      recordingService.resumeRecording();
    } else {
      recordingService.pauseRecording();
    }
  };

  const handleStop = async () => {
    await recordingService.stopRecording();
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle">
      <div className="flex items-center gap-4 px-5 py-3 rounded-full bg-surface-secondary/95 border border-brand/60 shadow-brand-glow-lg backdrop-blur-xl">
        {/* Pulsing indicator */}
        <div className="flex items-center gap-2 pr-2 border-r border-border">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-3 h-3 rounded-full ${
                isPaused ? 'bg-status-warning' : 'bg-brand'
              } ${!isPaused ? 'animate-ping' : ''}`}
            />
            <span
              className={`absolute w-3 h-3 rounded-full ${
                isPaused ? 'bg-status-warning' : 'bg-brand'
              }`}
            />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-white font-mono">
            {isPaused ? 'PAUSED' : 'REC'}
          </span>
        </div>

        {/* Timer */}
        <div className="font-mono text-base font-extrabold text-white tracking-widest min-w-[70px]">
          {formatDuration(duration)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={handlePauseResume}
            className="p-2.5 rounded-full bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary hover:text-white transition-all active:scale-95"
            title={isPaused ? 'Resume Recording' : 'Pause Recording'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-status-error text-white font-semibold text-xs hover:bg-red-600 shadow-md transition-all active:scale-95"
            title="Stop & Save Recording"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
};


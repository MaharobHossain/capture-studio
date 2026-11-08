import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Film,
  Play,
  Pause,
  RotateCw,
  Volume2,
  VolumeX,
  Scissors,
  Type,
  Download,
  Save,
  CheckCircle2,
  X,
  Sparkles,
  ArrowLeft,
  Ratio,
  Sliders,
} from 'lucide-react';
import {
  VideoRecord,
  EditorSettings,
  TextOverlay,
  ResolutionPreset,
  VideoFormat,
} from '@/types';
import {
  getRecordingByIdFromDB,
  getAllRecordingsFromDB,
  saveRecordingToDB,
} from '@/services/storage/db';
import { WebVideoExport } from '@/services/web/webVideoExport';
import { Button } from '@/components/common/Button';
import confetti from 'canvas-confetti';

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
}

export const EditorPage: React.FC = () => {
  const { videoId } = useParams<{ videoId?: string }>();
  const navigate = useNavigate();

  const [availableVideos, setAvailableVideos] = useState<VideoRecord[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoRecord | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Video element state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Editor settings
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    trimStart: 0,
    trimEnd: 0,
    aspectRatio: 'original',
    rotation: 0,
    volume: 1.0,
    isMuted: false,
    playbackSpeed: 1.0,
    textOverlays: [],
    exportResolution: '1080p',
    exportFormat: 'webm',
  });

  // Text overlay builder state
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#00E632');

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const exportServiceRef = useRef<WebVideoExport | null>(null);

  // Load video records
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const all = await getAllRecordingsFromDB();
      setAvailableVideos(all);

      if (videoId) {
        const found = await getRecordingByIdFromDB(videoId);
        if (found) {
          setCurrentVideo(found);
          if (found.blob) {
            setVideoBlobUrl(URL.createObjectURL(found.blob));
          } else if (found.storagePath) {
            setVideoBlobUrl(found.storagePath);
          }
        }
      } else if (all.length > 0) {
        // Default to first video if available
        setCurrentVideo(all[0]);
        if (all[0].blob) {
          setVideoBlobUrl(URL.createObjectURL(all[0].blob));
        }
      }
      setIsLoading(false);
    }
    load();
  }, [videoId]);

  // Video playback time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Enforce trim boundary during preview
      if (editorSettings.trimEnd > 0 && cur >= editorSettings.trimEnd) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = editorSettings.trimStart;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 10;
      setVideoDuration(dur);
      setEditorSettings((prev) => ({
        ...prev,
        trimEnd: prev.trimEnd === 0 ? dur : prev.trimEnd,
      }));
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime < editorSettings.trimStart || (editorSettings.trimEnd > 0 && currentTime >= editorSettings.trimEnd)) {
        videoRef.current.currentTime = editorSettings.trimStart;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRotate = () => {
    const nextRot = ((editorSettings.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    setEditorSettings((prev) => ({ ...prev, rotation: nextRot }));
  };

  const handleAddTextOverlay = () => {
    if (!newText.trim()) return;
    const overlay: TextOverlay = {
      id: `text_${Date.now()}`,
      text: newText.trim(),
      startTime: Math.max(0, editorSettings.trimStart),
      endTime: editorSettings.trimEnd > 0 ? editorSettings.trimEnd : videoDuration,
      x: 50,
      y: 80,
      fontSize: 32,
      color: textColor,
      backgroundColor: 'rgba(0,0,0,0.6)',
    };
    setEditorSettings((prev) => ({
      ...prev,
      textOverlays: [...prev.textOverlays, overlay],
    }));
    setNewText('');
  };

  const handleRemoveTextOverlay = (id: string) => {
    setEditorSettings((prev) => ({
      ...prev,
      textOverlays: prev.textOverlays.filter((t) => t.id !== id),
    }));
  };

  const handleExport = async () => {
    if (!currentVideo?.blob) {
      alert('Video source data is not available for processing.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText('Initializing export...');

    const exporter = new WebVideoExport();
    exportServiceRef.current = exporter;

    try {
      const exportedBlob = await exporter.exportVideo(
        currentVideo.blob,
        editorSettings,
        (progress, statusText) => {
          setExportProgress(progress);
          setExportStatusText(statusText);
        }
      );

      // Save edited version as a new video record
      const editedTitle = `${currentVideo.title} (Edited)`;
      const duration = (editorSettings.trimEnd || videoDuration) - editorSettings.trimStart;

      const saved = await saveRecordingToDB({
        title: editedTitle,
        blob: exportedBlob,
        duration: Math.max(1, duration),
        fileSize: exportedBlob.size,
        resolution: editorSettings.exportResolution,
        frameRate: 30,
        format: editorSettings.exportFormat,
        sourceType: currentVideo.sourceType,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#00E632', '#00C92C', '#FFFFFF'],
        });
      } catch {}

      // Prompt user to download or view in library
      WebVideoExport.downloadBlob(
        exportedBlob,
        `${editedTitle}.${editorSettings.exportFormat}`
      );
      alert('Video successfully exported and downloaded! Saved to your library.');
      navigate('/videos');
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        alert('Export error: ' + err.message);
      }
    } finally {
      setIsExporting(false);
      exportServiceRef.current = null;
    }
  };

  const handleCancelExport = () => {
    if (exportServiceRef.current) {
      exportServiceRef.current.cancel();
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/videos"
            className="p-2 rounded-xl bg-surface-card border border-border text-text-secondary hover:text-white"
            title="Back to library"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-brand" />
              <span className="text-[10px] font-semibold text-brand uppercase tracking-wider font-mono">
                Studio Video Editor
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              {currentVideo ? currentVideo.title : 'Video Editor'}
            </h1>
          </div>
        </div>

        {/* Video selector dropdown if multiple recordings exist */}
        {availableVideos.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Select Video:</span>
            <select
              value={currentVideo?.id || ''}
              onChange={(e) => {
                navigate(`/editor/${e.target.value}`);
              }}
              className="bg-surface-card border border-border text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand"
            >
              {availableVideos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-96 rounded-2xl bg-surface-card border border-border animate-pulse flex items-center justify-center text-text-muted">
          Loading Studio Editor...
        </div>
      ) : !currentVideo ? (
        <div className="text-center py-20 bg-surface-card/40 border border-border rounded-2xl space-y-4">
          <Film className="w-12 h-12 text-brand mx-auto" />
          <h3 className="text-lg font-bold text-white">No video selected</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Record a video first or select one from your library to start editing with trims, crops, text overlays and rotation.
          </p>
          <Link to="/">
            <Button variant="primary" size="md">
              Record in Studio
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Viewport & Timeline (Left / Col 2) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Canvas Container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-border flex items-center justify-center shadow-card-dark">
              {videoBlobUrl && (
                <video
                  ref={videoRef}
                  src={videoBlobUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  playsInline
                  className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
                    editorSettings.rotation === 90
                      ? 'rotate-90'
                      : editorSettings.rotation === 180
                      ? 'rotate-180'
                      : editorSettings.rotation === 270
                      ? 'rotate-[270deg]'
                      : ''
                  }`}
                />
              )}

              {/* Text Overlays Live Preview */}
              {editorSettings.textOverlays.map((t) => {
                const isVisible =
                  currentTime >= t.startTime && currentTime <= t.endTime;
                if (!isVisible) return null;
                return (
                  <div
                    key={t.id}
                    className="absolute font-bold px-3 py-1 rounded shadow-lg pointer-events-none"
                    style={{
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: t.color,
                      backgroundColor: t.backgroundColor,
                      fontSize: `${t.fontSize}px`,
                    }}
                  >
                    {t.text}
                  </div>
                );
              })}

              {/* Central Play/Pause Overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-brand text-surface-bg flex items-center justify-center shadow-brand-glow transform group-hover:scale-110 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-surface-bg" />
                  ) : (
                    <Play className="w-6 h-6 fill-surface-bg ml-1" />
                  )}
                </div>
              </button>
            </div>

            {/* Playback & Timeline Controls */}
            <div className="bg-surface-card border border-border rounded-2xl p-4 space-y-3">
              {/* Timeline scrubber */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(videoDuration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={videoDuration || 10}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                      setCurrentTime(time);
                    }
                  }}
                  className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Trim Range Slider Controls */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5 mb-1">
                    <Scissors className="w-3.5 h-3.5 text-brand" /> Trim Start: {formatTime(editorSettings.trimStart)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, (editorSettings.trimEnd || videoDuration) - 0.5)}
                    step="0.1"
                    value={editorSettings.trimStart}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEditorSettings((prev) => ({ ...prev, trimStart: val }));
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5 mb-1">
                    <Scissors className="w-3.5 h-3.5 text-brand" /> Trim End: {formatTime(editorSettings.trimEnd || videoDuration)}
                  </label>
                  <input
                    type="range"
                    min={editorSettings.trimStart + 0.5}
                    max={videoDuration || 10}
                    step="0.1"
                    value={editorSettings.trimEnd || videoDuration}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEditorSettings((prev) => ({ ...prev, trimEnd: val }));
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Editing Tools Panel (Right / Col 1) */}
          <div className="space-y-4">
            {/* Aspect Ratio & Transform */}
            <div className="bg-surface-card border border-border rounded-2xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Ratio className="w-4 h-4 text-brand" /> Aspect Ratio & Transform
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {(['original', '16:9', '9:16', '1:1', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setEditorSettings((prev) => ({ ...prev, aspectRatio: ratio }))}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all ${
                      editorSettings.aspectRatio === ratio
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
                    }`}
                  >
                    {ratio === 'original' ? 'Original' : ratio}
                  </button>
                ))}
              </div>

              {/* Rotation & Audio Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRotate}
                  icon={<RotateCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Rotate ({editorSettings.rotation}°)
                </Button>

                <button
                  onClick={() => {
                    setEditorSettings((prev) => ({ ...prev, isMuted: !prev.isMuted }));
                    if (videoRef.current) {
                      videoRef.current.muted = !editorSettings.isMuted;
                    }
                  }}
                  className={`p-2 rounded-xl border transition-colors ${
                    editorSettings.isMuted
                      ? 'bg-status-error/20 border-status-error text-status-error'
                      : 'bg-surface-secondary border-border text-white'
                  }`}
                  title={editorSettings.isMuted ? 'Unmute' : 'Mute Audio'}
                >
                  {editorSettings.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Playback speed */}
              <div>
                <label className="text-xs text-text-secondary block mb-1 font-medium">
                  Playback Speed
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.5, 1.0, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        setEditorSettings((prev) => ({ ...prev, playbackSpeed: speed }));
                        if (videoRef.current) videoRef.current.playbackRate = speed;
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-lg border text-center ${
                        editorSettings.playbackSpeed === speed
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'bg-surface-secondary border-border text-text-secondary'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Text Overlay Tool */}
            <div className="bg-surface-card border border-border rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-brand" /> Add Text Overlay
              </h3>

              <div className="space-y-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter title or caption..."
                  className="input-field text-xs py-2"
                />

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 bg-surface-secondary p-1 rounded-xl border border-border">
                    {['#00E632', '#FFFFFF', '#F59E0B', '#EF4444', '#3B82F6'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setTextColor(col)}
                        className={`w-6 h-6 rounded-full border ${
                          textColor === col ? 'border-white scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTextOverlay}
                    disabled={!newText.trim()}
                    className="text-xs shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Overlays list */}
              {editorSettings.textOverlays.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  {editorSettings.textOverlays.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-surface-secondary text-xs"
                    >
                      <span className="truncate max-w-[150px] font-medium" style={{ color: t.color }}>
                        &ldquo;{t.text}&rdquo;
                      </span>
                      <button
                        onClick={() => handleRemoveTextOverlay(t.id)}
                        className="text-text-muted hover:text-status-error p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export & Render Action Card */}
            <div className="bg-surface-elevated border border-brand/40 rounded-2xl p-4 space-y-4 shadow-brand-glow">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" /> Export Video
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-text-muted block mb-1">Resolution</label>
                  <select
                    value={editorSettings.exportResolution}
                    onChange={(e) =>
                      setEditorSettings((prev) => ({
                        ...prev,
                        exportResolution: e.target.value as ResolutionPreset,
                      }))
                    }
                    className="w-full bg-surface-card border border-border rounded-xl px-2.5 py-1.5 text-white"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="1440p">1440p 2K</option>
                    <option value="4k">4K Ultra HD</option>
                  </select>
                </div>

                <div>
                  <label className="text-text-muted block mb-1">Format</label>
                  <select
                    value={editorSettings.exportFormat}
                    onChange={(e) =>
                      setEditorSettings((prev) => ({
                        ...prev,
                        exportFormat: e.target.value as VideoFormat,
                      }))
                    }
                    className="w-full bg-surface-card border border-border rounded-xl px-2.5 py-1.5 text-white"
                  >
                    <option value="webm">WebM</option>
                    <option value="mp4">MP4</option>
                  </select>
                </div>
              </div>

              {/* Progress bar during export */}
              {isExporting && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted truncate max-w-[200px]">
                      {exportStatusText}
                    </span>
                    <span className="font-mono text-brand font-bold">
                      {exportProgress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {!isExporting ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleExport}
                    className="w-full"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Render & Export Video
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handleCancelExport}
                    className="w-full"
                  >
                    Cancel Export
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


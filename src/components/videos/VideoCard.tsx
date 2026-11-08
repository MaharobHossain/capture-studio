import React, { useState } from 'react';
import {
  Play,
  Download,
  Share2,
  Trash2,
  Edit2,
  Film,
  Calendar,
  HardDrive,
  Clock,
  CloudUpload,
  Check,
} from 'lucide-react';
import { VideoRecord } from '@/types';
import { WebVideoExport } from '@/services/web/webVideoExport';
import { uploadRecordingToCloud } from '@/services/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useNavigate } from 'react-router-dom';

interface VideoCardProps {
  video: VideoRecord;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, newTitle: string) => Promise<void>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const hours = Math.floor(mins / 60);

  if (hours > 0) {
    const remMins = mins % 60;
    return `${hours}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete, onRename }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(video.isCloudSynced || false);
  const [titleInput, setTitleInput] = useState(video.title);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleDownload = () => {
    if (video.blob) {
      const ext = video.format || 'webm';
      const filename = `${video.title.replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
      WebVideoExport.downloadBlob(video.blob, filename);
    } else if (video.storagePath) {
      window.open(video.storagePath, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share && video.blob) {
      try {
        const file = new File([video.blob], `${video.title}.${video.format}`, {
          type: video.blob.type,
        });
        await navigator.share({
          title: video.title,
          text: 'Recorded with Capture Studio',
          files: [file],
        });
        return;
      } catch {}
    }

    // Fallback: Copy title or alert
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(video.title);
      alert('Video details copied to clipboard!');
    }
  };

  const handleCloudUpload = async () => {
    if (!user || !video.blob) {
      alert('Sign in to upload videos to cloud storage.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadRecordingToCloud(
        video.blob,
        user.id,
        `${video.id}.${video.format}`
      );
      if (res) {
        setUploadSuccess(true);
        alert('Recording successfully uploaded to your Capture Studio cloud storage!');
      }
    } catch (err: any) {
      alert(err.message || 'Cloud upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveRename = async () => {
    if (titleInput.trim()) {
      await onRename(video.id, titleInput.trim());
      setIsRenaming(false);
    }
  };

  const videoUrl = video.blob ? URL.createObjectURL(video.blob) : video.storagePath;

  return (
    <>
      <div className="bg-surface-card border border-border hover:border-border-bright rounded-2xl overflow-hidden shadow-card-dark transition-all duration-200 flex flex-col group">
        {/* Thumbnail & Quick Play Overlay */}
        <div className="relative aspect-video bg-surface-secondary overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-mono font-bold text-white flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand" />
            {formatDuration(video.duration)}
          </div>

          {/* Resolution Badge */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-surface-card/80 backdrop-blur-sm text-[10px] font-semibold text-brand border border-brand/20 uppercase">
            {video.resolution}
          </div>

          {/* Big Play Button Hover Overlay */}
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            title="Play Preview"
          >
            <div className="w-12 h-12 rounded-full bg-brand text-surface-bg flex items-center justify-center shadow-brand-glow transform hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-surface-bg ml-0.5" />
            </div>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-white line-clamp-1 flex-1" title={video.title}>
                {video.title}
              </h4>
              <button
                onClick={() => setIsRenaming(true)}
                className="text-text-muted hover:text-white p-1 rounded-md hover:bg-surface-elevated transition-colors"
                title="Rename Recording"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(video.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <HardDrive className="w-3 h-3" />
                {formatBytes(video.fileSize)}
              </span>
              <span>•</span>
              <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-surface-elevated font-mono">
                {video.format}
              </span>
            </div>
          </div>

          {/* Card Actions Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/editor/${video.id}`)}
                className="text-xs px-2.5 py-1 text-brand hover:text-brand-light"
                title="Open in Video Editor"
              >
                <Film className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>

              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-surface-elevated transition-colors"
                title="Download video"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-surface-elevated transition-colors"
                title="Share video"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {user && (
                <button
                  onClick={handleCloudUpload}
                  disabled={isUploading || uploadSuccess}
                  className={`p-1.5 rounded-lg transition-colors ${
                    uploadSuccess
                      ? 'text-brand'
                      : 'text-text-secondary hover:text-brand hover:bg-surface-elevated'
                  }`}
                  title={uploadSuccess ? 'Synced to Cloud' : 'Upload to Cloud'}
                >
                  {uploadSuccess ? <Check className="w-4 h-4" /> : <CloudUpload className="w-4 h-4" />}
                </button>
              )}
            </div>

            <button
              onClick={() => setIsDeleting(true)}
              className="p-1.5 rounded-lg text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
              title="Delete recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Playback Modal */}
      <Modal
        isOpen={isPlaying}
        onClose={() => setIsPlaying(false)}
        title={video.title}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border">
            {videoUrl && (
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Duration: {formatDuration(video.duration)}</span>
            <span>Resolution: {video.resolution}</span>
            <span>Size: {formatBytes(video.fileSize)}</span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsPlaying(false);
                navigate(`/editor/${video.id}`);
              }}
              icon={<Film className="w-4 h-4" />}
            >
              Edit in Studio
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={isRenaming}
        onClose={() => setIsRenaming(false)}
        title="Rename Recording"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary block mb-1.5 font-medium">
              New Title
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="input-field text-sm"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRenaming(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRename}>
              Save Title
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Delete Recording?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to permanently delete &ldquo;{video.title}&rdquo;? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                await onDelete(video.id);
                setIsDeleting(false);
              }}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};


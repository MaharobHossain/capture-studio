import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Eye,
  FlipHorizontal,
  Circle,
  Square,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useRecordingStore } from '@/store/useRecordingStore';
import { WebCameraCapture } from '@/services/web/webCameraCapture';
import { CameraPosition, CameraSize, CameraShape } from '@/types';
import { Button } from '@/components/common/Button';

export const CameraControls: React.FC = () => {
  const {
    config,
    setCameraEnabled,
    setCameraDeviceId,
    setCameraPosition,
    setCameraSize,
    setCameraShape,
    setCameraMirror,
    availableCameras,
    setAvailableCameras,
    status,
  } = useRecordingStore();

  const [previewActive, setPreviewActive] = useState(false);
  const [cameraCapture] = useState(() => new WebCameraCapture());
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const disabled = status === 'recording' || status === 'preparing';

  // Enumerate cameras
  useEffect(() => {
    async function loadCameras() {
      const cameras = await cameraCapture.getVideoInputDevices();
      setAvailableCameras(cameras);
      if (cameras.length > 0 && !config.camera.deviceId) {
        setCameraDeviceId(cameras[0].deviceId);
      }
    }
    loadCameras();
  }, [cameraCapture, config.camera.deviceId, setAvailableCameras, setCameraDeviceId]);

  // Handle live preview
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (previewActive && config.camera.enabled) {
      cameraCapture
        .getCameraStream(config.camera.deviceId || undefined, '720p', 30)
        .then((stream) => {
          activeStream = stream;
          if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = stream;
            previewVideoRef.current.play().catch(() => {});
          }
        })
        .catch((e) => {
          console.warn('Camera preview failed:', e);
          setPreviewActive(false);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [previewActive, config.camera.enabled, config.camera.deviceId, cameraCapture]);

  if (!config.camera.enabled && config.sourceMode === 'screen') {
    return null;
  }

  const positions: { id: CameraPosition; label: string }[] = [
    { id: 'top-left', label: 'Top-Left' },
    { id: 'top-right', label: 'Top-Right' },
    { id: 'bottom-left', label: 'Bottom-Left' },
    { id: 'bottom-right', label: 'Bottom-Right' },
  ];

  const shapes: { id: CameraShape; label: string; icon: React.ElementType }[] = [
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'rounded', label: 'Rounded', icon: Maximize2 },
    { id: 'square', label: 'Square', icon: Square },
  ];

  const sizes: { id: CameraSize; label: string }[] = [
    { id: 'sm', label: 'Small' },
    { id: 'md', label: 'Medium' },
    { id: 'lg', label: 'Large' },
  ];

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-surface-secondary text-brand">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Camera Overlay Settings</h3>
            <p className="text-xs text-text-muted">Customize webcam bubble appearance and position</p>
          </div>
        </div>

        <Button
          variant={previewActive ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setPreviewActive(!previewActive)}
          className="text-xs"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          {previewActive ? 'Hide Preview' : 'Preview Camera'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Device Picker & Live Camera Preview Frame */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-text-secondary block">
            Camera Device
          </label>
          <select
            disabled={disabled}
            value={config.camera.deviceId}
            onChange={(e) => setCameraDeviceId(e.target.value)}
            className="w-full text-xs bg-surface-secondary border border-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand"
          >
            {availableCameras.length > 0 ? (
              availableCameras.map((cam, idx) => (
                <option key={cam.deviceId || idx} value={cam.deviceId}>
                  {cam.label || `Camera ${idx + 1}`}
                </option>
              ))
            ) : (
              <option value="">Default Front / Webcam</option>
            )}
          </select>

          {/* Mirror toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border">
            <div className="flex items-center gap-2 text-xs text-text-primary">
              <FlipHorizontal className="w-4 h-4 text-brand" />
              <span>Mirror Camera Feed</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={config.camera.mirror}
                onChange={(e) => setCameraMirror(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
            </label>
          </div>

          {/* Live Preview Box */}
          {previewActive && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-brand/50 shadow-brand-glow">
              <video
                ref={previewVideoRef}
                muted
                playsInline
                className={`w-full h-full object-cover ${
                  config.camera.mirror ? '-scale-x-100' : ''
                }`}
              />
              <div className="absolute top-2 right-2 bg-brand/90 text-surface-bg text-[10px] font-bold px-2 py-0.5 rounded-full">
                LIVE PREVIEW
              </div>
            </div>
          )}
        </div>

        {/* Bubble Customization: Position, Size, Shape */}
        <div className="space-y-4">
          {/* Position */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
              Screen Position
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setCameraPosition(pos.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    config.camera.position === pos.id
                      ? 'bg-brand/10 border-brand text-brand font-semibold'
                      : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shape */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
              Bubble Shape
            </label>
            <div className="grid grid-cols-3 gap-2">
              {shapes.map((sh) => {
                const Icon = sh.icon;
                return (
                  <button
                    key={sh.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setCameraShape(sh.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      config.camera.shape === sh.id
                        ? 'bg-brand/10 border-brand text-brand font-semibold'
                        : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {sh.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1.5">
              Overlay Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setCameraSize(s.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    config.camera.size === s.id
                      ? 'bg-brand/10 border-brand text-brand font-semibold'
                      : 'bg-surface-secondary border-border text-text-secondary hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


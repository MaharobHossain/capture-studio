import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRecordingStore } from '@/store/useRecordingStore';
import { WebAudioCapture } from '@/services/web/webAudioCapture';
import { Button } from '@/components/common/Button';

export const AudioControls: React.FC = () => {
  const {
    config,
    setMicEnabled,
    setMicDeviceId,
    setSystemAudioEnabled,
    availableMics,
    setAvailableMics,
    status,
  } = useRecordingStore();

  const [testActive, setTestActive] = useState(false);
  const [testVolume, setTestVolume] = useState(0);
  const [audioCapture] = useState(() => new WebAudioCapture());
  const disabled = status === 'recording' || status === 'preparing';

  // Load available microphone devices
  useEffect(() => {
    async function loadMics() {
      const mics = await audioCapture.getAudioInputDevices();
      setAvailableMics(mics);
      if (mics.length > 0 && !config.audio.micDeviceId) {
        setMicDeviceId(mics[0].deviceId);
      }
    }
    loadMics();

    // Listen for device changes
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      navigator.mediaDevices.ondevicechange = loadMics;
    }
  }, [audioCapture, config.audio.micDeviceId, setAvailableMics, setMicDeviceId]);

  const toggleTestMic = async () => {
    if (testActive) {
      audioCapture.stopMicrophone();
      setTestActive(false);
      setTestVolume(0);
    } else {
      try {
        const stream = await audioCapture.getMicrophoneStream(config.audio.micDeviceId || undefined);
        setTestActive(true);
        audioCapture.startAudioMeter(stream, (vol) => {
          setTestVolume(vol);
        });
      } catch (err: any) {
        alert(err.message || 'Could not test microphone');
      }
    }
  };

  useEffect(() => {
    return () => {
      audioCapture.stopMicrophone();
    };
  }, [audioCapture]);

  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-surface-secondary text-brand">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">2. Audio Settings</h3>
            <p className="text-xs text-text-muted">Configure microphone & system audio</p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Microphone Toggle & Device Selector */}
        <div className="bg-surface-secondary border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  config.audio.micEnabled
                    ? 'bg-brand/20 text-brand'
                    : 'bg-surface-elevated text-text-muted'
                }`}
              >
                {config.audio.micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-sm font-medium text-white block">Microphone</span>
                <span className="text-xs text-text-muted">Record voice narration</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={config.audio.micEnabled}
                onChange={(e) => setMicEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            </label>
          </div>

          {config.audio.micEnabled && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <select
                disabled={disabled}
                value={config.audio.micDeviceId}
                onChange={(e) => setMicDeviceId(e.target.value)}
                className="w-full text-xs bg-surface-card border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand"
              >
                {availableMics.length > 0 ? (
                  availableMics.map((mic, idx) => (
                    <option key={mic.deviceId || idx} value={mic.deviceId}>
                      {mic.label || `Microphone ${idx + 1}`}
                    </option>
                  ))
                ) : (
                  <option value="">Default Microphone</option>
                )}
              </select>

              {/* Mic Meter and Test Button */}
              <div className="flex items-center gap-3">
                <Button
                  variant={testActive ? 'danger' : 'outline'}
                  size="sm"
                  onClick={toggleTestMic}
                  className="shrink-0 text-xs py-1 px-2.5"
                >
                  <Radio className="w-3.5 h-3.5 mr-1" />
                  {testActive ? 'Stop Test' : 'Test Mic'}
                </Button>

                {/* Level Meter Bar */}
                <div className="flex-1 bg-surface-elevated h-3 rounded-full overflow-hidden p-0.5 border border-border">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-75"
                    style={{ width: `${testActive ? testVolume : 0}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-text-muted w-8 text-right">
                  {testActive ? `${testVolume}%` : '0%'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* System Audio Toggle */}
        <div className="bg-surface-secondary border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  config.audio.systemAudioEnabled
                    ? 'bg-brand/20 text-brand'
                    : 'bg-surface-elevated text-text-muted'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-medium text-white block">System Audio</span>
                <span className="text-xs text-text-muted">Internal audio & tab sound</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={config.audio.systemAudioEnabled}
                onChange={(e) => setSystemAudioEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
            </label>
          </div>

          <div className="mt-3 text-[11px] text-text-muted flex items-start gap-1.5 bg-surface-card/60 p-2.5 rounded-lg border border-border/40">
            <AlertCircle className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
            <span>
              On Desktop Chrome/Edge, enable &ldquo;Share audio&rdquo; in the screen share dialog. On Android, internal capture is supported per Android audio policy.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


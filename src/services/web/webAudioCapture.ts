/**
 * Audio Capture Service for Web
 * Manages microphone, Web Audio API analysis, and multi-track audio mixing
 */

export class WebAudioCapture {
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private dataArray: Uint8Array | null = null;

  /**
   * Request microphone stream with device selection and quality constraints
   */
  async getMicrophoneStream(deviceId?: string): Promise<MediaStream> {
    this.stopMicrophone();

    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    };

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.micStream;
    } catch (err: any) {
      console.error('Failed to acquire microphone:', err);
      throw new Error(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : `Microphone error: ${err.message || 'Device not accessible'}`
      );
    }
  }

  /**
   * Initialize audio meter for real-time volume analysis (0 - 100%)
   */
  startAudioMeter(
    stream: MediaStream,
    onVolumeChange: (volume: number) => void
  ): void {
    this.stopAudioMeter();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser || !this.dataArray) return;
        this.analyser.getByteFrequencyData(this.dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += this.dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize 0..100
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        onVolumeChange(normalized);

        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Web Audio API not fully supported for volume meter', e);
    }
  }

  /**
   * Stop volume meter and close audio context
   */
  stopAudioMeter(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
  }

  /**
   * Mix multiple audio streams (e.g. system audio + microphone) into a single unified MediaStreamTrack
   */
  mixAudioStreams(streams: MediaStream[]): {
    mixedStream: MediaStream;
    cleanup: () => void;
  } {
    const validStreams = streams.filter(
      (s) => s && s.getAudioTracks().length > 0
    );

    if (validStreams.length === 0) {
      return {
        mixedStream: new MediaStream(),
        cleanup: () => {},
      };
    }

    if (validStreams.length === 1) {
      return {
        mixedStream: validStreams[0],
        cleanup: () => {},
      };
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const destination = ctx.createMediaStreamDestination();

      const sources = validStreams.map((stream) => {
        const source = ctx.createMediaStreamSource(stream);
        source.connect(destination);
        return source;
      });

      return {
        mixedStream: destination.stream,
        cleanup: () => {
          sources.forEach((s) => s.disconnect());
          if (ctx.state !== 'closed') {
            ctx.close().catch(() => {});
          }
        },
      };
    } catch (e) {
      console.warn('Audio mixing failed, falling back to first audio track', e);
      return {
        mixedStream: validStreams[0],
        cleanup: () => {},
      };
    }
  }

  /**
   * Enumerate available microphone devices
   */
  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }

  /**
   * Stop all tracks in active microphone stream
   */
  stopMicrophone(): void {
    this.stopAudioMeter();
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }
}


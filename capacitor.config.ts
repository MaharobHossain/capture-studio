import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.capturestudio.app',
  appName: 'Capture Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CaptureStudio: {
      notificationTitle: 'Capture Studio Recording',
      notificationText: 'Screen recording is currently in progress...',
    }
  }
};

export default config;

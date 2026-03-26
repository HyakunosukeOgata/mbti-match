import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mochi.match',
  appName: 'Mochi 默契',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // SPA fallback: serve index.html for unknown routes (client-side routing)
    url: undefined,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Mochi',
  },
  android: {
    backgroundColor: '#FFF9F5',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFF9F5',
      showSpinner: false,
      launchAutoHide: true,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FF8C6B',
    },
  },
};

export default config;

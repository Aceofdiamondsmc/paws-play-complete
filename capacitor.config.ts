import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.pawsplayrepeat.app',
  appName: 'Paws Play Repeat',
  webDir: 'dist',
  server: {
    iosScheme: 'com.pawsplayrepeat.app', // Matches your actual Bundle ID
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: KeyboardResize.None,
      style: KeyboardStyle.Default,
      resizeOnFullScreen: false,
    },
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

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
  },
};

export default config;

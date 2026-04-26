import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.nhatran.littlesprout',
  appName: 'Little Sprout',
  webDir:  'dist',

  server: {
    androidScheme: 'https',
  },

  plugins: {
    StatusBar: {
      // Light text on sage-700 header background
      style:           'Light',
      backgroundColor: '#6B7A4F',
      overlaysWebView: false,
    },

    SplashScreen: {
      launchShowDuration:        2000,
      launchAutoHide:            true,
      backgroundColor:           '#FAF7F1',   // app-bg linen
      androidSplashResourceName: 'splash',
      androidScaleType:          'CENTER_CROP',
      showSpinner:               false,
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    Keyboard: {
      resize:          'body',
      resizeOnFullScreen: true,
    },

    // Haptics — configured per-call in src/hooks/useHaptics.js
    // Camera   — configured per-call in screens that need it
  },

  // Android-specific
  android: {
    // minSdkVersion 22 = Android 5.1+, covers ~99% of devices in Vietnam
    minWebViewVersion: 60,
    backgroundColor:   '#FAF7F1',
  },

  // iOS-specific
  ios: {
    contentInset:        'always',    // respect safe area insets
    backgroundColor:     '#FAF7F1',
    allowsLinkPreview:   false,
    scrollEnabled:       true,
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
